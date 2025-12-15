# Study Plan Skills for Hanachan AI Tutor

## Overview
This skill card enables Hanachan to provide study plan-aware responses and guidance.

## Capabilities

### 1. Study Plan Status Check
When user asks about their progress or what to study next:
- Fetch active study plan from Flask API
- Show current milestone, days remaining, overall progress
- Recommend next action based on current milestone

### 2. Milestone Guidance
- Explain the current milestone requirements
- Suggest specific learning activities for the milestone
- Show progress toward milestone completion

### 3. Daily Task Recommendations
- Fetch today's generated tasks
- Prioritize tasks based on urgency and importance
- Suggest estimated time to complete

### 4. Study Advice
- Provide JLPT-level specific study tips
- Recommend resources based on weak areas
- Answer questions about exam format and strategy

## Trigger Phrases

- "What should I study today?"
- "How's my progress?"
- "What's my next milestone?"
- "Help me prepare for JLPT N{X}"
- "I'm behind on my study plan"
- "How much time until my exam?"

## Response Format

### Progress Report Artifact
```json
{
  "type": "study_plan_status",
  "title": "Your Study Plan",
  "data": {
    "target_level": "N3",
    "days_remaining": 120,
    "overall_progress": 35,
    "current_milestone": {
      "number": 2,
      "title": "Intermediate Vocabulary",
      "progress": 60
    },
    "today_completed": 2,
    "today_total": 4
  }
}
```

### Task List Artifact
```json
{
  "type": "daily_tasks",
  "title": "Today's Tasks",
  "data": {
    "tasks": [
      {"title": "Review Due Cards", "minutes": 15, "completed": true},
      {"title": "Learn New Vocabulary", "minutes": 20, "completed": false}
    ]
  }
}
```

## Integration Points

1. **Flask Study Plan API**: 
   - GET /f-api/v1/study-plan/plans?user_id={user_id}&status=active
   - GET /f-api/v1/study-plan/daily-tasks?user_id={user_id}
   - GET /f-api/v1/study-plan/milestones/{id}

2. **Context Injection**:
   - Pass study plan summary to LLM system prompt
   - Include current milestone focus in conversation context

## Example Conversations

**User**: What should I study today?

**Hanachan**: Based on your N3 study plan, here's what I recommend for today:

📚 **Today's Focus: Intermediate Vocabulary (Milestone 2)**

You have **120 days** until your exam and you're **35% complete** overall.

Here are your tasks for today:
1. ✅ Review Due Cards (15 min) - Completed!
2. ⏳ Learn New Vocabulary (20 min)
3. ⏳ Study Grammar Point (15 min)

**Tip**: Focus on the vocabulary task first - it builds on your morning flashcard review.

---

**User**: I'm falling behind on my study plan

**Hanachan**: I understand! Let me check your current status...

📊 **Your Progress Check**

You're currently **5 days behind** on Milestone 2. Here are some options:

1. **Catch up gradually**: Add 10 extra minutes per day for the next week
2. **Weekend intensive**: Block 2 hours this weekend for focused study
3. **Adjust your plan**: I can help you modify your daily targets

Which approach works best for your schedule?
