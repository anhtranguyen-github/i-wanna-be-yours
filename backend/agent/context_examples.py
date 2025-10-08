import json
from dataclasses import asdict
from datetime import date, datetime
from enum import Enum

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
        return super().default(obj)

def show_full_context_prompt_example():
    """
    A script to demonstrate the ContextManager building a complete, synthetic prompt.
    This simulates what happens inside the Flask application without running the server.
    """
    # We import the app and modules here to ensure the app context is available
    from agent.app import app
    # It's good practice to import the data models you're working with directly
    # for better readability and clarity, even if they might be imported by other modules.
    from agent.modules.data_models import Prompt, RetrievedKnowledgeItem, Turn, UserProfile, LearningGoal, UserQuery, QueryType, QueryPart

    from agent.modules.context.user_profile import UserProfile
    from agent.modules.context.conversation_history import ConversationHistory
    from agent.modules.context.learning_goals import LearningGoals
    from agent.modules.context.system_context import SystemContext
    from agent.modules.context.retrieved_knowledge import RetrievedKnowledge
    from agent.modules.context.context_manager import ContextManager

    # Create an application context to make 'app.logger' and other Flask globals available
    with app.app_context():
        # 1. Instantiate all the necessary components, just like in app.py
        user_profile = UserProfile()
        conversation_history = ConversationHistory()
        learning_goals = LearningGoals()
        system_context = SystemContext()
        retrieved_knowledge = RetrievedKnowledge()

        # 2. Instantiate the ContextManager with its dependencies
        context_manager = ContextManager(user_profile, conversation_history, learning_goals, system_context, retrieved_knowledge)

        # 3. Define the inputs for our synthetic prompt
        test_user_id = "user123"
        test_session_id = "session456"
        test_query = UserQuery(parts=[
            QueryPart(type=QueryType.TEXT, content="How do I use 'wa' vs 'ga'?"),
            # Example of how a future multi-modal query might look
            # QueryPart(type=QueryType.VOICE, content="https://example.com/audio/wa_vs_ga.mp3")
        ])

        # 4. Build the prompt data by calling the core logic method
        print("--- Building Example of a Full Context Prompt ---")
        prompt_object = context_manager.build_prompt_data(test_user_id, test_session_id, test_query) # type: ignore

        # 5. Print the final JSON output using our custom encoder
        print("\n--- Generated Prompt JSON ---")
        print(json.dumps(asdict(prompt_object), indent=2, cls=CustomJSONEncoder))

if __name__ == '__main__':
    show_full_context_prompt_example()