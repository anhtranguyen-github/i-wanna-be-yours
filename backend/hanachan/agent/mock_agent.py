from typing import List, Dict, Any
from services.resource_processor import ResourceProcessor

class MockAgent:
    def generate_debug_response(self, 
                                prompt: str, 
                                session_id: str, 
                                user_id: str, 
                                context_config: Dict[str, Any], 
                                message_id: int, 
                                resource_ids: List[str] = None) -> Dict[str, Any]:
        """
        Generates a markdown debug response echoing all received data.
        Enhanced with study plan context awareness and content creation.
        """
        resource_ids = resource_ids or []
        
        # Fetch resources content
        processor = ResourceProcessor()
        resources_content = []
        for rid in resource_ids:
            content = processor.get_resource_content(rid)
            if content:
                resources_content.append(content)

        # =====================================================================
        # 1. Check for CONTENT CREATION intent (flashcards, quiz, exam)
        # =====================================================================
        from services.content_creator import ContentCreatorService
        
        creation_intent = ContentCreatorService.detect_creation_intent(prompt)
        
        # Build Metadata ACK first so it's available for both branches
        metadata_ack_items = []
        for res in resources_content:
            r_title = res.get('title', 'Unknown')
            r_type = res.get('type', 'Unknown')
            r_len = len(res.get('content', ''))
            metadata_ack_items.append(f"- **{r_title}** ({r_type}): {r_len} chars")
        
        metadata_ack = "Hanachan has successfully received and parsed metadata for:\n" + "\n".join(metadata_ack_items) if metadata_ack_items else ""

        lower_prompt = prompt.lower()
        no_artifacts = context_config.get("no_artifacts", False) or "no artifact" in lower_prompt

        if creation_intent:
            # ... existing logic ...
            creation_response = ContentCreatorService.generate_creation_response(
                intent=creation_intent,
                prompt=prompt,
                user_id=user_id
            )
            
            content = creation_response["content"]
            if metadata_ack:
                content += "\n\n" + "### 📂 Context Ingested\n" + metadata_ack

            return {
                "content": content,
                "tasks": [],
                "suggestions": creation_response.get("suggestions", []),
                "artifacts": [] if no_artifacts else creation_response.get("artifacts", [])
            }
        
        # 2. REAL AI RESPONSE via OllamaAgent
        from agent.core_agent import HanachanAgent
        ollama = HanachanAgent()
        real_content = ollama.invoke(
            prompt=prompt,
            chat_history=[],
            session_id=session_id,
            user_id=user_id,
            resource_ids=resource_ids,
            stream=False
        )

        from services.study_plan_context import (
            detect_study_plan_intent,
            StudyPlanContextProvider
        )
        study_intent = detect_study_plan_intent(prompt)
        study_context = ""
        study_artifacts = []
        
        if study_intent and user_id:
            try:
                provider = StudyPlanContextProvider(user_id)
                study_context = provider.get_context_summary()
                
                # Add study plan artifacts based on intent
                if study_intent in ["progress_check", "exam_info", "milestone_info"]:
                    status_artifact = provider.get_plan_status_artifact()
                    if status_artifact:
                        study_artifacts.append(status_artifact)
                
                if study_intent == "study_recommendation":
                    tasks_artifact = provider.get_daily_tasks_artifact()
                    study_artifacts.append(tasks_artifact)
                    
            except Exception as e:
                print(f"[MockAgent] Study plan context error: {e}")
        
        # =====================================================================
        # 3. Build Resource String
        # =====================================================================
        resources_str = "\n".join([f"- {r['title']} ({len(r['content'])} chars)" for r in resources_content]) if resources_content else "None"
        
        # =====================================================================
        # 4. Build debug content
        # =====================================================================
        debug_content = f"""
### Mock Agent Debug Response
**Session ID:** `{session_id}`
**User ID:** `{user_id}`

**Prompt Received:**
> {prompt}

**Attached Resources:**
{resources_str}

**Resource Metadata Acknowledgement:**
{metadata_ack if metadata_ack else "No resources were attached for this request."}

**Study Plan Intent:** `{study_intent or 'None detected'}`

**System Status:**
- Database Persistence: ✅ (Message ID: {message_id})
- Context Config: `{context_config}`
"""
        
        # Add study-specific response if intent detected
        if study_intent:
            debug_content += f"""
---
### Study Plan Context Loaded
{study_context}
"""
        
        # =====================================================================
        # 5. Generate Mock Artifacts & Suggestions
        # =====================================================================
        tasks = []
        suggestions = []
        artifacts = []
        
        # Add study plan artifacts first if any
        if not no_artifacts:
            artifacts.extend(study_artifacts)
        
        # Add study-specific suggestions
        if study_intent:
            suggestions.append({"text": "Show my daily tasks"})
            suggestions.append({"text": "How's my progress?"})
            suggestions.append({"text": "Quiz me on vocabulary"})
        else:
            # =====================================================================
            # 6. DEBUG MODE: Return ALL artifact types for UI testing
            # =====================================================================
            
            # Check if debug mode
            is_debug = "debug" in lower_prompt or context_config.get("debug", False)
            
            if is_debug:
                debug_content += """
---
### 🔧 DEBUG MODE ACTIVE
All artifact types generated for UI testing:
"""
                if not no_artifacts:
                    # Generate ALL sample artifacts for testing
                    artifacts = self._get_all_sample_artifacts()
                else:
                    debug_content += "\n*(Artifact generation disabled via 'no artifact' instruction/config)*\n"
                
                suggestions = [
                    {"text": "Test flashcard single"},
                    {"text": "Test quiz submission"},
                    {"text": "Test exam launch"},
                    {"text": "Test save to library"}
                ]
            else:
                # Normal suggestions if no intent detected
                # Only add if it's not a 'no artifact' request
                if not no_artifacts:
                    suggestions.append({"text": "Create N5 vocabulary flashcards"})
                    suggestions.append({"text": "Make a grammar quiz for N4"})
                    
                # NO DEFAULT ARTIFACTS HERE. 
                # This prevents clutter during normal conversation.
                pass

        return {
            "content": real_content,
            "tasks": tasks,
            "suggestions": suggestions,
            "artifacts": artifacts
        }

    def _get_all_sample_artifacts(self) -> List[Dict[str, Any]]:
        """Generate ALL artifact types for debug/testing purposes."""
        return [
            # 1. Flashcard Single (1-2 cards, add to deck)
            {
                "type": "flashcard_single",
                "title": "Sample Single Card",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "level": "N5",
                    "skill": "vocabulary",
                    "source": "debug"
                },
                "data": {
                    "cards": [
                        {
                            "id": "debug_card_001",
                            "front": "食べる",
                            "back": "to eat (たべる)",
                            "reading": "たべる",
                            "example": "ごはんを食べる。",
                            "tags": ["verb", "ichidan"]
                        }
                    ]
                },
                "actions": {
                    "canAddToExistingDeck": True,
                    "canCreateNewDeck": True
                }
            },
            
            # 2. Flashcard Deck (Full set, save to library)
            {
                "type": "flashcard_deck",
                "title": "Debug Deck - N5 Verbs",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "level": "N5",
                    "skill": "vocabulary",
                    "cardCount": 5,
                    "estimatedTime": "10 min"
                },
                "data": {
                    "description": "Debug flashcard deck with 5 sample cards",
                    "cards": [
                        {"id": "d1", "front": "食べる", "back": "to eat", "reading": "たべる"},
                        {"id": "d2", "front": "飲む", "back": "to drink", "reading": "のむ"},
                        {"id": "d3", "front": "見る", "back": "to see", "reading": "みる"},
                        {"id": "d4", "front": "聞く", "back": "to listen", "reading": "きく"},
                        {"id": "d5", "front": "読む", "back": "to read", "reading": "よむ"}
                    ]
                },
                "actions": {
                    "canSaveToLibrary": True,
                    "canEditBeforeSave": True
                }
            },
            
            # 3. Quiz (Inline, 3-5 questions)
            {
                "type": "quiz",
                "title": "Debug Quiz - Grammar",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "level": "N4",
                    "skill": "grammar",
                    "questionCount": 3,
                    "passingScore": 60
                },
                "data": {
                    "description": "Debug quiz with 3 questions",
                    "showExplanations": True,
                    "questions": [
                        {
                            "id": "q1",
                            "type": "multiple_choice",
                            "content": "What does 〜たら mean?",
                            "options": [
                                {"id": "a", "text": "If/When"},
                                {"id": "b", "text": "Because"},
                                {"id": "c", "text": "But"},
                                {"id": "d", "text": "And"}
                            ],
                            "correctAnswer": "a",
                            "explanation": "〜たら is conditional"
                        },
                        {
                            "id": "q2",
                            "type": "multiple_choice",
                            "content": "Choose correct: 雨___降ったら...",
                            "options": [
                                {"id": "a", "text": "が"},
                                {"id": "b", "text": "を"},
                                {"id": "c", "text": "に"},
                                {"id": "d", "text": "で"}
                            ],
                            "correctAnswer": "a",
                            "explanation": "雨が is the subject"
                        },
                        {
                            "id": "q3",
                            "type": "multiple_choice",
                            "content": "〜ても means?",
                            "options": [
                                {"id": "a", "text": "Even if"},
                                {"id": "b", "text": "When"},
                                {"id": "c", "text": "While"},
                                {"id": "d", "text": "Before"}
                            ],
                            "correctAnswer": "a",
                            "explanation": "〜ても = even if"
                        }
                    ]
                },
                "actions": {
                    "canStartInline": True,
                    "canSaveToLibrary": True
                }
            },
            
            # 4. Exam (Full, navigate to page)
            {
                "type": "exam",
                "title": "Debug Exam - N3 Full Practice",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "level": "N3",
                    "skill": "mixed",
                    "questionCount": 10,
                    "timeLimitMinutes": 15,
                    "sections": ["vocabulary", "grammar"]
                },
                "data": {
                    "description": "Debug exam with timer and sections",
                    "passingScore": 60,
                    "sections": [
                        {
                            "name": "Vocabulary",
                            "questions": [
                                {
                                    "id": "e1", 
                                    "type": "multiple_choice", 
                                    "content": "影響 means?",
                                    "options": [{"id": "a", "text": "influence"}, {"id": "b", "text": "shadow"}],
                                    "correctAnswer": "a", 
                                    "explanation": "影響 = influence"
                                },
                                {
                                    "id": "e2", 
                                    "type": "multiple_choice", 
                                    "content": "関係 means?",
                                    "options": [{"id": "a", "text": "relationship"}, {"id": "b", "text": "gate"}],
                                    "correctAnswer": "a", 
                                    "explanation": "関係 = relationship"
                                }
                            ]
                        },
                        {
                            "name": "Grammar",
                            "questions": [
                                {
                                    "id": "e3", 
                                    "type": "multiple_choice", 
                                    "content": "〜ばかり means?",
                                    "options": [{"id": "a", "text": "just did"}, {"id": "b", "text": "will do"}],
                                    "correctAnswer": "a", 
                                    "explanation": "〜ばかり = just did"
                                }
                            ]
                        }
                    ]
                },
                "actions": {
                    "canStartInline": False,
                    "canNavigateToExamPage": True,
                    "canSaveForLater": True
                }
            },
            
            # 5. Vocabulary List
            {
                "type": "vocabulary",
                "title": "Debug Vocabulary Set",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "level": "N4",
                    "category": "nouns"
                },
                "data": {
                    "items": [
                        {"word": "予約", "reading": "よやく", "definition": "reservation", "example": "ホテルを予約する。"},
                        {"word": "経験", "reading": "けいけん", "definition": "experience", "example": "いい経験になった。"},
                        {"word": "準備", "reading": "じゅんび", "definition": "preparation", "example": "旅行の準備をする。"}
                    ]
                }
            },
            
            # 6. Mindmap
            {
                "type": "mindmap",
                "title": "Debug Mindmap - Japanese Verbs",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "topic": "verbs"
                },
                "data": {
                    "root": {"id": "root", "label": "動詞 (Verbs)"},
                    "nodes": [
                        {"id": "n1", "label": "一段動詞", "parent": "root"},
                        {"id": "n2", "label": "五段動詞", "parent": "root"},
                        {"id": "n3", "label": "食べる", "parent": "n1"},
                        {"id": "n4", "label": "見る", "parent": "n1"},
                        {"id": "n5", "label": "飲む", "parent": "n2"},
                        {"id": "n6", "label": "書く", "parent": "n2"}
                    ]
                }
            },
            
            # 7. Task
            {
                "type": "task",
                "title": "Debug Task",
                "sidebar": {"group": "Debug", "status": "new"},
                "metadata": {
                    "priority": "medium",
                    "category": "study"
                },
                "data": {
                    "task": {
                        "title": "Review N5 Vocabulary",
                        "description": "Study 20 new words from the N5 list",
                        "status": "pending",
                        "dueDate": None
                    }
                }
            }
        ]

