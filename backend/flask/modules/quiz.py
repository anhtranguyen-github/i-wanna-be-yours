"""
Quiz Module - Flask Backend
Implements Quiz/Exercise submission, scoring, and result persistence.
Supports: System quizzes, AI-generated quizzes, User-created quizzes
"""

import os
import logging
import uuid
from flask import request, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson.objectid import ObjectId

# ----------------------------------------------------- #
# Question Types and Scoring Rules
# ----------------------------------------------------- #

QUESTION_TYPES = {
    "grammar_fill_blank": {"scoring": "binary", "category": "grammar"},
    "grammar_sentence_order": {"scoring": "partial", "category": "grammar"},
    "vocab_reading": {"scoring": "binary", "category": "vocabulary"},
    "vocab_synonym": {"scoring": "binary", "category": "vocabulary"},
    "kanji_reading": {"scoring": "binary", "category": "kanji"},
    "kanji_meaning": {"scoring": "binary", "category": "kanji"},
    "reading_comprehension": {"scoring": "binary", "category": "reading"},
}

QUIZ_ORIGINS = ["system", "chatbot", "manual"]
JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1", "mixed"]

# ----------------------------------------------------- #
# Scoring Engine
# ----------------------------------------------------- #

def score_binary(correct_answer, user_answer, points):
    """Binary scoring: full points or zero."""
    if isinstance(correct_answer, str) and isinstance(user_answer, str):
        is_correct = correct_answer.strip().lower() == user_answer.strip().lower()
    else:
        is_correct = correct_answer == user_answer
    return {
        "is_correct": is_correct,
        "points_earned": points if is_correct else 0,
    }


def score_partial_order(correct_answer, user_answer, points):
    """Partial scoring for sentence ordering: credit for correct positions."""
    if not isinstance(correct_answer, list) or not isinstance(user_answer, list):
        return {"is_correct": False, "points_earned": 0}
    
    if len(correct_answer) != len(user_answer):
        return {"is_correct": False, "points_earned": 0}
    
    correct_positions = sum(1 for i, ans in enumerate(user_answer) if ans == correct_answer[i])
    total_positions = len(correct_answer)
    
    is_correct = correct_positions == total_positions
    points_earned = round((correct_positions / total_positions) * points, 2)
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
    }


def score_question(question, user_answer):
    """Score a single question based on its type."""
    question_type = question.get("question_type", "")
    content = question.get("content", {})
    correct_answer = content.get("correct_answer")
    points = question.get("points", 1)
    scoring_rule = content.get("scoring_rule", "binary")
    
    if scoring_rule == "partial" or question_type == "grammar_sentence_order":
        return score_partial_order(correct_answer, user_answer, points)
    else:
        return score_binary(correct_answer, user_answer, points)


def score_submission(quiz, user_answers):
    """
    Score an entire quiz submission.
    
    Args:
        quiz: Quiz document with questions
        user_answers: Dict mapping question_id -> user's answer
    
    Returns:
        Scoring results with answers breakdown and weak items
    """
    results = []
    weak_items = []
    total_score = 0
    max_score = 0
    
    questions = quiz.get("questions", [])
    
    for question in questions:
        question_id = question.get("question_id", "")
        user_answer = user_answers.get(question_id)
        points = question.get("points", 1)
        max_score += points
        
        if user_answer is None:
            # No answer provided
            result = {
                "question_id": question_id,
                "user_answer": None,
                "is_correct": False,
                "points_earned": 0,
                "points_possible": points,
            }
        else:
            score_result = score_question(question, user_answer)
            result = {
                "question_id": question_id,
                "user_answer": user_answer,
                "is_correct": score_result["is_correct"],
                "points_earned": score_result["points_earned"],
                "points_possible": points,
            }
        
        results.append(result)
        total_score += result["points_earned"]
        
        # Track weak items for SRS
        if not result["is_correct"]:
            linked_flashcards = question.get("linked_flashcard_ids", [])
            learning_points = question.get("learning_points", [])
            question_type = question.get("question_type", "")
            
            for fc_id in linked_flashcards:
                weak_items.append({
                    "flashcard_id": fc_id,
                    "learning_point": learning_points[0] if learning_points else "",
                    "question_type": question_type,
                })
            
            # If no linked flashcards, still record the learning point
            if not linked_flashcards and learning_points:
                for lp in learning_points:
                    weak_items.append({
                        "flashcard_id": None,
                        "learning_point": lp,
                        "question_type": question_type,
                    })
    
    percentage = round((total_score / max_score * 100), 1) if max_score > 0 else 0
    
    return {
        "answers": results,
        "weak_items": weak_items,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
    }


# ----------------------------------------------------- #
# Quiz Module Class
# ----------------------------------------------------- #

class QuizModule:
    def __init__(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
        )
        self.logger = logging.getLogger(__name__)
        
        # Connect to flashcard DB for SRS updates
        self.mongo_client = MongoClient("mongodb://localhost:27017/")
        self.flashcard_db = self.mongo_client["flaskFlashcardDB"]
    
    def _update_srs_from_quiz(self, user_id, weak_items, quiz_origin):
        """
        Update SRS flashcard states based on quiz performance.
        
        Quiz origin affects the weight of the update:
        - system: 1.0 (formal assessment)
        - manual: 0.8 (teacher test)
        - chatbot: 0.5 (practice)
        """
        if not weak_items:
            return
        
        # Weight based on quiz origin
        origin_weights = {
            "system": 1.0,
            "manual": 0.8,
            "chatbot": 0.5,
        }
        weight = origin_weights.get(quiz_origin, 0.5)
        
        try:
            flashcard_collection = self.flashcard_db["flashcardstates"]
            
            for item in weak_items:
                flashcard_id = item.get("flashcard_id")
                learning_point = item.get("learning_point", "")
                
                if flashcard_id:
                    # Update specific flashcard by ID
                    flashcard_collection.update_one(
                        {"_id": ObjectId(flashcard_id), "userId": user_id},
                        {
                            "$set": {
                                "difficulty": "hard",
                                "last_quiz_miss": datetime.utcnow(),
                                "quiz_miss_weight": weight,
                            }
                        }
                    )
                elif learning_point:
                    # Try to find flashcard by learning point (kanji/word)
                    # This connects quiz performance to existing flashcards
                    flashcard_collection.update_many(
                        {
                            "userId": user_id,
                            "$or": [
                                {"kanji": learning_point},
                                {"word": learning_point},
                                {"vocabulary": learning_point},
                            ]
                        },
                        {
                            "$set": {
                                "difficulty": "hard",
                                "last_quiz_miss": datetime.utcnow(),
                                "quiz_miss_weight": weight,
                            }
                        }
                    )
            
            self.logger.info(f"Updated SRS for user {user_id}: {len(weak_items)} weak items processed")
            
        except Exception as e:
            self.logger.error(f"Error updating SRS from quiz: {e}")

    def _log_quiz_to_learner_progress(self, user_id, score, level, category, duration_minutes=None):
        """
        Log quiz completion to the learner progress system.
        
        This integrates quiz performance with overall learning tracking.
        """
        try:
            import requests
            
            # Post to learner progress API
            payload = {
                "user_id": user_id,
                "activity_type": "quiz_completed",
                "data": {
                    "score": score,
                    "level": level if level != "mixed" else None,
                    "category": category if category != "mixed" else None,
                    "duration_minutes": duration_minutes,
                }
            }
            
            response = requests.post(
                "http://localhost:5100/v1/learner/activity",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                self.logger.info(f"Logged quiz activity for user {user_id}, score: {score}%")
            else:
                self.logger.warning(f"Failed to log quiz activity: {response.status_code}")
                
        except Exception as e:
            # Don't fail the quiz submission if logging fails
            self.logger.error(f"Error logging quiz to learner progress: {e}")

    def register_routes(self, app):
        # MongoDB connection
        client = MongoClient("mongodb://localhost:27017/")
        quiz_db = client["flaskQuizDB"]
        
        # Collections
        quizzes_collection = quiz_db["quizzes"]
        attempts_collection = quiz_db["quiz_attempts"]
        
        # Create indexes
        quizzes_collection.create_index([("origin", 1), ("is_public", 1), ("is_active", 1)])
        quizzes_collection.create_index([("jlpt_level", 1)])
        quizzes_collection.create_index([("category", 1)])
        attempts_collection.create_index([("user_id", 1), ("completed_at", -1)])
        
        # ----------------------------------------------------------------
        # GET /v1/quizzes - List available quizzes
        # ----------------------------------------------------------------
        @app.route("/v1/quizzes", methods=["GET"])
        def list_quizzes():
            try:
                # Query parameters
                jlpt_level = request.args.get("level")
                category = request.args.get("category")
                origin = request.args.get("origin")
                limit = int(request.args.get("limit", 50))
                offset = int(request.args.get("offset", 0))
                
                # Build query - only active, public quizzes
                query = {"is_active": True, "is_public": True}
                
                if jlpt_level and jlpt_level in JLPT_LEVELS:
                    query["jlpt_level"] = jlpt_level
                if category:
                    query["category"] = category
                if origin and origin in QUIZ_ORIGINS:
                    query["origin"] = origin
                
                # Fetch quizzes (exclude questions for list view)
                projection = {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "origin": 1,
                    "jlpt_level": 1,
                    "category": 1,
                    "time_limit_seconds": 1,
                    "question_count": {"$size": "$questions"},
                    "created_at": 1,
                }
                
                cursor = quizzes_collection.find(query).skip(offset).limit(limit)
                quizzes = []
                
                for quiz in cursor:
                    quizzes.append({
                        "id": str(quiz["_id"]),
                        "title": quiz.get("title", "Untitled"),
                        "description": quiz.get("description", ""),
                        "origin": quiz.get("origin", "system"),
                        "jlpt_level": quiz.get("jlpt_level", "mixed"),
                        "category": quiz.get("category", "mixed"),
                        "time_limit_seconds": quiz.get("time_limit_seconds"),
                        "question_count": len(quiz.get("questions", [])),
                        "created_at": quiz.get("created_at", datetime.utcnow()).isoformat(),
                    })
                
                total = quizzes_collection.count_documents(query)
                
                return jsonify({
                    "quizzes": quizzes,
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                }), 200
                
            except Exception as e:
                self.logger.error(f"Error listing quizzes: {e}")
                return jsonify({"error": "Failed to fetch quizzes"}), 500
        
        # ----------------------------------------------------------------
        # GET /v1/quizzes/<quiz_id> - Get quiz for taking
        # ----------------------------------------------------------------
        @app.route("/v1/quizzes/<quiz_id>", methods=["GET"])
        def get_quiz(quiz_id):
            try:
                quiz = quizzes_collection.find_one({
                    "_id": ObjectId(quiz_id),
                    "is_active": True,
                })
                
                if not quiz:
                    return jsonify({"error": "Quiz not found"}), 404
                
                # For public quizzes or when taking the quiz, hide correct answers
                include_answers = request.args.get("include_answers") == "true"
                
                questions = []
                for q in quiz.get("questions", []):
                    question_data = {
                        "question_id": q.get("question_id"),
                        "question_type": q.get("question_type"),
                        "content": {
                            "prompt": q.get("content", {}).get("prompt", ""),
                            "passage": q.get("content", {}).get("passage"),
                            "options": q.get("content", {}).get("options"),
                        },
                        "points": q.get("points", 1),
                    }
                    
                    # Only include correct answer if explicitly requested (for review)
                    if include_answers:
                        question_data["content"]["correct_answer"] = q.get("content", {}).get("correct_answer")
                    
                    questions.append(question_data)
                
                return jsonify({
                    "id": str(quiz["_id"]),
                    "title": quiz.get("title", "Untitled"),
                    "description": quiz.get("description", ""),
                    "origin": quiz.get("origin", "system"),
                    "jlpt_level": quiz.get("jlpt_level", "mixed"),
                    "category": quiz.get("category", "mixed"),
                    "time_limit_seconds": quiz.get("time_limit_seconds"),
                    "questions": questions,
                }), 200
                
            except Exception as e:
                self.logger.error(f"Error fetching quiz: {e}")
                return jsonify({"error": "Failed to fetch quiz"}), 500
        
        # ----------------------------------------------------------------
        # POST /v1/quizzes/<quiz_id>/submit - Submit quiz attempt
        # ----------------------------------------------------------------
        @app.route("/v1/quizzes/<quiz_id>/submit", methods=["POST"])
        def submit_quiz(quiz_id):
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                
                user_id = data.get("user_id")  # Optional for guests
                answers = data.get("answers", {})  # Dict: question_id -> answer
                started_at = data.get("started_at")
                
                # Fetch the quiz
                quiz = quizzes_collection.find_one({
                    "_id": ObjectId(quiz_id),
                    "is_active": True,
                })
                
                if not quiz:
                    return jsonify({"error": "Quiz not found"}), 404
                
                # Score the submission
                scoring_result = score_submission(quiz, answers)
                
                # Calculate time spent
                completed_at = datetime.utcnow()
                time_spent = 0
                if started_at:
                    try:
                        start_time = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                        time_spent = int((completed_at - start_time).total_seconds())
                    except:
                        pass
                
                # Create attempt record
                attempt = {
                    "user_id": user_id,  # Can be None for guests
                    "quiz_id": ObjectId(quiz_id),
                    "quiz_origin": quiz.get("origin", "system"),
                    "started_at": started_at,
                    "completed_at": completed_at,
                    "time_spent_seconds": time_spent,
                    "total_score": scoring_result["total_score"],
                    "max_score": scoring_result["max_score"],
                    "percentage": scoring_result["percentage"],
                    "answers": scoring_result["answers"],
                    "weak_items": scoring_result["weak_items"],
                    "ai_feedback_requested": False,
                    "ai_feedback_id": None,
                }
                
                # Only save attempt if user is logged in
                attempt_id = None
                if user_id:
                    result = attempts_collection.insert_one(attempt)
                    attempt_id = str(result.inserted_id)
                    
                    # Phase 4: Trigger SRS updates for weak items
                    self._update_srs_from_quiz(user_id, scoring_result["weak_items"], quiz.get("origin", "system"))
                    
                    # Log activity to learner progress system
                    self._log_quiz_to_learner_progress(
                        user_id=user_id,
                        score=scoring_result["percentage"],
                        level=quiz.get("jlpt_level", "mixed"),
                        category=quiz.get("category", "mixed"),
                        duration_minutes=round(time_spent / 60, 1) if time_spent else None
                    )
                    
                    # Phase 5: AI feedback is optional and can be requested separately
                
                return jsonify({
                    "attempt_id": attempt_id,
                    "total_score": scoring_result["total_score"],
                    "max_score": scoring_result["max_score"],
                    "percentage": scoring_result["percentage"],
                    "answers": scoring_result["answers"],
                    "weak_items": scoring_result["weak_items"],
                    "message": "Quiz submitted successfully" if user_id else "Quiz completed (not saved - guest mode)",
                }), 200
                
            except Exception as e:
                self.logger.error(f"Error submitting quiz: {e}")
                return jsonify({"error": "Failed to submit quiz"}), 500
        
        # ----------------------------------------------------------------
        # GET /v1/quiz-attempts - User's attempt history
        # ----------------------------------------------------------------
        @app.route("/v1/quiz-attempts", methods=["GET"])
        def list_attempts():
            try:
                user_id = request.args.get("user_id")
                
                if not user_id:
                    return jsonify({"error": "user_id is required"}), 400
                
                limit = int(request.args.get("limit", 20))
                offset = int(request.args.get("offset", 0))
                
                cursor = attempts_collection.find(
                    {"user_id": user_id}
                ).sort("completed_at", -1).skip(offset).limit(limit)
                
                attempts = []
                for attempt in cursor:
                    # Get quiz title
                    quiz = quizzes_collection.find_one({"_id": attempt.get("quiz_id")})
                    quiz_title = quiz.get("title", "Unknown") if quiz else "Unknown"
                    
                    attempts.append({
                        "id": str(attempt["_id"]),
                        "quiz_id": str(attempt.get("quiz_id")),
                        "quiz_title": quiz_title,
                        "quiz_origin": attempt.get("quiz_origin"),
                        "completed_at": attempt.get("completed_at").isoformat() if attempt.get("completed_at") else None,
                        "total_score": attempt.get("total_score"),
                        "max_score": attempt.get("max_score"),
                        "percentage": attempt.get("percentage"),
                        "time_spent_seconds": attempt.get("time_spent_seconds"),
                    })
                
                total = attempts_collection.count_documents({"user_id": user_id})
                
                return jsonify({
                    "attempts": attempts,
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                }), 200
                
            except Exception as e:
                self.logger.error(f"Error listing attempts: {e}")
                return jsonify({"error": "Failed to fetch attempts"}), 500
        
        # ----------------------------------------------------------------
        # GET /v1/quiz-attempts/<attempt_id> - Specific attempt details
        # ----------------------------------------------------------------
        @app.route("/v1/quiz-attempts/<attempt_id>", methods=["GET"])
        def get_attempt(attempt_id):
            try:
                attempt = attempts_collection.find_one({"_id": ObjectId(attempt_id)})
                
                if not attempt:
                    return jsonify({"error": "Attempt not found"}), 404
                
                # Get quiz details
                quiz = quizzes_collection.find_one({"_id": attempt.get("quiz_id")})
                
                return jsonify({
                    "id": str(attempt["_id"]),
                    "quiz_id": str(attempt.get("quiz_id")),
                    "quiz_title": quiz.get("title", "Unknown") if quiz else "Unknown",
                    "quiz_origin": attempt.get("quiz_origin"),
                    "completed_at": attempt.get("completed_at").isoformat() if attempt.get("completed_at") else None,
                    "total_score": attempt.get("total_score"),
                    "max_score": attempt.get("max_score"),
                    "percentage": attempt.get("percentage"),
                    "time_spent_seconds": attempt.get("time_spent_seconds"),
                    "answers": attempt.get("answers", []),
                    "weak_items": attempt.get("weak_items", []),
                }), 200
                
            except Exception as e:
                self.logger.error(f"Error fetching attempt: {e}")
                return jsonify({"error": "Failed to fetch attempt"}), 500
        
        # ----------------------------------------------------------------
        # POST /v1/quizzes - Create custom quiz (authenticated)
        # ----------------------------------------------------------------
        @app.route("/v1/quizzes", methods=["POST"])
        def create_quiz():
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                
                author_id = data.get("author_id")
                if not author_id:
                    return jsonify({"error": "author_id is required"}), 400
                
                title = data.get("title", "Untitled Quiz")
                description = data.get("description", "")
                origin = data.get("origin", "manual")
                jlpt_level = data.get("jlpt_level", "mixed")
                category = data.get("category", "mixed")
                time_limit = data.get("time_limit_seconds")
                is_public = data.get("is_public", False)
                questions = data.get("questions", [])
                
                # Validate origin
                if origin not in QUIZ_ORIGINS:
                    return jsonify({"error": f"Invalid origin. Must be one of: {QUIZ_ORIGINS}"}), 400
                
                # Process questions and add IDs
                processed_questions = []
                for q in questions:
                    question = {
                        "question_id": q.get("question_id", str(uuid.uuid4())),
                        "question_type": q.get("question_type", "vocab_reading"),
                        "content": q.get("content", {}),
                        "linked_flashcard_ids": q.get("linked_flashcard_ids", []),
                        "learning_points": q.get("learning_points", []),
                        "points": q.get("points", 1),
                    }
                    processed_questions.append(question)
                
                # Create quiz document
                quiz = {
                    "title": title,
                    "description": description,
                    "origin": origin,
                    "author_id": author_id,
                    "session_id": data.get("session_id"),
                    "jlpt_level": jlpt_level,
                    "category": category,
                    "time_limit_seconds": time_limit,
                    "questions": processed_questions,
                    "is_public": is_public,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "expires_at": data.get("expires_at"),
                }
                
                result = quizzes_collection.insert_one(quiz)
                
                return jsonify({
                    "id": str(result.inserted_id),
                    "message": "Quiz created successfully",
                }), 201
                
            except Exception as e:
                self.logger.error(f"Error creating quiz: {e}")
                return jsonify({"error": "Failed to create quiz"}), 500
        
        # ----------------------------------------------------------------
        # Seed Sample Quizzes (run once on startup)
        # ----------------------------------------------------------------
        def seed_sample_quizzes():
            """Seed sample quizzes if none exist."""
            if quizzes_collection.count_documents({}) > 0:
                self.logger.info("Sample quizzes already exist, skipping seed.")
                return
            
            self.logger.info("Seeding sample quizzes...")
            
            sample_quizzes = [
                {
                    "title": "JLPT N5 Vocabulary Quiz",
                    "description": "Basic vocabulary practice for N5 learners.",
                    "origin": "system",
                    "jlpt_level": "N5",
                    "category": "vocabulary",
                    "time_limit_seconds": 300,
                    "is_public": True,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "questions": [
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "vocab_reading",
                            "content": {
                                "prompt": "What is the reading of 食べる?",
                                "options": ["たべる", "のべる", "あべる", "さべる"],
                                "correct_answer": "たべる",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["食べる", "verb-to-eat"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "vocab_reading",
                            "content": {
                                "prompt": "What is the reading of 飲む?",
                                "options": ["のむ", "とむ", "やむ", "かむ"],
                                "correct_answer": "のむ",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["飲む", "verb-to-drink"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "vocab_meaning",
                            "content": {
                                "prompt": "What does 大きい mean?",
                                "options": ["small", "big", "fast", "slow"],
                                "correct_answer": "big",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["大きい", "adjective-big"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                    ],
                },
                {
                    "title": "JLPT N4 Grammar Quiz",
                    "description": "Grammar patterns for N4 level.",
                    "origin": "system",
                    "jlpt_level": "N4",
                    "category": "grammar",
                    "time_limit_seconds": 600,
                    "is_public": True,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "questions": [
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "grammar_fill_blank",
                            "content": {
                                "prompt": "日本語を勉強し___います。",
                                "options": ["て", "た", "で", "に"],
                                "correct_answer": "て",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["ています", "progressive-form"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "grammar_fill_blank",
                            "content": {
                                "prompt": "映画を見___前に、本を読みました。",
                                "options": ["る", "た", "て", "の"],
                                "correct_answer": "る",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["前に", "before-doing"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                    ],
                },
                {
                    "title": "JLPT N3 Kanji Quiz",
                    "description": "Intermediate kanji readings.",
                    "origin": "system",
                    "jlpt_level": "N3",
                    "category": "kanji",
                    "time_limit_seconds": 480,
                    "is_public": True,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "questions": [
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "kanji_reading",
                            "content": {
                                "prompt": "What is the reading of 経験?",
                                "options": ["けいけん", "けいげん", "きょうけん", "きょうげん"],
                                "correct_answer": "けいけん",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["経験", "experience"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                        {
                            "question_id": str(uuid.uuid4()),
                            "question_type": "kanji_meaning",
                            "content": {
                                "prompt": "What does 環境 mean?",
                                "options": ["environment", "economy", "education", "entertainment"],
                                "correct_answer": "environment",
                                "scoring_rule": "binary",
                            },
                            "learning_points": ["環境", "environment"],
                            "linked_flashcard_ids": [],
                            "points": 1,
                        },
                    ],
                },
            ]
            
            quizzes_collection.insert_many(sample_quizzes)
            self.logger.info(f"Seeded {len(sample_quizzes)} sample quizzes.")
        
        # Seed on registration
        seed_sample_quizzes()
        
        self.logger.info("Quiz module routes registered successfully.")
