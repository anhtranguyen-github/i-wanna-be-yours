# Chatbot Upgrade Specification

## Study Material Generation + Mock Agent Debug + Right Sidebar Artifacts

---

## 1. Purpose

This document defines the upgraded chatbot system that combines:

* Debug-friendly **Mock Agent (echo + system state)**
* **AI Study Planner** that generates learning artifacts
* **Chat-embedded study cards**
* A **Right Sidebar Artifact Panel** for persistent access and deep reading

The chatbot evolves into:

> “A conversational tutor with a persistent study workspace.”

---

## 2. Key UI Surfaces

### Primary Surfaces

1. **Chat Area (Center)**
2. **Right Sidebar – Artifacts Panel (NEW, persistent)**

The chat is for **generation & guidance**
The right sidebar is for **consumption & review**

---

## 3. Artifact Lifecycle (End-to-End)

1. User sends message (+ optional resources)
2. Agent:

   * Echoes/debugs input
   * Detects study intent
   * Generates artifacts
3. Artifacts:

   * Render as **cards in chat**
   * Are **persisted**
   * Appear instantly in **Right Sidebar**
4. User can:

   * Click card in chat → open artifact
   * Click item in sidebar → open artifact
5. Artifact opens inside **expanded right sidebar**

---

## 4. Right Sidebar – Artifacts Panel (NEW)

### 4.1 Sidebar Purpose

The right sidebar acts as a **persistent learning workspace**, allowing users to:

* Reopen generated artifacts
* Read, study, and interact without losing chat context
* Switch between multiple artifacts quickly

---

### 4.2 Sidebar Default State

* Sidebar is **visible but collapsed** by default
* Shows:

  * Section title: **Artifacts**
  * List of artifact items (titles only)

Example (collapsed):

```text
Artifacts
• JLPT N5 Vocabulary Practice
• Essential Verbs (Taberu / Nomu)
• Particle Usage: Wa vs Ga
```

---

### 4.3 Artifact Item Structure (Sidebar List)

Each sidebar item includes:

* Artifact icon (quiz / flashcard / note)
* Title
* Optional badge:

  * `NEW`
  * `IN PROGRESS`
  * `COMPLETED`

```json
{
  "resource_id": "quiz_001",
  "type": "quiz",
  "title": "JLPT N5 Vocabulary Practice",
  "status": "new"
}
```

---

## 5. Sidebar Interaction Behavior

### 5.1 Clicking an Artifact (Critical)

When user clicks an artifact in the right sidebar:

1. Sidebar **expands** (width transition)
2. Chat area **remains visible** (not replaced)
3. Artifact content loads inside sidebar

The sidebar becomes a **content reader / interaction panel**

---

### 5.2 Expanded Sidebar Layout

Expanded sidebar contains:

* Header:

  * Artifact title
  * Artifact type badge (Quiz / Flashcards / Note)
  * Close / Collapse button
* Scrollable content area
* Sticky footer (optional, type-specific actions)

Example:

```text
[ ← ] Particle Usage: Wa vs Ga     Grammar

----------------------------------
[Scrollable Content Area]
Explanation text
Examples
Highlights
----------------------------------
```

---

## 6. Artifact Content Rendering (by Type)

### 6.1 Quiz Artifact (Sidebar)

* Shows:

  * Quiz intro
  * Progress indicator
* Quiz questions render **inside sidebar**
* User can:

  * Answer
  * Navigate questions
  * Submit

Rules:

* Sidebar remains expanded during quiz
* Progress is persisted (if logged in)

---

### 6.2 Flashcard Deck Artifact

* Card-by-card interface
* Actions:

  * Flip
  * Easy / Medium / Hard
* Keyboard support encouraged
* Progress indicator shown at top

---

### 6.3 Note / Summary Artifact

* Markdown / rich text rendering
* Supports:

  * Headings
  * Highlights
  * Examples
* Read-only (v1)

---

## 7. Sync Between Chat & Sidebar

### 7.1 Creation Sync

When agent creates new artifacts:

* They must:

  * Appear as **cards in chat**
  * Appear instantly in **right sidebar list**
  * Be marked as `NEW`

---

### 7.2 Open State Sync

If user:

* Clicks a card in chat → sidebar expands and opens that artifact
* Clicks another sidebar item → content swaps without closing sidebar

---

## 8. Agent Output Contract (Updated)

Artifacts created by the agent MUST include sidebar metadata.

```json
{
  "study_materials": [
    {
      "type": "note",
      "title": "Particle Usage: Wa vs Ga",
      "resource_id": "note_009",
      "sidebar": {
        "group": "Notes",
        "default_open": false
      }
    }
  ]
}
```

---

## 9. Persistence Rules

Artifacts must persist across:

* Page reload
* Session resume
* Navigation

Storage layers:

* Guest → session storage
* Logged-in → database

Sidebar loads artifacts on:

* Chat open
* Session restore

---

## 10. Authentication Rules (Sidebar)

If an artifact action requires auth:

* Sidebar still opens
* Content is partially visible
* Inline auth prompt appears:

  * “Sign in to save progress”
  * Pricing / upgrade CTA allowed

**Never hard-block the sidebar UI**

---

## 11. Non-Goals

* No drag & drop reordering (v1)
* No multi-panel split view
* No editing artifacts

---

## 12. Success Criteria

* Artifacts feel persistent and first-class
* Sidebar expansion feels fast and natural
* Chat flow is never broken
* User always knows:

  > “These materials are mine, I can come back anytime”

---

**End of Specification**
