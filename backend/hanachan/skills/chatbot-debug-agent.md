# Skill Card: Universal Debug & Echo Agent (DevEx)

**Context:** General AI/RAG System Development
**Epic:** Developer Experience & Integration
**Priority:** Foundational
**Status:** Live Standard

---

## 1. Core Concept
> "A specialized 'Mock Agent' designed not to reason, but to **reflect**. It serves as a hardened mirror for the backend pipeline, verifying that inputs (prompts, files, configurations) traverse the entire stack intact before reaching expensive API logic."

---

## 2. Universal Requirements

### A. Input Fidelity (The "Echo")
* **Raw Prompt Reflection:** Must return the user's prompt exactly as received by the backend service. This exposes encoding issues or truncation bugs.
* **Identity Verification:** Explicitly state the `Session ID` and `User ID` context to debug state contamination between sessions.

### B. Asset Verification
* **Resource Manifest:** List all attached assets (documents, images, context chunks) that successfully made it to the processing layer.
* **Type & Metadata:** Show detected MIME types and IDs. *Crucial for debugging file uploaders and parsers.*

### C. System Telemetry
* **Persistence Confirmation:** If the system has a database, confirm the message was saved (e.g., display `Message ID`).
* **Config Dump:** Reveal hidden parameters (temperature, model name, RAG toggle) that were active for the request.

---

## 3. Implementation Blueprint

### Recommended Architecture
* **Module:** `agent/mock_agent.py` (or equivalent `debug/` package)
* **Pattern:** Strategy Pattern. The main `AgentService` should strictly delegate to `MockAgent` when `model="debug"` or `env=DEV`.
* **Output Standard:** Markdown. It renders cleanly in almost all chat UIs and supports structure (lists, code blocks).

### Reference Output Structure
```markdown
### 🕵️ Debug Agent Report
**Session Context:** `{session_id}` | `{user_id}`

**1. Input Received:**
> {prompt}

**2. Attachments:**
- [ID: 101] `data.csv` (text/csv)
- [ID: 102] `diagram.png` (image/png)

**3. Internal State:**
- **DB Write:** ✅ Success (ID: 99)
- **Model Config:** `{ "temp": 0.0, "tools": [...] }`
```

---

## 4. Acceptance Criteria
- [x] Returns valid 200 OK response.
- [x] Displays all attached resources.
- [x] Formats output in clean, readable Markdown.
- [x] Does not crash on "metadata" or missing fields.
