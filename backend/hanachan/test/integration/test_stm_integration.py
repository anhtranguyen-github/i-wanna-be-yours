import pytest
from unittest.mock import MagicMock, patch
from services.agent_service import AgentService
from schemas.chat import AgentRequest, ContextConfigurationDTO
from models.conversation import Conversation
from models.message import ChatMessage
from app import create_app, db

@pytest.fixture
def app():
    # Use PostgreSQL for testing - same as production
    db_url = 'postgresql://user:password@localhost:5433/mydatabase'
    app = create_app({'SQLALCHEMY_DATABASE_URI': db_url, 'TESTING': True})
    with app.app_context():
        db.create_all()
        yield app

def test_stream_agent_uses_summary(app):
    with app.app_context():
        # 1. Setup Data
        conv = Conversation(session_id="test-session", user_id="user-123", summary="This is an existing summary")
        db.session.add(conv)
        db.session.commit()
        
        # 2. Mock Agent
        with patch('agent.core_agent.HanachanAgent.invoke') as mock_invoke:
            mock_invoke.return_value = iter(["Hello"])
            
            service = AgentService()
            request = AgentRequest(
                session_id="test-session",
                user_id="user-123",
                prompt="Tell me more",
                context_config=ContextConfigurationDTO(resource_ids=[])
            )
            
            # Consume generator
            list(service.stream_agent(request))
            
            # 3. Verify
            assert mock_invoke.called
            _, kwargs = mock_invoke.call_args
            assert kwargs['summary'] == "This is an existing summary"
            assert kwargs['prompt'] == "Tell me more"

def test_history_filtering_by_summary_bookmark(app):
    with app.app_context():
        # 1. Setup Data: Conversation with 5 messages, summarized up to ID 3
        conv = Conversation(session_id="test-session-2", user_id="user-123", summary="Early history condensed", last_summarized_msg_id=3)
        db.session.add(conv)
        db.session.commit()
        
        # Add 5 messages
        for i in range(1, 6):
            msg = ChatMessage(conversation_id=conv.id, role="user", content=f"Msg {i}")
            db.session.add(msg)
        db.session.commit()
        
        # 2. Mock Agent
        with patch('agent.core_agent.HanachanAgent.invoke') as mock_invoke:
            mock_invoke.return_value = iter(["Hello"])
            
            service = AgentService()
            request = AgentRequest(
                session_id="test-session-2",
                user_id="user-123",
                prompt="Continue",
                context_config=ContextConfigurationDTO(resource_ids=[])
            )
            
            list(service.stream_agent(request))
            
            # 3. Verify
            _, kwargs = mock_invoke.call_args
            history = kwargs['chat_history']
            
            # Should only include Msg 4 and Msg 5 (ID > 3)
            # Wait, IDs in sqlite memory start at 1. Correct.
            # Except the current Msg (which is also ID 6) might be filtered out by user_msg_id logic
            contents = [m['content'] for m in history]
            assert "Msg 1" not in contents
            assert "Msg 2" not in contents
            assert "Msg 3" not in contents
            assert "Msg 4" in contents
            assert "Msg 5" in contents
