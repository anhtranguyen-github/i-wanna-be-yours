# JLPT Practice Platform – Full Description

## 1. Platform Overview

This platform is designed for systematic JLPT practice and exam preparation.
It separates practice and assessment clearly, while sharing a unified test engine and UI.

Core goals:
- Support long-term JLPT study and short-term exam preparation
- No feature gatekeeping for practice content
- Focus on understanding, review, and improvement
- Minimal UI and low cognitive load

---

## 2. Modes

The platform provides three modes using the same core logic.

### 2.1 Quiz Mode (Unlimited Practice)

Purpose:
- Daily practice and revision
- Mixed JLPT content
- Learning-focused, low pressure

Characteristics:
- Unlimited usage
- Can mix levels, skills, and question types
- No feedback after each question
- Full review after submission

Customization:
- Number of questions (10 / 20 / 50 / ... )
- Timer:
  - Unlimited
  - JLPT standard
  - Custom

Question tags:
- JLPT level (N5–N1)
- Skill: Vocabulary, Grammar, Reading, Listening
- JLPT section type
- Question format
- Internal difficulty
- Topic or grammar point

After submission:
- Total correct / incorrect
- Time used
- Per-question review:
  - Correct answer
  - User answer
  - Explanation
- Ability to flag questions

---

### 2.2 Single Skill Exam Mode

Purpose:
- Evaluate readiness for a single JLPT skill

Characteristics:
- One skill per exam
- JLPT-style structure and order
- No feedback during the test
- Full review after submission

Timer:
- JLPT standard or custom

Results:
- Score or percentage
- Accuracy by question type
- Average time per question
- Practice recommendations

---

### 2.3 Full JLPT Exam Mode

Purpose:
- Full JLPT simulation
- Assess overall readiness

Structure:
1. Language Knowledge
2. Reading
3. Listening

Characteristics:
- Single unified exam mode
- No feedback during the exam
- Adjustable timer

After completion:
- Estimated total score
- Score per skill
- Comparison with previous attempts
- Weakness-based recommendations

---

## 3. Shared Rules Across All Modes

- Adjustable timer for all modes
- No instant feedback during answering
- Full review after submission
- Explanations always available
- Unified UI and logic

---

## 4. UI Layout

Overall layout:

+------------------------------------------------------+
| Top Bar: Mode | Level | Timer | Focus / Scroll Toggle |
+------------------------+-----------------------------+
| Left Sidebar           | Main Content Area           |
| (Question Navigation)  | (Question Display)          |
|                        |                             |
+------------------------+-----------------------------+

---

## 5. Top Bar

Contents:
- Current mode
- JLPT level
- Main countdown timer
- Display mode toggle: Focus / Scroll

Behavior:
- Always visible
- Timer warning when time is low
- Mode switching does not reset progress

---

## 6. Left Sidebar – Question Navigation

Contents:
- Test title
- Total number of questions
- Mini timer

Question list:
[1] [2] [3] [4] [5] ...

Question states:
- Unanswered
- Answered
- Flagged

Interactions:
- Click to jump to a question
- Sidebar can be collapsed
- Hidden by default on mobile

---

## 7. Main Content Area – Display Modes

### 7.1 Focus Mode (Single Question View)

Purpose:
- High concentration
- Exam-like experience

Characteristics:
- One question per screen
- No scrolling
- Manual navigation

Layout:
Question 12 / 40

<Question content>

<Answer options>

[ Previous ]     [ Next ]

Behavior:
- Selecting an answer does not auto-advance
- User controls navigation

---

### 7.2 Scroll Mode (List View)

Purpose:
- Comfortable practice
- Suitable for reading-heavy tasks

Characteristics:
- Multiple questions in a vertical list
- Scroll-based navigation

Layout:
Question 1
<Question + answers>

Question 2
<Question + answers>

Behavior:
- No auto-scroll
- Sidebar remains usable

---

## 8. Switching Display Modes

- Toggle available in the top bar
- Switching modes preserves:
  - Answers
  - Current position
  - Timer state

---

## 9. Timer System

Rules:
- Applies to all modes
- Unlimited, JLPT standard, or custom

Display:
- Main timer in top bar
- Mini timer in sidebar
- Visual warning near timeout

---

## 10. Exam Break Screen

After completing a section or skill:

Section completed: Reading

Break time
00:10:00

[ Skip Break ]

Behavior:
- Countdown break timer
- User may skip the break

---

## 11. Controls During Test

Available:
- Previous / Next
- Flag question
- Submit test

Not available:
- No correct/incorrect indication
- No score during answering

---

## 12. Submission & Review

After submission:
- Sidebar shows correct / incorrect status
- User can click any question to review:
  - Correct answer
  - User answer
  - Explanation

---

## 13. UX Principles

- Practice-first design
- Clear progress awareness
- Flexible focus and scroll modes
- Minimal distraction
- User always knows:
  - Current position
  - Remaining time
  - Next action
