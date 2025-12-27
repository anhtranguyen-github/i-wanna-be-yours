import os
import json
import re
import requests
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Configuration
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("LINGUISTICS_MODEL", "qwen3:1.7b")
DICTIONARY_SERVICE_URL = "http://localhost:5200"

logger = logging.getLogger(__name__)

class LinguisticsService:
    """Hybrid Linguistic Service combining MeCab precision with Qwen3 intelligence"""

    def __init__(self):
        self.skills_dir = os.path.join(os.path.dirname(__file__), "..", "agent", "skills")

    def _get_skill_prompt(self, skill_name: str) -> str:
        """Load skill prompt from markdown file"""
        try:
            skill_path = os.path.join(self.skills_dir, f"{skill_name}.md")
            with open(skill_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error loading skill {skill_name}: {e}")
            return f"Act as a professional linguist for {skill_name}."

    def _get_mecab_context(self, text: str) -> List[Any]:
        """Fetch deterministic tokenization from the Dictionary Service (Port 5200)"""
        try:
            response = requests.post(
                f"{DICTIONARY_SERVICE_URL}/v1/parse-split",
                json={"text": text},
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.warn(f"MeCab service unreachable: {e}")
            return []

    def _call_ollama(self, prompt: str, system_prompt: str) -> Optional[str]:
        """Execute call to local Ollama container"""
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.3}
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json().get("message", {}).get("content", "")
            return None
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return None

    def _extract_json(self, text: str) -> Optional[Dict]:
        """Sanitize and extract JSON from LLM response"""
        if not text: return None
        try:
            # Look for code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
            if json_match:
                return json.loads(json_match.group(1).strip())
            
            # Look for curly braces
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group())
            
            return json.loads(text)
        except:
            return None

    def parse_tree(self, text: str) -> Dict[str, Any]:
        """Generate a syntactic parse tree for Grammar Graph"""
        system_prompt = self._get_skill_prompt("grammar_graph")
        mecab_data = self._get_mecab_context(text)
        
        prompt = f"Sentence: {text}\n"
        if mecab_data:
            prompt += f"MeCab Anatomy (Context): {json.dumps(mecab_data, ensure_ascii=False)}"
        
        response_text = self._call_ollama(prompt, system_prompt)
        result = self._extract_json(response_text)
        
        if not result:
            # Fallback for UI if AI fails
            return {
                "value": text,
                "translation": "Analysis failed partially",
                "children": []
            }
        return result

    def translate(self, text: str) -> str:
        """High-nuance translation"""
        system_prompt = self._get_skill_prompt("translator")
        mecab_data = self._get_mecab_context(text)
        
        prompt = f"Text to translate: {text}\n"
        if mecab_data:
            prompt += f"Linguistic Context: {json.dumps(mecab_data, ensure_ascii=False)}"
            
        return self._call_ollama(prompt, system_prompt) or "Translation service unavailable."

    def phonetic_conversion(self, text: str) -> Dict[str, Any]:
        """Convert Japanese text to structural phonetics"""
        system_prompt = self._get_skill_prompt("phonetic_converter")
        mecab_data = self._get_mecab_context(text)
        
        prompt = f"Japanese text: {text}\n"
        if mecab_data:
            prompt += f"Base Anatomy: {json.dumps(mecab_data, ensure_ascii=False)}"
            
        response_text = self._call_ollama(prompt, system_prompt)
        return self._extract_json(response_text) or {"error": "Phonetic mapping failed"}
