
# Implementation Plan: LLM Rate Limit Fallback

## Objective
Enhance the system's resilience by implementing an automatic fallback mechanism for LLM calls. When the primary provider (e.g., OpenAI) encounters rate limits (`429`) or quota errors, the system should seamlessly switch to a secondary provider (e.g., local Ollama or a Mock) to complete the request.

## Problem Analysis
- **Current State**: `ModelFactory` instantiates a single `BaseChatModel` based on `LLM_PROVIDER`.
- **Failure Mode**: When OpenAI returns `429 Insufficient Quota`, the application raises an exception, disrupting the user session or test flow.
- **Requirement**: A "Backup Generator" style failover that engages when the grid goes down.

## Proposed Solution: LangChain `with_fallbacks`

We will modify `hanachan/services/llm_factory.py` to support a configured `LLM_FALLBACK_PROVIDER`.

### 1. Configuration Changes
Introduce new environment variables:
- `LLM_FALLBACK_PROVIDER`: (e.g., "ollama", "mock")
- `LLM_FALLBACK_MODEL`: (e.g., "mistral", "qwen2.5:0.5b")

### 2. Code Changes (`hanachan/services/llm_factory.py`)

Update `create_chat_model` logic:

```python
def create_chat_model(temperature: float = 0.7) -> BaseChatModel:
    primary_provider = os.environ.get("LLM_PROVIDER", "openai").lower()
    fallback_provider = os.environ.get("LLM_FALLBACK_PROVIDER", "mock") # Default to mock for safety
    
    # 1. Create Primary
    primary_llm = _create_specific_model(primary_provider, temperature)
    
    # 2. Create Fallback
    if fallback_provider and fallback_provider != "none":
        try:
            fallback_llm = _create_specific_model(fallback_provider, temperature)
            
            # 3. Bind Fallback
            # Verify exceptions to catch: openai.RateLimitError, etc.
            return primary_llm.with_fallbacks([fallback_llm])
        except Exception as e:
            logger.warning(f"Failed to initialize fallback provider {fallback_provider}: {e}")
            return primary_llm
            
    return primary_llm
```

### 3. Implement `MockChatModel`
For testing environments (like the one currently running `long_run_session_test.py`), a local Ollama might not be running or might be too heavy. A simple `MockChatModel` that returns deterministic responses is safest for "insufficient_quota" errors during CI/CD or lightweight testing.

```python
class MockChatModel(BaseChatModel):
    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content="[FALLBACK] System is currently experiencing high load. I am a simplified backup agent."))])
    @property
    def _llm_type(self): return "mock"
```

## Execution Steps
1.  **Refactor**: Extract model creation into a helper `_create_single_model` to reuse logic.
2.  **Mock**: Add `MockChatModel` definition to `llm_factory.py` (or a utility file).
3.  **Implement**: Update `create_chat_model` to apply `with_fallbacks`.
4.  **Verify**: Run `long_run_session_test.py` again. It should fail on OpenAI but recover via Mock/Ollama.

