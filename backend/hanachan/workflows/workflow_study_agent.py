from typing import Dict, Any, List, Optional
from backend.hanachan.services.memory import MemoryService
from backend.hanachan.schemas.signal import Signal

class StudyAgentWorkflow:
    def __init__(self):
        self.memory = MemoryService()

    def run(self, input_data: Any) -> Dict[str, Any]:
        """
        Main entry point for the agent.
        input_data can be:
        1. str (User Message)
        2. Signal (System Event)
        """
        user_id = "unknown"
        context_str = ""
        
        # 1. Input Normalization
        if isinstance(input_data, Signal):
            user_id = input_data.user_id
            query = f"Signal: {input_data.type} Payload: {input_data.payload}"
            interaction_type = "signal"
        else:
            # Assume dict or string
            if isinstance(input_data, str):
                # Simple string input (mock)
                user_id = "default_user"
                query = input_data
            else:
                user_id = input_data.get("user_id", "default_user")
                query = input_data.get("message", "")
            interaction_type = "conversation"

        # 2. MEMORY RETRIEVAL (Phase 1)
        # Retrieve facts (Who is this user?)
        facts = self.memory.retrieve_semantic_facts(user_id, query=query)
        fact_str = "\n".join([f"- {f['fact']}" for f in facts])
        
        # Retrieve recent history (What happened before?)
        history = self.memory.retrieve_episodic_memory(user_id, query=query)
        hist_str = "\n".join([f"- {h['content']}" for h in history])
        
        context_str = f"User Facts:\n{fact_str}\n\nRecent History:\n{hist_str}"
        print(f"[Agent] Retrieved Context for {user_id}: {len(facts)} facts, {len(history)} episodes.")

        # 3. REASONING (Mock LLM)
        # In real world: response = llm.invoke(system_prompt + context_str + user_query)
        response_text = ""
        action = None
        
        if interaction_type == "signal":
             response_text = f"Acknowledged signal: {query}. Updated internal state."
             # If signal is important, maybe trigger an action
             if "streak" in query:
                 action = "send_notification"
                 response_text = "Your streak is at risk! Do 5 mins now?"
        else:
             response_text = f"Based on what I know ({len(facts)} facts), here is my answer: {query}"

        # 4. REFLECTION & STORAGE (Phase 1)
        # Store this interaction
        self.memory.add_episodic_memory(
            user_id=user_id, 
            text=f"Input: {query} | Response: {response_text}",
            metadata={"source": interaction_type}
        )
        
        return {
            "response": response_text,
            "action": action,
            "context_used": context_str
        }

# Singleton instance
agent_workflow = StudyAgentWorkflow()

def run_study_agent(message: str):
    # Compatibility wrapper for old tests
    result = agent_workflow.run(message)
    return result["response"]
