**Task Type:** Planning only (NO implementation)

**Feature Scope:**
Plan a feature that allows users to add **Resources** to the sidebar and attach them to the **current chat message**, with strict staging, upload validation, and commit sequencing.

---

## Objective

Design a plan for a **resource ingestion flow** where uploaded documents are:

1. Staged in the current chat message tray
2. Uploaded with visible progress and validation
3. Committed only when the user sends the message
4. Reflected in the Resources sidebar **after the agent response returns**

A mock agent must also be planned to return:

* A combined prompt constructed from user message + resources
* Metadata for all ingested resources (IDs, filenames)
* High-level suggestions derived from the resources

---

## Core Flow (Staging → Commit → Agent → Sidebar Refresh)

### 1. Staging Phase (Chat Message Tray)

* Uploaded documents are added to a **Chat Message Resource Tray**
* Each resource enters an **uploading state** with visible animation/progress
* Resources are marked as:

  * `isNew: true`
  * `status: uploading | success | failed`

---

### 2. Upload Validation & Send Lock

* The **Send Message button is disabled** while:

  * Any resource is still uploading
  * Any resource has failed to upload
* Users may only send the message when:

  * All staged resources have uploaded **successfully**
* Failed uploads must:

  * Show clear error feedback
  * Block message sending until resolved or removed

---

### 3. Commit Phase (Message Send)

* When the user sends the message:

  * All successfully uploaded resources are attached to the message payload
  * The Resource Tray is cleared **optimistically** (before API resolution)
* This ensures:

  * No orphaned uploads
  * No visual lag with large files

---

### 4. Agent Response Phase

* The agent processes:

  * User message
  * Attached resource IDs and metadata
* Agent returns:

  * Generated response
  * Prompt context used
  * Resource-derived insights or suggestions

---

### 5. Sidebar Refresh (Post-Agent)

* The **Resources sidebar is reloaded only after**:

  * The agent response is successfully received
* The refreshed sidebar must now include:

  * The newly ingested resources
  * Correct IDs, filenames, and metadata

---

## Frontend Behavior Requirements

### Duplicate Prevention

* Before adding a resource to the Tray:

  * Check existing resource IDs in local state
* If duplicate detected:

  * Show immediate feedback (toast or console warning)
  * Do **NOT** fail silently

---

### Loading & UX Feedback

* Show upload progress per resource
* Show non-blocking “Reading…” or “Uploading…” states
* UI remains interactive except for the locked Send action

---

## Known Failure Modes to Avoid (Anti-Patterns)

### ❌ Stale Sidebar After Agent

* **Symptom:** Agent references resources but sidebar doesn’t show them
* **Cause:** Sidebar refresh triggered too early
* **Plan Fix:** Refresh only after agent response resolves

---

### ❌ Premature Message Send

* **Symptom:** Message sent while resources are still uploading
* **Cause:** Missing send-lock validation
* **Plan Fix:** Hard-disable send until all resources are `status: success`

---

### ❌ Duplicate Resource Injection

* **Symptom:** Same file added multiple times to chat context
* **Cause:** Missing existence check
* **Plan Fix:** Always check by resource ID before adding to Tray

---

## Output Expectation

Provide:

* A **step-by-step architecture plan**
* Clear state transitions for:

  * Upload → Ready → Commit → Agent → Sidebar Refresh
* Explicit frontend vs backend vs agent responsibilities
* **No code, no implementation — planning only**
