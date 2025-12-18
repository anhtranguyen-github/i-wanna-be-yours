"""
Content Creator Service for Hanachan AI
Generates flashcards, quizzes, and exams based on user requests
"""

from typing import List, Dict, Any, Optional
import re

class ContentCreatorService:
    """Service for generating learning content from user prompts"""
    
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

    # JLPT vocabulary samples by level
    JLPT_VOCAB = {
        "N5": [
            {"word": "食べる", "reading": "たべる", "meaning": "to eat", "example": "ごはんを食べる。"},
            {"word": "飲む", "reading": "のむ", "meaning": "to drink", "example": "水を飲む。"},
            {"word": "見る", "reading": "みる", "meaning": "to see/watch", "example": "テレビを見る。"},
            {"word": "聞く", "reading": "きく", "meaning": "to listen/ask", "example": "音楽を聞く。"},
            {"word": "読む", "reading": "よむ", "meaning": "to read", "example": "本を読む。"},
            {"word": "書く", "reading": "かく", "meaning": "to write", "example": "手紙を書く。"},
            {"word": "話す", "reading": "はなす", "meaning": "to speak", "example": "日本語を話す。"},
            {"word": "行く", "reading": "いく", "meaning": "to go", "example": "学校に行く。"},
            {"word": "来る", "reading": "くる", "meaning": "to come", "example": "友達が来る。"},
            {"word": "帰る", "reading": "かえる", "meaning": "to return", "example": "家に帰る。"},
        ],
        "N4": [
            {"word": "予約", "reading": "よやく", "meaning": "reservation", "example": "ホテルを予約する。"},
            {"word": "経験", "reading": "けいけん", "meaning": "experience", "example": "いい経験になった。"},
            {"word": "準備", "reading": "じゅんび", "meaning": "preparation", "example": "旅行の準備をする。"},
            {"word": "説明", "reading": "せつめい", "meaning": "explanation", "example": "先生が説明する。"},
            {"word": "紹介", "reading": "しょうかい", "meaning": "introduction", "example": "友達を紹介する。"},
            {"word": "届ける", "reading": "とどける", "meaning": "to deliver", "example": "荷物を届ける。"},
            {"word": "届く", "reading": "とどく", "meaning": "to arrive", "example": "手紙が届く。"},
            {"word": "決める", "reading": "きめる", "meaning": "to decide", "example": "予定を決める。"},
        ],
        "N3": [
            {"word": "影響", "reading": "えいきょう", "meaning": "influence", "example": "天気の影響で遅れた。"},
            {"word": "関係", "reading": "かんけい", "meaning": "relationship", "example": "仕事と関係がある。"},
            {"word": "機会", "reading": "きかい", "meaning": "opportunity", "example": "いい機会だ。"},
            {"word": "期待", "reading": "きたい", "meaning": "expectation", "example": "結果を期待する。"},
            {"word": "共通", "reading": "きょうつう", "meaning": "common", "example": "共通の友達がいる。"},
            {"word": "現在", "reading": "げんざい", "meaning": "present/current", "example": "現在の状況。"},
            {"word": "効果", "reading": "こうか", "meaning": "effect", "example": "薬の効果がある。"},
            {"word": "参加", "reading": "さんか", "meaning": "participation", "example": "会議に参加する。"},
        ],
    }
    
    # Grammar patterns by level
    JLPT_GRAMMAR = {
        "N5": [
            {"pattern": "〜ます", "meaning": "Polite verb ending", "example": "食べます。"},
            {"pattern": "〜ません", "meaning": "Polite negative", "example": "食べません。"},
            {"pattern": "〜たい", "meaning": "Want to do", "example": "日本に行きたい。"},
            {"pattern": "〜てください", "meaning": "Please do", "example": "教えてください。"},
            {"pattern": "〜ましょう", "meaning": "Let's do", "example": "一緒に行きましょう。"},
        ],
        "N4": [
            {"pattern": "〜たら", "meaning": "If/When", "example": "雨が降ったら、行かない。"},
            {"pattern": "〜ても", "meaning": "Even if", "example": "高くても買う。"},
            {"pattern": "〜ながら", "meaning": "While doing", "example": "音楽を聞きながら勉強する。"},
            {"pattern": "〜そうだ", "meaning": "Looks like / Hearsay", "example": "おいしそうだ。"},
            {"pattern": "〜ようにする", "meaning": "Try to / Make sure to", "example": "早く寝るようにする。"},
        ],
        "N3": [
            {"pattern": "〜ばかり", "meaning": "Just did / Only", "example": "日本に来たばかりです。"},
            {"pattern": "〜とおり", "meaning": "As / In accordance with", "example": "予定通りに進んだ。"},
            {"pattern": "〜向け", "meaning": "Intended for", "example": "子供向けの本。"},
            {"pattern": "〜わけがない", "meaning": "No way that", "example": "そんなわけがない。"},
            {"pattern": "〜ことになる", "meaning": "It turns out that", "example": "転勤することになった。"},
        ],
    }

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
        # Look for numbers
        numbers = re.findall(r'\d+', prompt)
        if numbers:
            count = int(numbers[0])
            return min(max(count, 3), 20)  # Clamp between 3 and 20
        return 5  # Default

    @classmethod
    def generate_flashcards(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate flashcard set based on prompt"""
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        count = cls.detect_count(prompt)
        
        cards = []
        title = f"JLPT {level} {skill.title()} Flashcards"
        
        if skill == "vocabulary":
            vocab_list = cls.JLPT_VOCAB.get(level, cls.JLPT_VOCAB["N5"])
            for i, v in enumerate(vocab_list[:count]):
                cards.append({
                    "front": f"{v['word']} ({v['reading']})",
                    "back": f"{v['meaning']}\n\n例: {v['example']}"
                })
        elif skill == "grammar":
            grammar_list = cls.JLPT_GRAMMAR.get(level, cls.JLPT_GRAMMAR["N5"])
            for i, g in enumerate(grammar_list[:count]):
                cards.append({
                    "front": g["pattern"],
                    "back": f"{g['meaning']}\n\n例: {g['example']}"
                })
        
        return {
            "type": "flashcard",
            "title": title,
            "data": {
                "title": title,
                "level": level,
                "skill": skill,
                "cards": cards
            }
        }

    @classmethod
    def generate_quiz(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate quiz based on prompt"""
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        count = cls.detect_count(prompt)
        
        questions = []
        title = f"JLPT {level} {skill.title()} Quiz"
        
        if skill == "vocabulary":
            vocab_list = cls.JLPT_VOCAB.get(level, cls.JLPT_VOCAB["N5"])
            for i, v in enumerate(vocab_list[:count]):
                # Create meaning -> word question
                wrong_answers = [x["word"] for x in vocab_list if x != v][:3]
                options = [
                    {"id": "a", "text": v["word"]},
                    {"id": "b", "text": wrong_answers[0] if len(wrong_answers) > 0 else "分かる"},
                    {"id": "c", "text": wrong_answers[1] if len(wrong_answers) > 1 else "話す"},
                    {"id": "d", "text": wrong_answers[2] if len(wrong_answers) > 2 else "思う"},
                ]
                
                questions.append({
                    "type": "multiple_choice",
                    "content": f"What is the Japanese word for '{v['meaning']}'?",
                    "options": options,
                    "correctAnswer": "a",
                    "explanation": f"「{v['word']}」({v['reading']}) means '{v['meaning']}'. Example: {v['example']}",
                    "skill": "vocabulary",
                    "difficulty": 3
                })
        
        elif skill == "grammar":
            grammar_list = cls.JLPT_GRAMMAR.get(level, cls.JLPT_GRAMMAR["N5"])
            for i, g in enumerate(grammar_list[:count]):
                wrong_patterns = [x["pattern"] for x in grammar_list if x != g][:3]
                options = [
                    {"id": "a", "text": g["pattern"]},
                    {"id": "b", "text": wrong_patterns[0] if len(wrong_patterns) > 0 else "〜ない"},
                    {"id": "c", "text": wrong_patterns[1] if len(wrong_patterns) > 1 else "〜だ"},
                    {"id": "d", "text": wrong_patterns[2] if len(wrong_patterns) > 2 else "〜です"},
                ]
                
                questions.append({
                    "type": "multiple_choice",
                    "content": f"Which grammar pattern means '{g['meaning']}'?",
                    "options": options,
                    "correctAnswer": "a",
                    "explanation": f"{g['pattern']} means '{g['meaning']}'. Example: {g['example']}",
                    "skill": "grammar",
                    "difficulty": 3
                })
        
        return {
            "type": "quiz",
            "title": title,
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

    @classmethod
    def generate_exam(cls, prompt: str, user_id: str = None) -> Dict[str, Any]:
        """Generate exam (more comprehensive than quiz)"""
        level = cls.detect_jlpt_level(prompt)
        count = 10  # Exams have more questions
        
        # Mix vocabulary and grammar
        questions = []
        title = f"JLPT {level} Practice Exam"
        
        vocab_list = cls.JLPT_VOCAB.get(level, cls.JLPT_VOCAB["N5"])
        grammar_list = cls.JLPT_GRAMMAR.get(level, cls.JLPT_GRAMMAR["N5"])
        
        # Add vocabulary questions
        for i, v in enumerate(vocab_list[:5]):
            wrong_answers = [x["word"] for x in vocab_list if x != v][:3]
            questions.append({
                "type": "multiple_choice",
                "content": f"【語彙】「{v['meaning']}」の日本語は何ですか。",
                "options": [
                    {"id": "a", "text": v["word"]},
                    {"id": "b", "text": wrong_answers[0] if wrong_answers else "話す"},
                    {"id": "c", "text": wrong_answers[1] if len(wrong_answers) > 1 else "聞く"},
                    {"id": "d", "text": wrong_answers[2] if len(wrong_answers) > 2 else "見る"},
                ],
                "correctAnswer": "a",
                "explanation": f"「{v['word']}」({v['reading']}) = {v['meaning']}",
                "skill": "vocabulary",
                "difficulty": 3
            })
        
        # Add grammar questions
        for i, g in enumerate(grammar_list[:5]):
            wrong_patterns = [x["meaning"] for x in grammar_list if x != g][:3]
            questions.append({
                "type": "multiple_choice",
                "content": f"【文法】「{g['pattern']}」の意味は何ですか。",
                "options": [
                    {"id": "a", "text": g["meaning"]},
                    {"id": "b", "text": wrong_patterns[0] if wrong_patterns else "Negative"},
                    {"id": "c", "text": wrong_patterns[1] if len(wrong_patterns) > 1 else "Past tense"},
                    {"id": "d", "text": wrong_patterns[2] if len(wrong_patterns) > 2 else "Question"},
                ],
                "correctAnswer": "a",
                "explanation": f"{g['pattern']} = {g['meaning']}. 例: {g['example']}",
                "skill": "grammar",
                "difficulty": 3
            })
        
        return {
            "type": "quiz",  # Uses same quiz artifact type
            "title": title,
            "data": {
                "title": title,
                "description": f"Comprehensive {level} practice exam covering vocabulary and grammar",
                "quizType": "exam",
                "level": level,
                "skill": "mixed",
                "timeLimitMinutes": 30,
                "questions": questions
            }
        }

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
                "content": "I'm not sure what you'd like me to create. You can ask me to:\n- Create flashcards\n- Make a quiz\n- Generate a practice exam",
                "artifacts": [],
                "suggestions": [
                    {"text": "Create N5 vocabulary flashcards"},
                    {"text": "Make a grammar quiz for N4"},
                    {"text": "Generate an N3 practice exam"}
                ]
            }
        
        level = cls.detect_jlpt_level(prompt)
        skill = cls.detect_skill_type(prompt)
        
        if intent == "flashcard":
            card_count = len(artifact["data"]["cards"])
            content = f"""### 📚 Flashcard Set Created!

I've created a set of **{card_count} flashcards** for JLPT {level} {skill}.

**{artifact['title']}**

You can:
- Click on any card to flip it
- Save this set to your library
- Request more cards with a different topic

Would you like me to create more flashcards or quiz you on these words?"""
        
        elif intent == "quiz":
            q_count = len(artifact["data"]["questions"])
            content = f"""### 📝 Quiz Created!

I've generated a **{q_count}-question quiz** for JLPT {level} {skill}.

**{artifact['title']}**

Features:
- Multiple choice questions
- Instant feedback after submission
- Detailed explanations

Click "Start Quiz" to begin, or save it to your library for later!"""
        
        elif intent == "exam":
            q_count = len(artifact["data"]["questions"])
            time_limit = artifact["data"]["timeLimitMinutes"]
            content = f"""### 🎓 Practice Exam Created!

I've created a comprehensive **{q_count}-question practice exam** for JLPT {level}.

**{artifact['title']}**

This exam includes:
- Vocabulary questions
- Grammar questions
- Time limit: {time_limit} minutes

Good luck! 頑張ってください！"""
        
        return {
            "content": content,
            "artifacts": [artifact],
            "suggestions": [
                {"text": f"Create more {level} flashcards"},
                {"text": f"Quiz me on {level} grammar"},
                {"text": "Show my study progress"}
            ]
        }
