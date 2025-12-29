# Integrated Workflow Tests

This directory contains end-to-end integration tests that simulate realistic user workflows. These tests combine multiple system components (RAG, Memory, Streaming, Content Generation) to verify complex behaviors.

## Workflows

### 1. [workflow_study_session.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/workflows/workflow_study_session.py)
**Scenario**: User opens a "Study Session" with a specific textbook/resource, asks a question, and then asks a follow-up question.
- **Verifies**:
    - **Resource Context Injection**: Checks if the agent receives resource IDs (mocked).
    - **Multi-turn Memory**: Ensures the agent "remembers" the first question/answer when handling the second prompt.
    - **Consistency**: The user shouldn't need to re-state context.

### 2. [workflow_content_creation.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/workflows/workflow_content_creation.py)
**Scenario**: User explicitly requests a study artifact (e.g., "Make me a N5 vocabulary quiz").
- **Verifies**:
    - **Intent Detection**: The `ContentCreatorService` or `MockAgent` logic triggers the correct path.
    - **Artifact Generation**: The response contains a structured `quiz` artifact (JSON/Dict) rather than just text.
    - **Response Structure**: Validates the `ResponseItemDTO` format.

### 3. [workflow_long_streaming.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/workflows/workflow_long_streaming.py)
**Scenario**: User requests a long-form response (e.g., a story).
- **Verifies**:
    - **Stability**: The stream generator (`AgentService.stream_agent`) doesn't time out or disconnect.
    - **Completeness**: Receiving the full length of the generated content.
    - **Performance**: Logs the time taken to stream the response.

### 4. [workflow_real_ingestion.py](file:///mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/backend/hanachan/test/workflows/workflow_real_ingestion.py)
**Scenario**: Ingests real files from `backend/hanachan/test/workflows/resources/` via real HTTP Upload, tests Deduplication, and RAG.
- **Setup**: Place files in `backend/hanachan/test/workflows/resources/` (e.g., `sample_grammar.txt`).
- **Verifies**:
    - **Real Ingestion**: Uploads file to Flask API (Post 5100).
    - **Deduplication**: Ensures re-uploading the same file returns existing ID.
    - **Indexing**: Triggers background ingestion working with real Flask backend.
    - **RAG Retrieval**: Chat query retrieves context from the real file.
    - **Answer Accuracy**: Agent uses the file content to summarize or answer questions (e.g., "Summarize this").

## Usage

To run a specific workflow (ensure you are in `backend/hanachan`):

```bash
# Workflow 1: Study Session
.venv/bin/python test/workflows/workflow_study_session.py

# Workflow 2: Content Creation
.venv/bin/python test/workflows/workflow_content_creation.py

# Workflow 3: Long Streaming
.venv/bin/python test/workflows/workflow_long_streaming.py

# Workflow 4: Real Resource Ingestion
.venv/bin/python test/workflows/workflow_real_ingestion.py
```
