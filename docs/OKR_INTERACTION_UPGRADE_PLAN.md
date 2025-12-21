# OKR & Mastered Items Interaction Upgrade Plan

This document outlines the architecture and implementation steps to upgrade the **Strategic Vision (OKR)** component from a display-only card into an interactive intelligence gateway.

## 🎯 Goal
Ensure that users can seamlessly drill down from high-level progress tracking into granular knowledge sets (Vocabulary/Grammar) without leaving their dashboard context.

---

## 🛠 Phase 1: Interaction Architecture (The "Two-Zone" Engine)
**Focus**: Decouple Row Expansion from Modal Data Fetching.

### Changes:
1.  **Zone A (Data Anchor)**: The left side of the `KeyResultRow` (Icon, Title, Progress Bar) will be mapped to `onViewItems`. 
    *   **Visuals**: `cursor: zoom-in`.
    *   **Action**: Opens `MasteredItemsModal`.
2.  **Zone B (Tactical Anchor)**: The right side (Velocity, Confidence, Chevron) remains mapped to `onToggle`.
    *   **Visuals**: Subtle bg-highlight on hover.
    *   **Action**: Toggles the expansion of detailed tactical metrics.

---

## 🔗 Phase 2: Strategic-to-Tactical Orchestration
**Focus**: Linking OKR Objectives to SMART Blueprints.

### Changes:
1.  **Header Mapping**: Set the `OKRObjectiveCard` header `onClick` to look up the parent `smart_goal_id`.
2.  **Dashboard State**: Update `dashboard/page.tsx` to handle the `setSelectedSMARTGoal` state change when an OKR header is clicked. This allows the user to see the "Measurable" and "Relevant" factors that comprise the high-level OKR.

---

## 📈 Phase 3: Proficiency & Learning Status Upgrade
**Focus**: Deep Knowledge Analysis in `MasteredItemsModal`.

### Changes:
1.  **Dual-Layer Proficiency**:
    *   **Learning State (SRS Status)**: Badge showing `Learning`, `Reviewing`, `Mastered`, or `Burned`.
    *   **Recall Quality (Performance)**: High, Med, or Low rating based on recent quiz scores.
2.  **Risk Indicators**: Items with `Performance: Low` will feature a red alert ⚠️ to signal "knowledge decay."
3.  **Category Specific Views**: Unique layouts for Vocabulary (Kanji/Kana) vs Grammar (Pattern usage).

---

## 🛡 Phase 4: Data Validation & Protective Logic
**Focus**: Handling partial/missing backend data.

### Changes:
1.  **Null-Safety**: Implement fallbacks in `MasteredItemsModal` to handle empty item arrays gracefully (Showing "Analyzing Knowledge..." instead of empty whitespace).
2.  **Proficiency Normalization**: Standardize how 0-100 scores from the backend are mapped to the 4 proficiency state buckets.

---

## 🤖 Phase 5: Sensei Integration (The Final Polish)
**Focus**: Contextual Coaching within modals.

### Changes:
1.  **Knowledge Briefings**: Add a "Sensei Note" at the top of the item list.
    *   *Example*: "Your N3 Grammar is 80% Mastered, but your performance on 'Causative' forms is low. You should prioritize these in your next session."
2.  **Actionable Feedback**: Buttons inside the modal to "Jump to Practice" for specific weak areas.

---

## 📋 Implementation Checklist

- [ ] Refactor `OKRObjectiveCard.tsx` to support Zone A/B clicks.
- [ ] Connect `OKRObjectiveCard` header to SMART Modal in `dashboard/page.tsx`.
- [ ] Upgrade `MasteredItemsModal.tsx` handles with SRS Status badges.
- [ ] Add Performance/Risk ratings to mocked and real item data.
- [ ] Add Sensei-Briefing section to `MasteredItemsModal`.
