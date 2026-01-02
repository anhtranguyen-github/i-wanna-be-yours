import pytest
import os
from unittest.mock import MagicMock, patch
from tasks.summarization import summarize_conversation_task
from models.conversation import Conversation
from models.message import ChatMessage
from app import create_app, db

@pytest.fixture
def app():
    db_path = "/tmp/test_stm_task.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
        
    app = create_app({'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}', 'TESTING': True})
    with app.app_context():
        db.create_all()
        yield app
    
    if os.path.exists(db_path):
        os.remove(db_path)

def test_summarization_task_updates_db(app):
    with app.app_context():
        # 1. Setup Data: Conversation with 10 messages (over buffer of 6)
        conv = Conversation(session_id="task-test", user_id="user-1")
        db.session.add(conv)
        db.session.commit()
        
        for i in range(1, 11):
            msg = ChatMessage(conversation_id=conv.id, role="user" if i%2 != 0 else "assistant", content=f"Message {i}")
            db.session.add(msg)
        db.session.commit()
        
        # 2. Mock Agent/Summarizer
        with patch('services.llm_factory.ModelFactory.create_chat_model') as mock_llm_factory:
            mock_llm = MagicMock()
            mock_llm.invoke.return_value.content = "Summary of first 4 messages"
            mock_llm_factory.return_value = mock_llm
            
            # 3. Run Task Synchronously
            summarize_conversation_task(conv.id)
            
            # 4. Verify DB
            db.session.refresh(conv)
            assert conv.summary == "Summary of first 4 messages"
            # RAW_BUFFER_TURNS is 6. Messages are 1-10.
            # to_summarize should be messages[:4] (1, 2, 3, 4).
            # last_summarized_msg_id should be ID of Message 4.
            msg4 = ChatMessage.query.filter_by(content="Message 4").first()
            assert conv.last_summarized_msg_id == msg4.id

def test_summarization_task_skips_short_history(app):
    with app.app_context():
        # 1. Setup Data: Only 2 messages
        conv = Conversation(session_id="task-short", user_id="user-1")
        db.session.add(conv)
        db.session.commit()
        
        db.session.add(ChatMessage(conversation_id=conv.id, role="user", content="Hi"))
        db.session.commit()
        
        with patch('services.summarizer_service.SummarizerService.summarize_messages') as mock_sum:
            summarize_conversation_task(conv.id)
            assert not mock_sum.called
            db.session.refresh(conv)
            assert conv.summary is None
