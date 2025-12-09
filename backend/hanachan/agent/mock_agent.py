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
        """
        
        # Build Resource String
        resource_info = []
        if attachments:
            for res in attachments:
                # Handle both dict or object depending on what's passed
                r_id = getattr(res, 'id', 'Unknown')
                r_title = getattr(res, 'title', 'Unknown')
                r_type = getattr(res, 'type', 'Unknown')
                resource_info.append(f"- [{r_id}] {r_title} ({r_type})")
        
        resources_str = "\n".join(resource_info) if resource_info else "None"
        
        debug_content = f"""
### Mock Agent Debug Response
**Session ID:** `{session_id}`
**User ID:** `{user_id}`

**Prompt Received:**
> {prompt}

**Attached Resources:**
{resources_str}

**System Status:**
- Database Persistence: ✅ (Message ID: {message_id})
- Context Config: `{context_config}`
"""
        
        # Mock Logic for Rich Content
        tasks = []
        suggestions = []
        
        if "task" in prompt.lower():
            tasks.append({
                "title": "Debug Task",
                "description": "Verify system logs for detailed error tracking.",
                "status": "pending"
            })
            
        suggestions.append({"text": "Upload a log file"})
        suggestions.append({"text": "Check database status"})

        return {
            "content": debug_content,
            "tasks": tasks,
            "suggestions": suggestions
        }
