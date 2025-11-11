import json
from dataclasses import asdict
from datetime import date, datetime
from enum import Enum
from typing import List, Dict, Any

# --- Import ALL necessary classes from the amalgamated context file ---
# Assuming you saved the final context code into a file named 'context_modules.py'
from modules.context.combined_context import (
    ContextManager, UserProfile, ConversationHistory, SystemContext, 
    RetrievedKnowledge, ToolContext, ConversationGoalTracker
)

# Also import the data model structures for initialization
from modules.data_models import (
    Prompt, UserQuery, QueryType, QueryPart, LearningGoal, GoalStatus, 
    Turn, Speaker, RetrievedKnowledgeItem, KnowledgeType, UserProfileModel
)


class CustomJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder to handle special data types like datetime and enums,
    making the output clean and readable.
    """
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        # Handle dataclasses explicitly if asdict didn't catch everything (though it should)
        if isinstance(obj, (UserProfileModel, LearningGoal, UserQuery, QueryPart, Turn, RetrievedKnowledgeItem)):
             return asdict(obj)
        return super().default(obj)

def show_full_context_prompt_example():
    """
    A script to demonstrate the ContextManager building a complete, synthetic prompt 
    in a pure Python environment, ready for the FastAPI application.
    """
    
    # 1. Instantiate all the necessary components (No Flask Context required)
    # These dependencies are initialized once at application startup in a FastAPI app
    user_profile = UserProfile()
    conversation_history = ConversationHistory()
    system_context = SystemContext()
    retrieved_knowledge = RetrievedKnowledge()
    tool_context = ToolContext()                      # New Dependency
    conversation_goal_tracker = ConversationGoalTracker() # New Dependency

    # 2. Instantiate the ContextManager with ALL its dependencies
    context_manager = ContextManager(
        user_profile=user_profile, 
        conversation_history=conversation_history, 
        system_context=system_context, 
        retrieved_knowledge=retrieved_knowledge,
        tool_context=tool_context, 
        conversation_goal_tracker=conversation_goal_tracker
    )

    # 3. Define the inputs for our synthetic prompt (simulating FastAPI request data)
    test_user_id = "user123"
    test_session_id = "session456"
    
    # We must use the internal QueryPart/UserQuery objects here, not the Pydantic models
    test_query = UserQuery(parts=[
        QueryPart(type=QueryType.TEXT, content="How do I use 'wa' vs 'ga'?"),
    ])
    
    # Convert the internal UserQuery object to the Pydantic format expected by build_prompt_data
    # For this demonstration, we'll bypass the Pydantic model conversion inside the ContextManager
    # and call the core logic method directly.
    
    print("--- Building Example of a Full Context Prompt ---")
    
    # 4. Build the prompt data by calling the core logic method
    # Note: We must adjust the arguments to match the simplified structure of the core method
    prompt_object = context_manager.build_prompt_data(
        user_id=test_user_id, 
        session_id=test_session_id, 
        user_query_model=test_query # Passed as the internal dataclass for the demo's simplicity
    )

    # 5. Print the final JSON output
    print("\n--- Generated Prompt JSON (Ready for LLM) ---")
    print(json.dumps(asdict(prompt_object), indent=2, cls=CustomJSONEncoder))

if __name__ == '__main__':
    # Ensure you have saved the previous code as 'context_modules.py' and run this script.
    show_full_context_prompt_example()