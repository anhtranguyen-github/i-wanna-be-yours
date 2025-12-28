import logging
import json
from typing import Dict, Any, Optional
from services.llm_factory import ModelFactory
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

class MemoryEvaluator:
    def __init__(self):
        self.llm = ModelFactory.create_chat_model(temperature=0)
        self.system_prompt = """You are the 'Memory Gatekeeper' for Hanachan, an AI language tutor.
Analyze the interaction between the User and the Assistant.
Categorize the information and decide if it's worth saving to permanent memory or temporary session context.

CRITERIA:
1. PERMANENT: Personal facts (job, age, level), life goals, long-term learning preferences, or significant life events.
2. SESSION: Roleplay roles (e.g., 'Pretend you are a doctor'), transient chat context, or scenario-specific instructions.
3. IGNORE: Greetings ('Hi', 'Hello'), small talk without data, generic politeness, repetitions of already known facts, or meta-talk about the UI.

GREETINGS AND BASIC POLITENESS ARE NEVER MEMORABLE.

JSON OUTPUT ONLY:
{{
  "is_memorable": boolean,
  "scope": "permanent" | "session" | "none",
  "category": "fact" | "preference" | "goal" | "roleplay" | "generic",
  "reason": "short explanation",
  "priority": 1-5
}}"""

    def evaluate_interaction(self, user_message: str, agent_response: str) -> Dict[str, Any]:
        """
        Evaluates whether an interaction should be stored in memory.
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.system_prompt),
                ("human", "User: {user_message}\nAssistant: {agent_response}")
            ])
            
            messages = prompt.format_messages(
                user_message=user_message,
                agent_response=agent_response
            )
            
            response = self.llm.invoke(messages).content
            return self._parse_json_safely(response)
        except Exception as e:
            logger.error(f"MemoryEvaluator: Evaluation failed: {e}")
            return {"is_memorable": False, "scope": "none", "reason": f"Error: {str(e)}"}

    def _parse_json_safely(self, text: str) -> Dict[str, Any]:
        try:
            # Clean up common LLM markdown noise
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"MemoryEvaluator: JSON parse failed: {e}")
            # Fallback if it's just a boolean-like string or something broken
            return {"is_memorable": False, "scope": "none", "reason": "Parse Error"}
