from typing import List, Dict, Any


class MockAgent:
    def generate_debug_response(self, 
                                prompt: str, 
                                session_id: str, 
                                user_id: str, 
                                context_config: Dict[str, Any], 
                                message_id: int, 
                                attachments: List[Any]) -> str:
        """
        Generates a markdown debug response echoing all received data.
        Enhanced with study plan context awareness.
        """
        
        # Check for study plan intent
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
        
        # Build Resource String
        resource_info = []
        if attachments:
            for res in attachments:
                r_id = getattr(res, 'id', 'Unknown')
                r_title = getattr(res, 'title', 'Unknown')
                r_type = getattr(res, 'type', 'Unknown')
                resource_info.append(f"- [{r_id}] {r_title} ({r_type})")
        
        resources_str = "\n".join(resource_info) if resource_info else "None"
        
        # Build debug content
        debug_content = f"""
### Mock Agent Debug Response
**Session ID:** `{session_id}`
**User ID:** `{user_id}`

**Prompt Received:**
> {prompt}

**Attached Resources:**
{resources_str}

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
        
        # Mock Logic for Rich Content
        tasks = []
        suggestions = []
        artifacts = []
        
        lower_prompt = prompt.lower()
        
        # Add study plan artifacts first if any
        artifacts.extend(study_artifacts)
        
        # Add study-specific suggestions
        if study_intent:
            suggestions.append({"text": "Show my daily tasks"})
            suggestions.append({"text": "How's my progress?"})
            suggestions.append({"text": "Quiz me on vocabulary"})
        else:
            # Default debug artifacts
            tasks.append({
                "title": "Debug Task",
                "description": "Verify system logs for detailed error tracking.",
                "status": "pending"
            })
            
            artifacts.append({
                "type": "task",
                "title": "System Check Task",
                "data": {
                    "task": {
                        "title": "Debug Task",
                        "description": "Verify system logs for detailed error tracking.",
                        "status": "pending"
                    }
                }
            })
            
            artifacts.append({
                "type": "mindmap",
                "title": "Debug Mindmap",
                "data": {
                    "root": {"id": "root", "label": "Central Concept"},
                    "nodes": [
                        {"id": "1", "label": "Branch A", "parent": "root"},
                        {"id": "2", "label": "Branch B", "parent": "root"}
                    ]
                }
            })

            artifacts.append({
                "type": "flashcard",
                "title": "Debug Flashcards",
                "data": {
                    "cards": [
                        {"front": "Debug", "back": "Fixing code"},
                        {"front": "Agent", "back": "Autonomous Actor"}
                    ]
                }
            })
            
            artifacts.append({
                "type": "vocabulary",
                "title": "Debug Vocabulary",
                "data": {
                    "items": [
                        {"word": "Bug", "definition": "An error in a program", "example": "I found a bug."},
                        {"word": "Feature", "definition": "A distinctive attribute", "example": "This is a new feature."}
                    ]
                }
            })
                
            suggestions.append({"text": "Upload a log file"})
            suggestions.append({"text": "Check database status"})

        return {
            "content": debug_content,
            "tasks": tasks,
            "suggestions": suggestions,
            "artifacts": artifacts
        }

