import os
import json
import logging
import requests
from typing import List, Dict, Any, Generator
from services.resource_processor import ResourceProcessor

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
CHAT_MODEL = os.environ.get("CHAT_MODEL", "qwen3:1.7b")
VISION_MODEL = os.environ.get("VISION_MODEL", "qwen3-vl:2b")

logger = logging.getLogger(__name__)

class OllamaAgent:
    def __init__(self):
        self.processor = ResourceProcessor()
        self.skills_dir = os.path.join(os.path.dirname(__file__), "skills")

    def _get_system_prompt(self) -> str:
        try:
            skill_path = os.path.join(self.skills_dir, "chat_persona.md")
            with open(skill_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return "You are Hanachan, an AI language tutor for Hanabira.org. Help users with Japanese/Korean learning."

    def invoke(self, 
               prompt: str, 
               user_id: str, 
               resource_ids: List[str] = None,
               stream: bool = False) -> Any:
        
        resource_ids = resource_ids or []
        system_prompt = self._get_system_prompt()
        
        # 1. Gather Resource Context
        context_data = []
        images = []
        has_images = False
        
        for rid in resource_ids:
            res = self.processor.get_resource_content(rid)
            if not res:
                continue
                
            if res.get('mediaBase64'):
                images.append(res['mediaBase64'])
                has_images = True
                context_data.append(f"--- ATTACHED IMAGE: {res['title']} ---")
            elif res.get('content'):
                context_data.append(f"--- RESOURCE: {res['title']} ---\n{res['content']}")
        
        context_str = "\n\n".join(context_data)
        if context_str:
            system_prompt += f"\n\n## ATTACHED RESOURCES (GROUNDING CONTEXT):\n{context_str}"

        # 2. Select Model (Switch to VL if images present)
        model_name = VISION_MODEL if has_images else CHAT_MODEL

        # 3. Call Ollama
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # Add images to the last message if any
        if images:
            messages[-1]["images"] = images

        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model_name,
                    "messages": messages,
                    "stream": stream,
                    "options": {"temperature": 0.7}
                },
                stream=stream,
                timeout=120
            )

            if stream:
                return self._stream_generator(response)
            else:
                return response.json().get("message", {}).get("content", "I encountered a neural synchronization error.")
        except Exception as e:
            logger.error(f"Ollama Agent Error: {e}")
            return "My neural core is currently recalibrating. Please try again in a moment."

    def _stream_generator(self, response: requests.Response) -> Generator[str, None, None]:
        for line in response.iter_lines():
            if line:
                try:
                    chunk = json.loads(line.decode('utf-8'))
                    if not chunk.get('done'):
                        yield chunk.get('message', {}).get('content', '')
                except Exception as e:
                    logger.error(f"Error decoding stream line: {e}")
                    continue
