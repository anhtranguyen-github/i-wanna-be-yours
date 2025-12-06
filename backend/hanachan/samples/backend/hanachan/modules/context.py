import json
import os
from typing import Any, Dict, List
from dataclasses import asdict
from datetime import date, datetime
from enum import Enum


from modules.data_models import (
    CurrentConversationGoal, Prompt, LearningGoal, RetrievedKnowledgeItem, 
    Speaker, Turn, UserProfileModel, UserQuery, QueryType, 
    QueryPart, GoalStatus, KnowledgeType
)

# --- Context Component Implementations ---

class UserProfile:
    def __init__(self, profile_dir: str = "profiles"):
        self.profile_dir = profile_dir
        if not os.path.exists(self.profile_dir):
            os.makedirs(self.profile_dir)

    def _parse_user_profile(self, data: Dict[str, Any]) -> UserProfileModel:
        """Parses the user profile data, converting date strings to date objects."""
        for goal in data.get("learning_goals", []):
            if "start_date" in goal and isinstance(goal["start_date"], str):
                goal["start_date"] = datetime.strptime(goal["start_date"], "%Y-%m-%d").date()
        
        # Convert goal status strings to GoalStatus enums
        for goal_data in data.get("learning_goals", []):
            if "status" in goal_data and isinstance(goal_data["status"], str):
                try:
                    goal_data["status"] = GoalStatus(goal_data["status"].upper())
                except ValueError:
                    # Handle cases where the status string is not a valid GoalStatus member
                    # For example, you could default it to ACTIVE or log a warning
                    goal_data["status"] = GoalStatus.ACTIVE


        
        # Create LearningGoal objects
        learning_goals = [LearningGoal(**goal) for goal in data.get("learning_goals", [])]
        
        return UserProfileModel(
            id=data["id"],
            name=data["name"],
            native_language=data["native_language"],
            target_language=data["target_language"],
            proficiency_level=data["proficiency_level"],
            interests=data["interests"],
            learning_goals=learning_goals
        )

    def _get_profile_data(self, user_id: str) -> UserProfileModel:
        """Core logic to fetch user profile data from a JSON file."""
        profile_path = os.path.join(self.profile_dir, f"{user_id}.json")
        
        if not os.path.exists(profile_path):
            # Return a default or empty profile if the user's file doesn't exist
            return UserProfileModel(
                id=user_id,
                name="New User",
                native_language="",
                target_language="",
                proficiency_level="",
                interests=[],
                learning_goals=[]
            )

        with open(profile_path, 'r') as f:
            profile_data = json.load(f)
        
        return self._parse_user_profile(profile_data)

class ConversationGoalTracker:
    def __init__(self):
        pass

    def _get_current_goal_data(self, session_id: str) -> CurrentConversationGoal:
        """Core logic to determine and retrieve the current, narrow goal of the conversation."""
        return CurrentConversationGoal(
            goal_id=f"chat_{session_id}",
            goal_description="Explain the difference between 'wa' and 'ga' with examples.",
            is_completed=False
        )

class SystemContext:
    def __init__(self):
        pass

    def _get_instructions_data(self) -> Dict[str, Any]:
        """Core logic to fetch ONLY the main system prompt/instructions."""
        instructions = {
            "system_prompt": "You are a helpful and encouraging language learning assistant. Your goal is to help the user achieve their current conversation goal and overall learning goals. Be sure to reference the retrieved knowledge where applicable.",
        }
        return instructions

class ConversationHistory:
    def __init__(self):
        pass

    def _get_history_data(self, session_id: str) -> List[Turn]:
        """Core logic to fetch conversation history data."""
        turns = [
            Turn(speaker=Speaker.USER, text="Hello!"),
            Turn(speaker=Speaker.AGENT, text="Hi there! How can I help you learn today?")
        ]
        return turns

class RetrievedKnowledge:
    def __init__(self):
        pass

    def search(self, query: str) -> List[RetrievedKnowledgeItem]:
        """Searches for knowledge relevant to the user's query."""
        if "wa" in query.lower() or "ga" in query.lower():
            return [
                RetrievedKnowledgeItem(type=KnowledgeType.DOCUMENT, content="The particle 'wa' is used for topic marking, while 'ga' is used for subject marking.", source="internal_grammar_db:doc_123")
            ]
        return []

class ContextManager:
    def __init__(self, user_id: str, session_id: str):
        self.user_id = user_id
        self.session_id = session_id
        self.user_profile = UserProfile()
        self.conversation_goal_tracker = ConversationGoalTracker()
        self.system_context = SystemContext()
        self.conversation_history = ConversationHistory()
        self.retrieved_knowledge = RetrievedKnowledge()

    def assemble_prompt(self, user_query_text: str) -> Prompt:
        """
        Assembles the complete prompt for the LLM by gathering context from all components.
        """
        # 1. Get User Profile
        user_profile_data = self.user_profile._get_profile_data(self.user_id)

        # 2. Get Conversation History
        history_data = self.conversation_history._get_history_data(self.session_id)

        # 3. Get Current Conversation Goal
        goal_data = self.conversation_goal_tracker._get_current_goal_data(self.session_id)

        # 4. Get System Instructions
        system_instructions = self.system_context._get_instructions_data()

        # 5. Retrieve Knowledge
        knowledge_items = self.retrieved_knowledge.search(user_query_text)
        
        # 6. Construct the UserQuery
        user_query = UserQuery(parts=[QueryPart(type=QueryType.TEXT, content=user_query_text)])

        # 7. Assemble the final prompt object
        prompt = Prompt(
            system_prompt=system_instructions,
            user_profile=user_profile_data,
            conversation_history=history_data,
            current_chat_goal=goal_data,
            retrieved_knowledge=knowledge_items,
            user_query=user_query
        )

        return prompt

if __name__ == '__main__':
    # Example Usage
    USER_ID = "user_123"
    SESSION_ID = "session_456"
    
    # Initialize the context manager
    context_manager = ContextManager(user_id=USER_ID, session_id=SESSION_ID)
    
    # User's query
    user_query_text = "What's the difference between 'wa' and 'ga'?"
    
    # Assemble the prompt
    final_prompt = context_manager.assemble_prompt(user_query_text)
    
    # Print the assembled prompt in a readable format
    print("--- Assembled Prompt ---")
    print(f"System Prompt: {final_prompt.system_prompt['system_prompt']}")
    print("\n--- User Profile ---")
    print(f"Name: {final_prompt.user_profile.name}")
    print(f"Proficiency: {final_prompt.user_profile.proficiency_level}")
    for goal in final_prompt.user_profile.learning_goals:
        print(f"  - Goal: {goal.topic} (Status: {goal.status.value})")
    
    print("\n--- Conversation History ---")
    for turn in final_prompt.conversation_history:
        print(f"{turn.speaker.value}: {turn.text}")
        
    print("\n--- Current Chat Goal ---")
    print(final_prompt.current_chat_goal.goal_description)

    print("\n--- Retrieved Knowledge ---")
    for item in final_prompt.retrieved_knowledge:
        print(f"- [{item.type.value}] {item.content}")

    print("\n--- User Query ---")
    print(final_prompt.user_query.parts[0].content)
    print("------------------------")

    # Demonstrate how to convert back to a dictionary if needed
    prompt_dict = asdict(final_prompt)
    # print("\n--- Prompt as Dictionary ---")
    # print(json.dumps(prompt_dict, indent=2, default=str))

class ConversationGoalTracker:
    def __init__(self):
        pass

    def _get_current_goal_data(self, session_id: str) -> CurrentConversationGoal:
        """Core logic to determine and retrieve the current, narrow goal of the conversation."""
        return CurrentConversationGoal(
            goal_id=f"chat_{session_id}",
            goal_description="Explain the difference between 'wa' and 'ga' with examples.",
            is_completed=False
        )

class SystemContext:
    def __init__(self):
        pass

    def _get_instructions_data(self) -> Dict[str, Any]:
        """Core logic to fetch ONLY the main system prompt/instructions."""
        instructions = {
            "system_prompt": "You are a helpful and encouraging language learning assistant. Your goal is to help the user achieve their current conversation goal and overall learning goals. Be sure to reference the retrieved knowledge where applicable.",
        }
        return instructions

class ConversationHistory:
    def __init__(self):
        pass

    def _get_history_data(self, session_id: str) -> List[Turn]:
        """Core logic to fetch conversation history data."""
        turns = [
            Turn(speaker=Speaker.USER, text="Hello!"),
            Turn(speaker=Speaker.AGENT, text="Hi there! How can I help you learn today?")
        ]
        return turns

class RetrievedKnowledge:
    def __init__(self):
        pass

    def search(self, query: str) -> List[RetrievedKnowledgeItem]:
        """Searches for knowledge relevant to the user's query."""
        if "wa" in query.lower() or "ga" in query.lower():
            return [
                RetrievedKnowledgeItem(type=KnowledgeType.DOCUMENT, content="The particle 'wa' is used for topic marking, while 'ga' is used for subject marking.", source="internal_grammar_db:doc_123")
            ]
        return []

