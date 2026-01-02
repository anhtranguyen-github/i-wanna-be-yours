# Implementation Plan: Conversation Summarization for Context Window Management

## 1. Objective
Implement a "Summarization Strategy" to manage the Short-Term Memory (Context Window). Instead of simply truncating older messages when the token limit (2000 tokens) is reached, we will:
1.  Detect when the conversation history is getting too long.
2.  Use a Lightweight LLM (or the main model) to generate a concise summary of the older messages.
3.  Inject this **Running Summary** at the start of the context, followed by the most recent 5-10 raw messages.
4.  Persist the summary so it doesn't need to be re-generated on every turn.

## 2. Architecture Changes

### A. Database Schema Update (`backend/hanachan/models/conversation.py`)
Add a field to store the running summary.
```python
class Conversation(db.Model):
    # ... existing fields ...
    summary = db.Column(db.Text, nullable=True) # Stores the running summary of older messages
    last_summarized_msg_id = db.Column(db.Integer, nullable=True) # Checkpoint to know where we left off
```

### B. Logic Flow Update (`backend/hanachan/services/agent_service.py`)

**Current Logic:**
*   Fetch last 50 messages.
*   Token count backwards until 2000 tokens.
*   Discard the rest.

**New Logic:**
1.  **Retrieve Summary**: Fetch `conversation.summary`.
2.  **Retrieve Recent History**: Fetch messages *after* `last_summarized_msg_id`.
3.  **Check Threshold**:
    *   If `(Summary Tokens + Recent History Tokens) < MAX_CONTEXT`, send everything.
    *   If `> MAX_CONTEXT`, trigger **Summarization Task**.
4.  **Summarization Task** (Background or Blocking):
    *   Take the *oldest* chunk of "Recent History" (e.g., messages 1-10 of the new batch).
    *   Combine with existing `summary`.
    *   Prompt LLM: *"Update the following summary with these new interaction details..."*
    *   Save new `summary` to DB.
    *   Update `last_summarized_msg_id`.
    *   Retry step 3 with new condensed state.

## 3. Implementation Steps

### Step 1: Add Summary Tool/Function
Create `backend/hanachan/services/summarizer_service.py`.
*   **Function**: `summarize_conversation(current_summary: str, new_messages: List[Dict]) -> str`
*   **Prompt**: "You are a helpful assistant maintaining a running summary of a conversation. Here is the previous summary: [SUMMARY]. Here are the new lines of conversation: [MESSAGES]. Incorporate the new key details into the summary, keeping it under 200 words."

### Step 2: Update `AgentService.stream_agent`
Refactor the history loading block (Lines 369-406).
*   Instead of just `ChatMessage.query...limit(50)`, we need logic to merge the stored summary with recent messages.
*   **Prompt Injection**:
    ```python
    messages = [SystemMessage(content=system_prompt)]
    if conversation.summary:
        messages.append(SystemMessage(content=f"PREVIOUS CONVERSATION SUMMARY: {conversation.summary}"))
    # ... append recent raw messages ...
    ```

### Step 3: Triggering (Optimization)
To avoid latency on *every* chat, run the summarization **asynchronously** after the response is sent (using background tasks/Redis), OR only run it when the `recent_messages` count exceeds a specific "Soft Limit" (e.g., > 10 messages).

## 4. Resource-Aware Strategy (Critical)

**Problem:** Chat context includes large Resource Excerpts (RAG) which must not be permanently compressed into the summary, as future questions might need different parts of the same file.

**Solution:** Separate **References** from **Content**.

1.  **RAG Layer (Unchanged)**:
    *   Continue to fetch fresh Resource Chunks from Qdrant/Vectors for *every* request based on the user's current query.
    *   **Do NOT** include the raw text of these chunks in the text being sent to the Summarizer.

2.  **Summarizer Prompt Update**:
    *   Instruct the summarizer to track *references* to files.
    *   *Bad:* "User asked about the file."
    *   *Good:* "User uploaded `grammar.pdf` (ID: 123) and asked about Topic Markers. AI explained 'Wa' vs 'Ga'."

3.  **Context Construction Order**:
    1.  `System Prompt`
    2.  `RAG Context` (Freshly fetched for this turn)
    3.  `Conversation Summary` (Historical flow: "User verified X, AI corrected Y")
    4.  `Recent History` (Raw text)

## 5. Handling Massive Inputs: Recursive Summarization

**Problem:** User input or accumulated context exceeds the token limit (e.g., pasting a large block of text or highly detailed conversation logs).

**Solution:** Recursive (Tree) Summarization.

1.  **Detection**: If `estimate_tokens(input_text) > CHUNK_LIMIT` (e.g., 4000 tokens):
2.  **Partition**: Split the text into $N$ chunks of size `CHUNK_LIMIT`.
3.  **Map (Summarize Chunks)**:
    *   Parallel request to LLM for each chunk: *"Summarize the following text segment in 3 sentences, preserving key entities and numbers."*
4.  **Reduce (Synthesize)**:
    *   Combine the $N$ mini-summaries into one block.
    *   If the result is still too large, repeat the process.
    *   Otherwise, use this final summary as the context representation.

## 6. Verification Plan
1.  **Unit Test**: Create a fake conversation with 50 messages. Verify the service condenses the first 40 into a summary and retains the last 10.
2.  **Integration Test**: Chat with Hanachan for 20 turns. Check the SQLite DB `conversations` table to see if the `summary` column populates.
3.  **RAG Test**: Upload a PDF, ask a question (Turn 1), chat for 20 turns about other things, then ask about the PDF again. Verify the RAG layer still retrieves the correct info (proving it wasn't "lost" in summarization).
4.  **Recursion Test**: Feed a 10,000 token text block and verify it returns a coherent < 500 token summary without crashing context limits.
