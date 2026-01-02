import os
import json
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from backend.hanachan.services.memory import MemoryService
from backend.hanachan.tools.notifier import NotificationService
from backend.hanachan.schemas.signal import Signal
from backend.hanachan.tools.progress_tools import ProgressService

class BetterStudyAgent:
    def __init__(self):
        self.memory = MemoryService()
        self.notifier = NotificationService()
        self.progress = ProgressService()
        self.llm = None
        if os.getenv("OPENAI_API_KEY"):
            self.llm = ChatOpenAI(model="gpt-4-turbo")

    def _build_system_prompt(self, user_id: str, query: str) -> str:
        facts = self.memory.retrieve_semantic_facts(user_id, query)
        history = self.memory.retrieve_episodic_memory(user_id, query)
        
        fact_str = "\n".join([f"- {f['fact']}" for f in facts])
        hist_str = "\n".join([f"- {h['content']}" for h in history])
        
        return f"""You are Hanachan, an empathetic and proactive Japanese language tutor.
KNOWLEDGE ABOUT USER:
{fact_str}

RECENT CONVERSATION HISTORY:
{hist_str}
"""

    def handle_interaction(self, input_data: Any):
        # Normalize Input
        user_id = "default_user"
        if isinstance(input_data, Signal):
            user_id = input_data.user_id
            user_input = f"[SIGNAL: {input_data.type}] {input_data.payload}"
        elif isinstance(input_data, dict):
            user_id = input_data.get("user_id", "default_user")
            user_input = input_data.get("message", "")
        else:
            user_input = str(input_data)

        # 1. FETCH REAL DATABASE STATS
        stats = self.progress.get_user_stats(user_id)
        
        # 2. CONTEXT ASSEMBLY
        system_prompt_text = self._build_system_prompt(user_id, user_input)
        if stats:
            system_prompt_text += f"\nREAL-TIME USER STATS: {json.dumps(stats)}"
        
        # 3. DECISION & GENERATION
        response_text = ""
        should_notify = False

        if self.llm:
            try:
                print(f"[Hanachan] Invoking OpenAI Model for {user_id}...")
                messages = [
                    SystemMessage(content=system_prompt_text),
                    HumanMessage(content=user_input)
                ]
                ai_msg = self.llm.invoke(messages)
                response_text = ai_msg.content
                # Heuristic for proactive notification (can be improved with LLM function calling)
                if "streak" in user_input.lower() or "at risk" in response_text.lower():
                    should_notify = True
            except Exception as e:
                print(f"[Hanachan] LLM Error: {e}. Falling back to heuristics.")
                response_text = self._fallback_logic(user_input, stats)
                should_notify = "streak" in user_input.lower()
        else:
            print(f"[Hanachan] No LLM found. Using heuristics.")
            response_text = self._fallback_logic(user_input, stats)
            should_notify = "streak" in user_input.lower()

        # ACTION: Proactive Notification
        if should_notify:
            self.notifier.send_notification(user_id, response_text, type="coaching_nudge")

        # MEMORY: Store this interaction
        self.memory.add_episodic_memory(
            user_id=user_id,
            text=f"User: {user_input} | Hanachan: {response_text}",
            metadata={"status": "responded", "stats_at_time": str(stats)}
        )

        # TRACING
        try:
            from backend.hanachan.services.observability import obs_service
            # We don't always have a trace_id if interaction was direct chat
            # but handle_interaction handles both
            t_id = getattr(input_data, 'trace_id', None) if isinstance(input_data, Signal) else "direct_chat"
            obs_service.log_event(t_id, user_id, "response_delivered", "SUCCESS", {
                "source": "openai" if self.llm else "heuristics",
                "notified": should_notify
            })
        except:
            pass

        return {
            "response": response_text,
            "user_id": user_id,
            "real_stats": stats,
            "source": "openai" if self.llm else "heuristics"
        }

    def _fallback_logic(self, user_input: str, stats: Optional[Dict]) -> str:
        vocab_count = stats['vocabulary_mastered'] if stats else 0
        streak_count = stats['current_streak'] if stats else 0
        if "streak" in user_input.lower():
            streak_msg = f" You have an amazing {streak_count}-day streak!" if streak_count > 0 else ""
            return f"I noticed your Japanese streak is at risk!{streak_msg} Want to do a quick 5-minute review?"
        return f"Your progress is impressive (Vocab: {vocab_count}). Your {streak_count}-day streak is safe. Let's study!"

study_agent = BetterStudyAgent()
