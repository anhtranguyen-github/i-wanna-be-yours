
import os
import json
import logging
import uuid
from datetime import datetime
from services.llm_factory import ModelFactory
from langchain_core.prompts import ChatPromptTemplate
from memory.episodic import EpisodicMemory
from memory.semantic import SemanticMemory
from schemas.memory import Relationship
from services.episode_service import EpisodeService
from database.database import db

logger = logging.getLogger(__name__)

def process_interaction(session_id: str, user_message: str, agent_response: str):
    """
    Background task to process a chat interaction for episodic and semantic memory.
    """
    logger.info(f"⚡ [WORKER] Starting memory processing for Session: {session_id}")
    
    # Lazy initializations
    llm = ModelFactory.create_chat_model(temperature=0)
    episodic = EpisodicMemory()
    semantic = SemanticMemory()
    
    interaction_text = f"User: {user_message}\nAssistant: {agent_response}"
    
    # --- 1. Episodic Summarization ---
    try:
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "Summarize this interaction in a single, descriptive sentence focusing on new information provided by the user."),
            ("human", "{interaction}")
        ])
        messages = summary_prompt.format_messages(interaction=interaction_text)
        summary = llm.invoke(messages).content
        
        episodic.add_memory(summary, metadata={"session_id": session_id, "timestamp": datetime.utcnow().isoformat()})
        logger.info(f"✅ [WORKER] Episodic memory updated: {summary[:50]}...")
    except Exception as e:
        logger.error(f"❌ [WORKER] Episodic processing failed: {e}")

    # --- 2. Semantic Extraction ---
    try:
        extraction_prompt = ChatPromptTemplate.from_messages([
            ("system", """Extract key entities and relationships from the interaction.
Target entities: User, Topic, Level, Goal, Preference.
Relationships: LIKES, WANTS_TO_LEARN, HAS_GOAL, IS_AT_LEVEL.
Return strictly JSON in the format: {{"relationships": [{{"source": {{"id": "...", "type": "..."}}, "target": {{"id": "...", "type": "..."}}, "type": "..."}}]}}
Empty list if no relevant information found."""),
            ("human", "{interaction}")
        ])
        
        messages = extraction_prompt.format_messages(interaction=interaction_text)
        response = llm.invoke(messages).content
        
        kg_data = _parse_json_safely(response)
        if kg_data and "relationships" in kg_data:
            valid_rels = []
            for rel in kg_data["relationships"]:
                try:
                    valid_rels.append(Relationship(**rel))
                except:
                    continue
            if valid_rels:
                semantic.add_relationships(valid_rels)
                logger.info(f"✅ [WORKER] Semantic memory updated with {len(valid_rels)} relationships.")
    except Exception as e:
        logger.error(f"❌ [WORKER] Semantic extraction failed: {e}")

    # --- 3. Episode Management ---
    # Note: In a real app, we might need a way to find the message_id. 
    # For now, we skip explicit ID tracking unless we pass them from the agent.
    # But we can at least ensure an episode exists.
    try:
        from app import create_app
        app = create_app()
        with app.app_context():
            EpisodeService.get_or_create_open_episode(session_id)
    except Exception as e:
        logger.error(f"❌ [WORKER] Episode management failed: {e}")

    return True

def _parse_json_safely(text: str):
    try:
        # Clean up common LLM markdown noise
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned)
    except:
        return None
