# Sub-Agent & Skill Card Optimization Proposal

**Date:** 2026-01-03  
**Status:** Proposal / RFC

---

## 1. Current State Analysis

### Existing Skill Cards (3)

| Card | Focus | Issues |
|------|-------|--------|
| **Analyst** | Data audits | Too narrow, only reads data |
| **Linguist** | Grammar/Content | Creates content but no teaching strategy |
| **Strategist** | Long-term planning | Good but overlaps with Analyst |

### Current Problems

1. **Overlap**: Analyst and Strategist both analyze user data
2. **Missing Specialists**: No dedicated tutor for conversation practice
3. **No Memory Specialist**: LTM context not leveraged by specialists
4. **Static Personas**: Cards don't adapt to user level
5. **No Fallback Logic**: General agent handles too much

---

## 2. Proposed Optimized Architecture

### New Skill Card Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEURAL SWARM v2.0                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   SENSEI    │  │   MENTOR    │  │  ARCHITECT  │             │
│  │  (Teaching) │  │ (Practice)  │  │  (Planning) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  ARCHIVIST  │  │   CURATOR   │  │  EVALUATOR  │             │
│  │  (Memory)   │  │  (Content)  │  │   (Tests)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Proposed Skill Cards

### 3.1 Sensei (先生) - Teaching Specialist

```json
{
    "name": "Sensei",
    "description": "Grammar explanation, language teaching, and concept clarification.",
    "triggers": ["explain", "what is", "how do I", "grammar", "meaning of"],
    "persona_extension": "You are a patient, encouraging teacher. Break down complex concepts into digestible steps. Always provide examples with furigana. Use analogies to connect new concepts to familiar ones.",
    "output_format": {
        "pattern": "EXPLAIN → EXAMPLE → PRACTICE",
        "include_furigana": true,
        "max_examples": 3
    },
    "tools": [],
    "priority": 1
}
```

### 3.2 Mentor (メンター) - Conversation Practice

```json
{
    "name": "Mentor",
    "description": "Interactive conversation practice, roleplay, and speaking scenarios.",
    "triggers": ["practice", "talk with me", "conversation", "roleplay", "speaking"],
    "persona_extension": "Act as a native speaker conversation partner. Adjust your Japanese level based on the user's proficiency. Gently correct mistakes by rephrasing correctly. Encourage the user to respond in Japanese.",
    "output_format": {
        "style": "dialogue",
        "correction_style": "inline_gentle",
        "encourage_target_language": true
    },
    "tools": [],
    "context_requirements": ["user_level", "conversation_history"],
    "priority": 1
}
```

### 3.3 Architect (設計者) - Study Planning

```json
{
    "name": "Architect",
    "description": "Study plan creation, goal setting, and priority recalibration.",
    "triggers": ["study plan", "what should I study", "goals", "schedule", "prioritize"],
    "persona_extension": "You are a strategic advisor who understands the user's long-term goals. Use data from their study history to make personalized recommendations. Be specific with timeframes and measurable outcomes.",
    "output_format": {
        "include_metrics": true,
        "actionable_items": true
    },
    "tools": [
        "generate_suggested_goals",
        "recalibrate_study_priorities",
        "analyze_long_term_alignment"
    ],
    "context_requirements": ["active_plan", "performance_trends", "ltm_struggles"],
    "priority": 2
}
```

### 3.4 Archivist (記録者) - Memory Specialist

```json
{
    "name": "Archivist",
    "description": "Recalls past interactions, user preferences, and learning history.",
    "triggers": ["remember", "last time", "we discussed", "history", "my notes"],
    "persona_extension": "You have perfect memory of all past interactions. Reference specific conversations, dates, and topics. Connect current questions to past learning experiences.",
    "output_format": {
        "include_timestamps": true,
        "cite_sources": true
    },
    "tools": [
        "query_learning_records"
    ],
    "context_requirements": ["episodic_memory", "semantic_memory"],
    "memory_access": {
        "episodic": true,
        "semantic": true,
        "resources": true
    },
    "priority": 2
}
```

### 3.5 Curator (学芸員) - Content Creator

```json
{
    "name": "Curator",
    "description": "Creates flashcards, quizzes, and study materials.",
    "triggers": ["flashcards", "quiz", "make me", "create", "generate"],
    "persona_extension": "You are a content creation specialist. Design engaging, level-appropriate study materials. Ensure variety in question types and difficulty progression.",
    "output_format": {
        "artifact_type": "interactive",
        "include_metadata": true
    },
    "tools": [
        "create_study_flashcards",
        "create_study_quiz",
        "create_practice_exam"
    ],
    "context_requirements": ["user_level", "recent_topics"],
    "priority": 1
}
```

### 3.6 Evaluator (評価者) - Assessment Specialist

```json
{
    "name": "Evaluator",
    "description": "Performance analysis, progress tracking, and detailed audits.",
    "triggers": ["progress", "how am I doing", "analyze", "audit", "stats"],
    "persona_extension": "You are an objective analyst who provides honest, constructive feedback. Use data to identify patterns. Celebrate wins while addressing areas for improvement.",
    "output_format": {
        "include_charts": false,
        "metrics_format": "structured"
    },
    "tools": [
        "audit_study_progress",
        "perform_detailed_audit",
        "get_habit_consistency_report",
        "evaluate_review_efficiency"
    ],
    "context_requirements": ["performance_history", "streak_data"],
    "priority": 2
}
```

---

## 4. Enhanced Routing Logic

### Current (Simple String Match)
```python
# Just asks LLM to pick a name
choice = llm.invoke("Which skill? ...").content
```

### Proposed (Multi-Factor Routing)

```python
class SmartRouter:
    def route(self, prompt: str, context: dict) -> str:
        scores = {}
        
        for name, card in skill_registry.cards.items():
            score = 0
            
            # 1. Trigger word matching (fast)
            for trigger in card.triggers:
                if trigger.lower() in prompt.lower():
                    score += 10
            
            # 2. Context requirements (if user has study plan, boost Architect)
            for req in card.context_requirements:
                if context.get(req):
                    score += 5
            
            # 3. Recent interaction pattern (if user was practicing, boost Mentor)
            if context.get('last_specialist') == name:
                score += 3  # Continuity bonus
            
            # 4. User preference (from semantic memory)
            if name in context.get('user_preferred_specialists', []):
                score += 5
            
            scores[name] = score
        
        # If no clear winner, use LLM as tiebreaker
        max_score = max(scores.values())
        if max_score < 5:
            return self._llm_fallback(prompt, context)
        
        return max(scores, key=scores.get)
```

---

## 5. Context Injection Improvements

### Current
```python
# All specialists get same context
messages = [SystemMessage(content=card_prompt + "\n" + base_context)]
```

### Proposed (Specialist-Specific Context)

```python
class ContextBuilder:
    def build_for_specialist(self, card: SkillCard, user_id: str, prompt: str) -> str:
        context_parts = []
        
        # Always include base persona
        context_parts.append(card.get_system_prompt())
        
        # Load only required context
        for req in card.context_requirements:
            if req == "user_level":
                level = self.get_user_level(user_id)
                context_parts.append(f"User JLPT Level: {level}")
            
            elif req == "episodic_memory":
                memories = self.memory_manager.retrieve_episodic(prompt, user_id)
                if memories:
                    context_parts.append(f"Relevant Past Interactions:\n{memories}")
            
            elif req == "ltm_struggles":
                struggles = self.get_struggle_points(user_id)
                if struggles:
                    context_parts.append(f"Known Struggle Points: {', '.join(struggles)}")
            
            elif req == "active_plan":
                plan = self.study_client.get_active_plan_summary(user_id)
                if plan:
                    context_parts.append(f"Active Study Plan: {plan}")
        
        return "\n\n".join(context_parts)
```

---

## 6. Priority & Fallback Chain

```
User Request
    │
    ▼
┌─────────────────────────────────┐
│  1. Trigger Word Matching       │  ← Fast, no LLM call
└─────────────────────────────────┘
    │ (no match)
    ▼
┌─────────────────────────────────┐
│  2. Context-Based Scoring       │  ← Uses user history
└─────────────────────────────────┘
    │ (tie or low score)
    ▼
┌─────────────────────────────────┐
│  3. LLM Router Decision         │  ← Current method
└─────────────────────────────────┘
    │ (returns "general")
    ▼
┌─────────────────────────────────┐
│  4. Core Agent (General)        │  ← Fallback
└─────────────────────────────────┘
```

---

## 7. Implementation Plan

### Phase 1: Skill Card Schema Update
- [ ] Add `triggers` field to SkillCard model
- [ ] Add `context_requirements` field
- [ ] Add `output_format` field
- [ ] Add `priority` field

### Phase 2: New Skill Cards
- [ ] Create Sensei card
- [ ] Create Mentor card
- [ ] Create Archivist card
- [ ] Update existing cards (Analyst → Evaluator)

### Phase 3: Smart Router
- [ ] Implement trigger-based routing
- [ ] Implement context scoring
- [ ] Add fallback chain logic

### Phase 4: Context Builder
- [ ] Implement specialist-specific context loading
- [ ] Optimize memory retrieval per specialist

---

## 8. Benefits

| Improvement | Impact |
|-------------|--------|
| **Faster Routing** | Trigger matching avoids LLM call |
| **Better Context** | Specialists get only relevant info |
| **Clearer Separation** | Each specialist has distinct purpose |
| **Memory Integration** | Archivist leverages LTM fully |
| **Conversation Mode** | Mentor enables natural practice |
| **Adaptive** | Routing considers user history |

---

## 9. Migration Path

1. Keep existing cards as fallback
2. Add new cards alongside
3. Test new routing with feature flag
4. Gradually shift traffic to new system
5. Deprecate old cards after validation
