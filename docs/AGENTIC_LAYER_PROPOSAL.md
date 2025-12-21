# 🤖 Project Hanabira: The "AI Sensei" Agentic Layer Proposal

## 1. Executive Concept: Moving from "Tools" to "Teacher"

Currently, the Hanabira Dashboard is a **Passive Cockpit**. It displays gauges (Speed, Altitude, Fuel) perfectly, but the student (User) still has to fly the plane alone. They must look at the "Red Priority" light and *decide* to study.

**The Proposal**: We will introduce an **AI Sensei** (Agentic Layer) that sits in the co-pilot seat. This agent doesn't just read the dashboard; it *takes the controls* when necessary. It moves the system from "Here is what you should do" to "Let's do this together right now."

---

## 2. How the Agent "Sees" (Ingestion Strategy)

The Agent acts like a human teacher looking over the student's shoulder at the current Dashboard.

### The "See-Think-Act" Data View
The Agent does not querying raw database tables. Instead, it "reads" the Dashboard's processed state, just like a human would:

1.  **Strategic Vision (The OKR Card)**:
    *   *What it sees:* "The student is 20% behind schedule on N3 Vocabulary."
    *   *Agent Reasoning:* "We are falling behind. I need to be more aggressive with daily assignments."

2.  **User Pulse (The PACT Card)**:
    *   *What it sees:* "User Energy is 3/10 (Low/Tired)."
    *   *Agent Reasoning:* "They are burnt out. If I assign a hard quiz, they will quit. I will pivot to a passive 'Podcast' session instead."

3.  **Diagnostic Map (The Priority Matrix)**:
    *   *What it sees:* "Grammar is in the RED zone with 'Worsening Trend'."
    *   *Agent Reasoning:* "This is a Code Red. I am overriding today's plan to focus exclusively on Grammar repair."

---

## 3. The "Sensei's Toolkit" (Agent Skills)

This is the deck of "Action Cards" the Agent can play to intervene in the student's journey.

### 🧠 Skill A: The Planner (Replacing the "Tasks Tab")
*Current System:* Generates a static list of 3 tasks at 6:00 AM.
* **Agent Replacement**: **Dynamic Real-Time Scheduling.**
    *   *Scenario*: You fail a morning quiz miserably.
    *   *Action*: The Agent immediately **deletes** your evening "New Material" task and **replaces** it with a "Recovery Session" task.
    *   *Why*: A static list doesn't know you failed 5 minutes ago. The Agent does.

### 🩺 Skill B: The Diagnostician (Overriding the "Diagnostics Tab")
*Current System:* Shows a static chart of "Error Types."
* **Agent Replacement**: **Interventionist Consulting.**
    *   *Scenario*: The Priority Matrix shows you keep failing "Causative Verbs."
    *   *Action*: The Agent pauses your session and pops up a chat: *"I noticed you failed 'Let me eat' 3 times. You seem to be confusing it with 'Passive' forms. Let me explain the difference quickly before we continue."*
    *   *Why*: Charts show you the problem. Agents **fix** the problem.

### 📣 Skill C: The Motivator (Enhancing the "Performance Tab")
*Current System:* Shows a graph of "Retention Rate" going down.
* **Agent Replacement**: **Contextual Coaching.**
    *   *Scenario*: You broke your 7-day streak.
    *   *Action*: The Agent doesn't just show a "0" on the dashboard. It sends a message: *"Don't worry about the streak. I've adjusted your load for today to be very light (5 mins) just to help you get back on the wagon. Ready?"*
    *   *Why*: Data shames you. Agents encourage you.

---

## 4. Operational Plan: The 3 Modes of Operation

How we will integrate this Agent without breaking the current solid system.

### Mode 1: The "Whisper" (Passive Advisor)
*   **State**: The Agent reads the dashboard silently.
*   **Action**: It adds small "Sticky Notes" or "Badges" to the existing UI.
*   *Example*: On the "Start Quiz" button, it adds a badge: *"Recommended by Sensei because your energy is high."*

### Mode 2: The "Handshake" (Active Proposal)
*   **State**: The Agent identifies a better path.
*   **Action**: It creates a "Proposal Card" at the top of the dashboard.
*   *Example*: *"I see you have 30 mins free and high energy. I've prepared a special 'Speed Run' to clear your entire backlog. Want to try it?"* -> [Yes/No]

### Mode 3: The "Autopilot" (Full Override)
*   **State**: The student toggles "Sensei Mode" ON.
*   **Action**: The Agent **hides** the complex dashboard tabs (Strategy/Diagnostics).
*   *Experience*: The UI simplifies to just **One Big Button**: *"Do This Next."* The Agent manages all the complexity of choosing *what* 'This' is behind the scenes.

---

## 5. Summary Value Proposition

| Feature | Current System (The Dashboard) | Proposed Agentic Layer (The Sensei) |
| :--- | :--- | :--- |
| **Role** | Instrument Panel | Expert Co-Pilot |
| **User Load** | "I have to analyze my stats to decide." | "The Sensei tells me what matters." |
| **Reaction** | Static (Updates daily) | Dynamic (Updates instantly) |
| **Empathy** | None (It's just numbers) | High (Reads mood & adjusts difficulty) |

**Conclusion**: The "Agentic Layer" does not replace the code we built. It replaces the **mental burden** on the student to interpret that code.
