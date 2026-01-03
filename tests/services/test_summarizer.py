import pytest
from unittest.mock import MagicMock, patch
from services.summarizer_service import SummarizerService

@pytest.fixture
def mock_llm():
    with patch('services.llm_factory.ModelFactory.create_chat_model') as mock_factory:
        mock_instance = MagicMock()
        mock_factory.return_value = mock_instance
        yield mock_instance

def test_summarize_messages_basic(mock_llm):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.content = "This is a summarized conversation."
    mock_llm.invoke.return_value = mock_response

    service = SummarizerService()
    messages = [
        {"role": "user", "content": "Hello, how can I learn Japanese?"},
        {"role": "assistant", "content": "You can start by learning Hiragana."}
    ]
    
    summary = service.summarize_messages(messages)
    
    assert summary == "This is a summarized conversation."
    assert mock_llm.invoke.called
    # Verify parts of the prompt
    args, _ = mock_llm.invoke.call_args
    prompt_content = args[0][1].content # HumanMessage
    assert "USER: Hello, how can I learn Japanese?" in prompt_content
    assert "ASSISTANT: You can start by learning Hiragana." in prompt_content

def test_resource_aware_summarization(mock_llm):
    mock_response = MagicMock()
    mock_response.content = "Summary with file reference."
    mock_llm.invoke.return_value = mock_response

    service = SummarizerService()
    messages = [
        {
            "role": "user", 
            "content": "Analyze this file", 
            "attachments": [{"title": "grammar.pdf", "id": 1}]
        }
    ]
    
    summary = service.summarize_messages(messages)
    
    args, _ = mock_llm.invoke.call_args
    prompt_content = args[0][1].content
    assert "[Files: grammar.pdf]" in prompt_content

@patch('utils.token_counter.estimate_tokens')
def test_recursive_summarization_trigger(mock_estimate, mock_llm):
    # Force recursive summarization by mocking token count
    # First call to total_text check: > limit
    # Subsequent calls (chunks): < limit
    mock_estimate.side_effect = [5000, 500, 500, 200]
    
    mock_response = MagicMock()
    mock_response.content = "Chunk summary"
    mock_llm.invoke.return_value = mock_response

    service = SummarizerService()
    service.chunk_limit = 4000
    
    # Large history
    messages = [{"role": "user", "content": "word " * 6000}]
    
    summary = service.summarize_messages(messages)
    
    # Verify it called invoke multiple times (one for each chunk + final reduction)
    assert mock_llm.invoke.call_count > 1
