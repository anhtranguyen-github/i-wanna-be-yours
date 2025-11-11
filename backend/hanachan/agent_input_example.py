import json
from dataclasses import asdict
from unittest.mock import patch
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

def generate_specific_hanachan_input_json():
    """
    A script to demonstrate the ContextManager building a complete, synthetic prompt.
    This simulates what happens inside the Flask application without running the server.
    It uses patching to override mock data for this specific scenario.
    """
    # We import the app and modules here to ensure the app context is available
    from app import app
    # It's good practice to import the data models you're working with directly
    # for better readability and clarity, even if they might be imported by other modules.
    from modules.data_models import UserProfile as UserProfileModel, LearningGoal, GoalStatus, RetrievedKnowledgeItem, KnowledgeType, UserQuery, QueryType, QueryPart

    from modules.context import UserProfile
    from modules.context import ConversationHistory
    from modules.context import Lear
    from modules.context import SystemContext
    from modules.context import RetrievedKnowledge

    # Create an application context to make 'app.logger' and other Flask globals available
    with app.app_context():
        # 1. Define the specific data for this example
        specific_user_profile = UserProfileModel(id="user123", name="Alex Doe", native_language="English", target_language="Japanese", proficiency_level="N4", interests=["food", "travel"])
        specific_learning_goal = LearningGoal(goal_id="goal789", topic="N3 Vocabulary", status=GoalStatus.ACTIVE, proficiency_target="N3", start_date=date(2023, 10, 1))
        
        retrieved_knowledge_content = """ 
                chữ gốc: 海（うみ）
                chữ gần giống: 河, 洗, 泳, 消
                chữ gốc: 林（はやし）
                chữ gần giống: 森, 校, 村, 板
                chữ gốc: 時（とき）
                chữ gần giống: 明, 昨, 映, 晴
                chữ gốc: 銀（ぎん）
                chữ gần giống: 鉄, 銅, 録, 鋭
                chữ gốc: 病（びょう）
                chữ gần giống: 疲, 痛, 症, 癖
                chữ gốc: 鳥（とり）
                chữ gần giống: 鶏, 鴨, 鳴, 鷹
                chữ gốc: 計（けい）
                chữ gần giống: 話, 読, 説, 記
                chữ gốc: 体（からだ）
                chữ gần giống: 休, 使, 借, 係
                chữ gốc: 思（おもう）
                chữ gần giống: 怒, 恋, 情, 忘
                chữ gốc: 花（はな）
                chữ gần giống: 草, 茶, 英, 菜
        """
        specific_knowledge = [RetrievedKnowledgeItem(type=KnowledgeType.DOCUMENT, content=retrieved_knowledge_content, source="internal_grammar_db:doc_ordering_food")]

        # 2. Use unittest.mock.patch to temporarily override the data-fetching methods
        with patch.object(UserProfile, '_get_profile_data', return_value=specific_user_profile), \
             patch.object(LearningGoals, '_get_goals_data', return_value=specific_learning_goal), \
             patch.object(RetrievedKnowledge, 'search', return_value=specific_knowledge):

            # 3. Instantiate all the necessary components
            user_profile = UserProfile()
            conversation_history = ConversationHistory()
            learning_goals = LearningGoals()
            system_context = SystemContext()
            retrieved_knowledge = RetrievedKnowledge()

            # 4. Instantiate the ContextManager with its dependencies
            context_manager = ContextManager(user_profile, conversation_history, learning_goals, system_context, retrieved_knowledge)

            # 5. Define the inputs for our synthetic prompt
            test_user_id = "user123"
            test_session_id = "session456"
            # This query is relevant to the user's interest (food) and the patched knowledge.
            test_query = UserQuery(parts=[QueryPart(type=QueryType.TEXT, content="Generate quiz with format: Meaning of 1 kanji, 4 options which 1 right answer and 3 wrong answers but have similarity with right answer")])

            # 6. Build the prompt data by calling the core logic method
            prompt_object = context_manager.build_prompt_data(test_user_id, test_session_id, test_query)

            # 7. Print the final JSON output using our custom encoder
            print(json.dumps(asdict(prompt_object), indent=2, cls=CustomJSONEncoder))

if __name__ == '__main__':
    generate_specific_hanachan_input_json()