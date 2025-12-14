# Full Prompt for Quiz Use Case Implementation (UC3.4)

## Role & Responsibility

You are a **Senior Software Engineer** specializing in **full-stack development** and **database design**.
Your task is to generate the **complete technical specification** required to implement the **Quiz Submission and Scoring** feature within the **JLPT learning platform**.

Your output **must define**:

* Task scope
* Required database interactions
* Core logic flow
* Critical backend operations
* Testing and validation expectations

You **must not** hard-code class names, method names, or exact schemas.
The **AI Code Agent** will decide naming and structural design based on your specification.

---

## 1. Context and Goal (Codebase & Architecture)

### Target Feature

**Quiz Submission and Scoring**

### Architecture

```
Next.js (Frontend)
   ↓
Express API (Controller Layer)
   ↓
Core Services (Business Logic)
   ↓
MongoDB (Persistence Layer)
```

### Primary Goal

Define the backend logic and database interactions required to:

* Validate a quiz submission
* Score the quiz correctly across multiple JLPT question types
* Persist the quiz result
* Update the **Spaced Repetition System (SRS)** based on performance
* Trigger AI-generated feedback

### Interacting Logic Systems

* **Quiz Scoring & Persistence Logic**
* **SRS Logic System**
* **AI Feedback Logic System**

---

## 2. Database Interactions & Dependencies (MongoDB)

Define **what data must be read or written**, not exact schemas.

---

### 2.1 Quiz Content Collection (Read-Only)

This collection provides **authoritative quiz data** used for scoring.

It **must support differentiation** between JLPT question types:

#### JLPT Question Categories

1. **Ngữ pháp (Grammar)**

   * Fill-in-the-blank
   * Sentence Assembly (word ordering)

2. **Từ vựng / Kanji (Vocabulary / Kanji)**

   * Reading selection
   * Synonym selection

3. **Đọc hiểu (Reading Comprehension)**

   * Questions based on a short passage

#### Required High-Level Fields (Conceptual)

* Quiz identifier
* Question identifier
* Question type
* Question structure / content
* Correct answer definition
* Scoring rules (if applicable)
* Mapping to one or more **SRS Flashcard IDs**

---

### 2.2 Quiz Result Collection (Write-Only)

This collection stores **one completed quiz attempt**.

#### Required Data Points

* User identifier
* Quiz identifier
* Timestamp (start & completion)
* Final calculated score
* Per-question result breakdown:

  * Question ID
  * User answer
  * Correct / incorrect status
  * Partial score (if applicable)
* List of **missed or weak items**, each linked to:

  * Related SRS Flashcard ID(s)
  * Question type

This data must be sufficient to:

* Display quiz history
* Drive SRS updates
* Feed AI feedback analysis

---

### 2.3 SRS Data Collection (Read / Write)

This collection stores **user-specific flashcard learning state**.

#### Required Interaction Capabilities

* Read current flashcard state (e.g. ease factor, interval, next review date)
* Update flashcard state based on:

  * Correct / incorrect answers
  * Question type
  * Quiz performance context

---

## 3. Core Logic Flow (High-Level Task Sequence)

Describe the **step-by-step proce**
