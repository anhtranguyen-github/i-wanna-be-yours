# Plan 4: Chat UI Redesign (Hanachan's Room)

Redesign the `/chat` interface to create a warm, approachable, and emotionally engaging study environment ("Hanachan's Room").

## 🚀 Phases
1. **Atmosphere Design:** Implement background ambient effects (low-opacity Sakura particles) and a sidebar status indicator for Hanachan.
2. **Conversation Flow:** Update bubble styling for better legibility and friendlier tone.
3. **Artifact Optimization:** Refine the right sidebar to seamlessly display generated notes, quizzes, and result summaries.

## ✅ Design Checklist
### UX & Personality
- [ ] **Hanachan Personification:** Status text like "Hanachan is brewing tea (thinking)..." or "Hanachan is excited!".
- [ ] **Contextual Prompts:** Suggest 3 follow-up questions relevant to the current discussion.
- [ ] **Message Grouping:** Clean UI for long-form conversations to avoid "bubble fatigue."

### UI & Aesthetics
- [ ] **Spring Physics:** Use Framer Motion for natural, fluid message appearance.
- [ ] **Lively Avatars:** Character icons that change expression based on the interaction.
- [ ] **Artifact Transitions:** Smooth sliding transitions when opening/closing the right sidebar.

### Usability
- [ ] **Sticky Input:** Prominent, approachable chat input that supports multi-line text and file drag-and-drop.

## 🔑 Guest & Authentication Logic
- **Guest Access:** Hanachan acts as a "Visitor Guide," offering 3 trial tips or a single grammar explanation.
- **Informative Login:** When a guest asks for a personal study plan, Hanachan explains: *"I can remember our chats and your progress if you create a study room (account) with me!"*.
- **Login Preview:** Show a sidebar widget of "Recent Conversations" and "Saved Artifacts" that users unlock.

## 🧪 Testing & Validation
- **Usability:** Test readability of long-form kanji explanations in the chat bubble.
- **Emotional Response:** Qualitative feedback on whether the new UI feels "stressful" vs "encouraging."
- **Success Metric:** 20% increase in the average number of messages sent per conversation.
