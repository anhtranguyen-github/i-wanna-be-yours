
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

# Configure logging for RQ worker
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s : %(message)s')
logger = logging.getLogger("hanachan.memory")

def process_interaction(session_id: str, user_id: str, user_message: str, agent_response: str):
    """
    Background task to process a chat interaction for episodic and semantic memory.
    """
    import time
    if not user_id:
        logger.error(f"❌ [WORKER] Missing user_id for session {session_id}. Aborting memory update.")
        return False
        
    logger.info(f"Starting memory processing for Session: {session_id}, User: {user_id}")
    
    # Pre-flight check for Qdrant with retry
    q_host = os.environ.get("QDRANT_HOST", "qdrant")
    q_port = os.environ.get("QDRANT_PORT", "6333")
    for attempt in range(3):
        try:
            import urllib.request
            with urllib.request.urlopen(f"http://{q_host}:{q_port}/collections", timeout=5) as resp:
                logger.debug(f"Qdrant Pre-flight check PASSED (attempt {attempt+1})")
                break
        except Exception as e:
            logger.warning(f"Qdrant Pre-flight check FAILED (attempt {attempt+1}): {e}")
            if attempt < 2:
                time.sleep(2)

    # Lazy initializations with retry for EpisodicMemory
    llm = ModelFactory.create_chat_model(temperature=0)
    episodic = None
    for attempt in range(3):
        try:
            episodic = EpisodicMemory()
            logger.debug(f"EpisodicMemory initialized (attempt {attempt+1})")
            break
        except Exception as e:
            logger.warning(f"EpisodicMemory init failed (attempt {attempt+1}): {e}")
            if attempt < 2:
                time.sleep(3)
    
    from memory.semantic import SemanticMemory
    from services.memory_evaluator import MemoryEvaluator
    
    semantic = SemanticMemory()
    evaluator = MemoryEvaluator()
    
    interaction_text = f"User: {user_message}\nAssistant: {agent_response}"
    
    # --- 0. Decision Point ---
    eval_result = evaluator.evaluate_interaction(user_message, agent_response)
    is_memorable = eval_result.get("is_memorable", False)
    scope = eval_result.get("scope", "none")
    reason = eval_result.get("reason", "No reason provided")
    category = eval_result.get("category", "generic")
    
    if not is_memorable or scope == "none":
        logger.info(f"⏭️ [GATEKEEPER] Skipping memory for session {session_id}. Reason: {reason}")
        return True

    logger.info(f"🎯 [GATEKEEPER] Accepted memory ({scope}/{category}). Reason: {reason}")
    
    # --- 1. Episodic Summarization ---
    try:
        summary_prompt = ChatPromptTemplate.from_messages([
            ("system", "Summarize this interaction in a single, descriptive sentence focusing on new information provided by the user."),
            ("human", "{interaction}")
        ])
        messages = summary_prompt.format_messages(interaction=interaction_text)
        summary = llm.invoke(messages).content
        
        meta = {
            "session_id": session_id, 
            "timestamp": datetime.utcnow().isoformat(),
            "scope": scope,
            "category": category
        }
        
        episodic.add_memory(summary, user_id=user_id, metadata=meta)
        logger.info(f"✅ [WORKER] Episodic memory updated: {summary[:50]}...")
    except Exception as e:
        logger.error(f"❌ [WORKER] Episodic processing failed: {e}")

    # --- 2. Semantic Extraction ---
    # Only run semantic extraction if scope is permanent
    if scope == "permanent":
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
                    semantic.add_relationships(valid_rels, user_id=user_id)
                    logger.info(f"✅ [WORKER] Semantic memory updated with {len(valid_rels)} relationships.")
        except Exception as e:
            logger.error(f"❌ [WORKER] Semantic extraction failed: {e}")

    # --- 3. Episode Management ---
    try:
        from app import create_app
        app = create_app()
        with app.app_context():
            EpisodeService.get_or_create_open_episode(session_id)
    except Exception as e:
        logger.error(f"❌ [WORKER] Episode management failed: {e}")

    logger.info(f"Finished processing interaction for session {session_id}")
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
