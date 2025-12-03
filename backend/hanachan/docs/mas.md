# 🇯🇵 Multi-Agent Workflow: Personalized Japanese Tutor System

This system uses a specialized team of AI agents, managed by an Orchestrator, to provide adaptive and highly personalized language instruction.

---

## 1. The Agent Team (Specialists)

### 1.1. 🧠 Kyoumu (教務 - The Orchestrator)
* **Role:** Supervisor, Data Analyst, and Task Manager.
* **Specialty:** Goal & State Management.
* **Core Functions:**
    * **Diagnosis:** Analyzes continuous performance data from all agents (scores, errors, time to respond).
    * **Delegation:** Determines the student's current learning deficit (grammar, vocab, fluency) and assigns the task to the correct specialist agent.
    * **Personalization:** Reads the `Student Profile` (Shared State) to ensure the learning content and style match the student's preferences and goals.

### 1.2. 📝 Kana & Kanji Sensei (The Character Master)
* **Role:** Reading and Writing Drill Specialist.
* **Specialty:** Character and Vocabulary Acquisition.
* **Core Functions:**
    * **SRS Management:** Manages the Spaced Repetition System (SRS) queue for optimal retention of Kana, Kanji, and vocabulary.
    * **Mnemonic Aid:** Provides visual mnemonics, stroke order guides, and radical breakdowns for new characters.
    * **Reinforcement:** Adds specific failed words/Kanji from other agents' lessons directly into the review queue.

### 1.3. 🏗️ Bunpo Navigator (文法ナビ - The Grammar Architect)
* **Role:** Structural Instruction Specialist.
* **Specialty:** Grammar Structure, Particles, and Syntax.
* **Core Functions:**
    * **Micro-Lessons:** Delivers targeted, concise explanations of grammar points (e.g., particle usage, verb conjugation).
    * **Contextual Exercises:** Generates structural quizzes (fill-in-the-blank, sentence rearrangement) using sentences relevant to the student's skill level.
    * **Error Analysis:** Provides detailed, rules-based feedback explaining *why* a grammar choice was incorrect.

### 1.4. 🗣️ Kaiwa Coach (会話コーチ - The Conversationalist)
* **Role:** Fluency and Auditory Specialist.
* **Specialty:** Speaking, Listening, and Pronunciation.
* **Core Functions:**
    * **Dynamic Role-Play:** Simulates real-world conversations that adapt based on the student's response.
    * **Pronunciation Feedback:** Uses voice recognition to provide real-time correction on pitch accent and intonation.
    * **Fluency Practice:** Creates scenarios that force the student to use grammar and vocabulary recently covered by the other agents.

---

## 2. The Personalized Learning Loop (Cooperative Workflow)

The agents operate in a dynamic feedback loop to address the student's learning needs immediately and effectively.

### Example Scenario: Correcting Particle Usage (`wa` vs. `ga`)

1.  **Perception (Kyoumu):** The Kaiwa Coach registers a structural error (using `ga` where `wa` is more natural) and sends the data to the Kyoumu Orchestrator.
2.  **Delegation (Kyoumu):** Kyoumu determines this is a core grammatical concept issue, temporarily pausing the conversation, and hands the task to the **Bunpo Navigator**.
3.  **Instruction (Bunpo Navigator):** The Navigator delivers a focused 3-minute explanation on the difference between the particles and administers a quick 5-question quiz.
4.  **Reinforcement (Kyoumu -> Kana & Kanji Sensei):** Kyoumu notices a vocabulary word from the quiz was missed and delegates it to the **Kana & Kanji Sensei** for immediate SRS entry and a quick mnemonic review.
5.  **Assessment (Kyoumu -> Kaiwa Coach):** Kyoumu returns control to the **Kaiwa Coach**, instructing it to immediately initiate a new conversational scenario that *requires* the student to use the corrected particle structure in multiple sentences, assessing fluency and application.

---

## 3. Shared State: The Student Profile

All agents access and update a centralized data model to maintain coherence and personalization.

| Data Field | Purpose |
| :--- | :--- |
| **Proficiency Matrix** | Current level scores (JLPT alignment, Reading, Speaking, etc.). |
| **Knowledge Gaps** | Specific list of frequently failed Kanji, vocabulary, and grammar points. |
| **Learning Style** | User-defined preference (e.g., Visual, Auditory) to guide lesson delivery. |
| **Long-Term Goal** | Business, Travel, Academic (JLPT), guiding scenario relevance. |