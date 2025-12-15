# Feature Prompt: Study Plan with Target JLPT Exam (Extended)

## Role & Responsibility

You are a **Senior Software Engineer** responsible for defining the technical behavior of the **JLPT Exam Goal Planning** feature.

You must specify **system behavior, data flow, and logic responsibilities only**.
All **code structure, schemas, naming, and architectural decisions** must be determined by the **AI Code Agent**.

---

## 1. Feature Goal

Implement a **personalized study planning system** that helps users prepare for their **next JLPT exam** by:

* Setting a **target JLPT level (N5–N1)**
* Selecting a **target exam date**
* Generating an **adaptive study plan** tied to:

  * Milestones
  * Chatbot-generated guidance
  * Assessments
  * Personalized learning materials

---

## 2. Core Capabilities

### 2.1 Exam Target & Timeline

* User selects JLPT level and exam date
* System calculates remaining study time
* Plan adapts automatically if the exam date or level changes

---

### 2.2 Milestone-Based Planning

The plan must be structured around **clear milestones**, such as:

* Vocabulary & Kanji coverage targets
* Grammar mastery checkpoints
* Reading speed and comprehension goals
* Mock exam readiness thresholds

Each milestone must:

* Have measurable criteria
* Be time-bound
* Be linked to specific learning activities

---

### 2.3 Chatbot-Assisted Planning

* A chatbot assists users in:

  * Explaining the study plan
  * Adjusting workload
  * Answering “what should I study next?”
* The chatbot may:

  * Generate or refine daily/weekly plans
  * Recommend exercises or quizzes
  * React to missed milestones or poor assessment results

---

### 2.4 Integrated Assessments

* The system must schedule and support:

  * Diagnostic tests
  * Periodic assessments
  * Mock JLPT exams
* Assessment results must:

  * Update milestone status
  * Influence future workload
  * Adjust SRS intensity

---

### 2.5 Personalized Learning Materials

Learning content must be dynamically selected based on:

* JLPT level
* Current milestone
* Assessment results
* SRS performance
* Weak areas identified by quizzes and exercises

Materials may include:

* Exercises
* Quizzes
* Flashcards
* Reading passages
* AI-generated practice content

---

## 3. Access & UX Rules

* General JLPT plans, milestone templates, and sample schedules must be **accessible without login**
* Personalized plans, progress tracking, and adaptive recommendations **require authentication**

UI requirements:

* Simple, minimal design
* Timeline or milestone-based visualization
* Clear navigation between:

  * Plan overview
  * Milestones
  * Daily tasks
  * Assessments

---

## 4. Core Logic Flow

### Step 1: Plan Initialization

* User selects exam level and date
* System generates a baseline plan with milestones

### Step 2: Ongoing Plan Execution

* Daily/weekly tasks are generated
* Chatbot provides contextual guidance
* Learning materials are assigned dynamically

### Step 3: Assessment & Feedback Loop

* User completes assessments
* Results update:

  * Milestone progress
  * Study plan pacing
  * Learning material difficulty

### Step 4: Adaptive Adjustment

* Missed milestones trigger:

  * Plan rebalancing
  * Additional practice
  * Chatbot intervention
* Strong performance may:

  * Accelerate milestones
  * Reduce redundant practice

---

## 5. Implementation Constraints

* Do not assume fixed schemas or services
* Support future extension (new JLPT formats, new materials)
* Keep logic modular:

  * Planning
  * Assessment
  * SRS
  * Chatbot guidance
* Avoid tight coupling between UI and learning logic

---

## 6. Implementation Process & Testing

* Implement the feature **in phases**
* **After each phase, add and execute appropriate tests**
* Validate correctness before proceeding
* Ensure stability of:

  * Plan generation
  * Milestone tracking
  * Adaptive logic

---

**End of Prompt**
