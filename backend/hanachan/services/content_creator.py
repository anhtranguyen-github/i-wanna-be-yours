import logging
import json
import re
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_factory import ModelFactory

logger = logging.getLogger(__name__)

class ContentCreatorService:
    """Service for generating learning content using LLM (Groq/OpenAI)"""
    
    # Intent patterns for content creation
    FLASHCARD_PATTERNS = [
        r"create\s+.*flashcard",
        r"make\s+.*flashcard",
        r"generate\s+.*flashcard",
        r"flashcard.*for",
        r"flashcard.*about",
        r"フラッシュカード",
    ]
    
    QUIZ_PATTERNS = [
        r"create\s+quiz",
        r"make\s+quiz",
        r"generate\s+quiz",
        r"quiz\s+me",
        r"quiz.*about",
        r"quiz.*for",
        r"practice\s+quiz",
        r"クイズ",
    ]
    
    EXAM_PATTERNS = [
        r"create\s+exam",
        r"make\s+exam",
        r"generate\s+exam",
        r"practice\s+exam",
        r"test\s+me",
        r"exam.*about",
        r"模擬試験",
    ]

    @classmethod
    def fit_model(cls) -> Any:
        # Use a slightly more creative temperature for content generation
        return ModelFactory.create_chat_model(temperature=0.7)

    @classmethod
    def detect_creation_intent(cls, prompt: str) -> Optional[str]:
        """Detect if user wants to create content and what type"""
        lower_prompt = prompt.lower()
        
        for pattern in cls.FLASHCARD_PATTERNS:
            if re.search(pattern, lower_prompt):
                return "flashcard"
        
        for pattern in cls.QUIZ_PATTERNS:
            if re.search(pattern, lower_prompt):
                return "quiz"
        
        for pattern in cls.EXAM_PATTERNS:
            if re.search(pattern, lower_prompt):
                return "exam"
        
        return None
    
    @classmethod
    def detect_jlpt_level(cls, prompt: str) -> str:
        """Extract JLPT level from prompt"""
        lower_prompt = prompt.lower()
        for level in ["n5", "n4", "n3", "n2", "n1"]:
            if level in lower_prompt:
                return level.upper()
        return "N5"  # Default
    
    @classmethod
    def detect_skill_type(cls, prompt: str) -> str:
        """Detect skill type from prompt"""
        lower_prompt = prompt.lower()
        
        if any(w in lower_prompt for w in ["vocab", "単語", "言葉", "vocabulary", "word"]):
            return "vocabulary"
        if any(w in lower_prompt for w in ["grammar", "文法", "pattern"]):
            return "grammar"
        if any(w in lower_prompt for w in ["reading", "読解", "読む"]):
            return "reading"
        if any(w in lower_prompt for w in ["listening", "聴解", "リスニング"]):
            return "listening"
        
        return "vocabulary"  # Default
    
    @classmethod
    def detect_count(cls, prompt: str) -> int:
        """Detect desired number of items from prompt"""
        numbers = re.findall(r'\d+', prompt)
        if numbers:
            count = int(numbers[0])
            return min(max(count, 3), 20)  # Clamp between 3 and 20
        return 5  # Default

    @staticmethod
    def _parse_llm_json(response_content: str) -> Any:
        """Helper to parse JSON strictly from LLM response"""
        try:
            # Try finding the first { or [
            start = -1
            end = -1
            if '{' in response_content:
                start = response_content.find('{')
                end = response_content.rfind('}') + 1
            if '[' in response_content:
                # If [ comes before {, or if { is not found
                if start == -1 or (response_content.find('[') < start):
                    start = response_content.find('[')
                    end = response_content.rfind(']') + 1
            
            if start != -1 and end != -1:
                clean_json = response_content[start:end]
                return json.loads(clean_json)
            else:
                return json.loads(response_content)
        except Exception as e:
            logger.error(f"Failed to parse JSON from LLM: {e}")
            logger.debug(f"Raw Output: {response_content}")
            return None

    @classmethod
    def generate_flashcards(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate flashcard set via LLM"""
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        count = cls.detect_count(prompt)
        
        llm = cls.fit_model()
        
        system_prompt = f"""You are a Japanese language sensei.
        Generate {count} flashcards for {level} level focusing on '{skill}'.
        Return ONLY valid JSON in this format:
        [
            {{
                "front": "Japanese Word/Kanji or Grammar Pattern",
                "back": "Meaning in English\\n\\nExample: Japanese sentence (Translation)"
            }}
        ]
        Do not output any markdown code fences or extra text. Just the JSON array.
        """
        
        try:
            logger.info(f"Generating flashcards via LLM: {level} {skill} x{count}")
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ])
            cards = cls._parse_llm_json(response.content)
            
            if not cards or not isinstance(cards, list):
                logger.warning("LLM returned invalid flashcard format.")
                return None

            title = f"JLPT {level} {skill.title()} Flashcards"
            return {
                "type": "flashcard",
                "title": title,
                "sidebar": {"group": "Flashcards", "status": "new"},
                "data": {
                    "title": title,
                    "level": level,
                    "skill": skill,
                    "cards": cards
                }
            }
        except Exception as e:
            logger.error(f"Error generating flashcards: {e}")
            return None

    @classmethod
    def generate_quiz(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate quiz via LLM"""
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        count = cls.detect_count(prompt)
        
        llm = cls.fit_model()
        
        system_prompt = f"""You are a Japanese language quiz master.
        Create a {count}-question multiple choice quiz for {level} level about '{skill}'.
        Return ONLY valid JSON in this format:
        [
            {{
                "content": "The question text (e.g. 'What is the reading of 食事?')",
                "options": [
                    {{"id": "a", "text": "Option A"}},
                    {{"id": "b", "text": "Option B"}},
                    {{"id": "c", "text": "Option C"}},
                    {{"id": "d", "text": "Option D"}}
                ],
                "correctAnswer": "id of correct option (a, b, c, or d)",
                "explanation": "Why it is correct.",
                "difficulty": 3
            }}
        ]
        Do not output markdown code fences. Strictly JSON array.
        """
        
        try:
            logger.info(f"Generating quiz via LLM: {level} {skill} x{count}")
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ])
            questions = cls._parse_llm_json(response.content)
            
            if not questions or not isinstance(questions, list):
                logger.warning("LLM returned invalid quiz format.")
                return None
                
            # Post-process to ensure correct fields
            for q in questions:
                q["type"] = "multiple_choice"
                q["skill"] = skill
                
            title = f"JLPT {level} {skill.title()} Quiz"
            return {
                "type": "quiz",
                "title": title,
                "sidebar": {"group": "Quizzes", "status": "new"},
                "data": {
                    "title": title,
                    "description": f"Practice quiz for {level} {skill}",
                    "quizType": "quiz",
                    "level": level,
                    "skill": skill,
                    "timeLimitMinutes": None,
                    "questions": questions
                }
            }
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return None

    @classmethod
    def generate_exam(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate exam via LLM"""
        level = cls.detect_jlpt_level(prompt)
        count = 10 # Default for exam
        
        llm = cls.fit_model()
        
        system_prompt = f"""You are a Japanese language exam proctor.
        Create a comprehensive {count}-question practice exam for {level} level.
        Include 5 Vocabulary/Kanji questions and 5 Grammar questions.
        Return ONLY valid JSON in this format:
        [
            {{
                "content": "Question text",
                "options": [
                    {{"id": "a", "text": "..."}},
                    {{"id": "b", "text": "..."}},
                    {{"id": "c", "text": "..."}},
                    {{"id": "d", "text": "..."}}
                ],
                "correctAnswer": "a",
                "explanation": "Explanation",
                "skill": "vocabulary" (or "grammar"),
                "difficulty": 3
            }}
        ]
        Do not output markdown code fences. Strictly JSON array.
        """
        
        try:
            logger.info(f"Generating exam via LLM: {level}")
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=prompt)
            ])
            questions = cls._parse_llm_json(response.content)
            
            if not questions or not isinstance(questions, list):
                return None
                
            for q in questions:
                q["type"] = "multiple_choice"

            title = f"JLPT {level} Practice Exam"
            return {
                "type": "quiz",  # Uses same quiz artifact type
                "title": title,
                "sidebar": {"group": "Exams", "status": "new"},
                "data": {
                    "title": title,
                    "description": f"Comprehensive {level} practice exam",
                    "quizType": "exam",
                    "level": level,
                    "skill": "mixed",
                    "timeLimitMinutes": 30,
                    "questions": questions
                }
            }
        except Exception as e:
            logger.error(f"Error generating exam: {e}")
            return None

    @classmethod
    def generate_content(cls, intent: str, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Main entry point for content generation"""
        if intent == "flashcard":
            return cls.generate_flashcards(prompt, user_id)
        elif intent == "quiz":
            return cls.generate_quiz(prompt, user_id)
        elif intent == "exam":
            return cls.generate_exam(prompt, user_id)
        else:
            return None

    @classmethod
    def generate_creation_response(cls, intent: str, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate full response with content and message"""
        artifact = cls.generate_content(intent, prompt, user_id)
        
        if not artifact:
            return {
                "content": "I couldn't generate the content this time. Please try again or be more specific.",
                "artifacts": [],
                "suggestions": []
            }
        
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        
        # Reuse previous simple response templates
        if intent == "flashcard":
            card_count = len(artifact["data"]["cards"])
            content = f"### 📚 Flashcard Set Created!\n\nI've created **{card_count} flashcards** for JLPT {level} {skill} using the latest study data."
        
        elif intent == "quiz":
            q_count = len(artifact["data"]["questions"])
            content = f"### 📝 Quiz Generated!\n\nA fresh **{q_count}-question quiz** for JLPT {level} {skill} is ready."
        
        elif intent == "exam":
            q_count = len(artifact["data"]["questions"])
            content = f"### 🎓 Practice Exam Ready!\n\nI've generated a comprehensive **{q_count}-question exam** for JLPT {level}."
        
        return {
            "content": content,
            "artifacts": [artifact],
            "suggestions": [
                {"text": f"Create more {level} flashcards"},
                {"text": f"Quiz me on {level} grammar"},
                {"text": "Show my study progress"}
            ]
        }
