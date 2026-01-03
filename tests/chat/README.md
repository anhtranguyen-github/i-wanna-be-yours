# Chat Test Suite Walkthrough

A new test suite has been created in `backend/hanachan/test/chat/` to verify chat functionality, LLM connections, and error handling.

## Test Files

### 1. [test_openai_connect.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/chat/test_openai_connect.py)
**Goal**: Verify a direct connection to the OpenAI API (or configured LLM).
- **Run**: `backend/hanachan/.venv/bin/python backend/hanachan/test/chat/test_openai_connect.py`
- **Success**: Output includes `✅ OpenAI Connection Successful`.

### 2. [test_resource_handling.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/chat/test_resource_handling.py)
**Goal**: Verify the `ResourceProcessor` class instantiates and behaves as expected (mocked logic).
- **Run**: `backend/hanachan/.venv/bin/python backend/hanachan/test/chat/test_resource_handling.py`
- **Success**: Output includes `✅ Resource handling logic instantiation passed`.

### 3. [test_streaming.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/chat/test_streaming.py)
**Goal**: Verify the `AgentService.stream_agent` method yields chunks.
- **Run**: `backend/hanachan/.venv/bin/python backend/hanachan/test/chat/test_streaming.py`
- **Success**: Output includes `✅ Streaming Test Passed` and received response text.

### 4. [test_flows.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/chat/test_flows.py)
**Goal**: Verify multi-turn conversation memory.
- **Run**: `backend/hanachan/.venv/bin/python backend/hanachan/test/chat/test_flows.py`
- **Success**: Output includes `✅ Flow Test Passed`.

### 5. [test_error_handling.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/chat/test_error_handling.py)
**Goal**: Ensure the system handles edge cases (like empty prompts) without crashing.
- **Run**: `backend/hanachan/.venv/bin/python backend/hanachan/test/chat/test_error_handling.py`
- **Success**: Output demonstrates handled errors or resilient behavior.

## Usage
To run all tests (manually):
```bash
cd backend/hanachan
.venv/bin/python test/chat/test_openai_connect.py
.venv/bin/python test/chat/test_resource_handling.py
.venv/bin/python test/chat/test_streaming.py
.venv/bin/python test/chat/test_flows.py
.venv/bin/python test/chat/test_error_handling.py
```
