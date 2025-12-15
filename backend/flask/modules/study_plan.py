"""
Study Plan Module

This module implements personalized JLPT study planning with:
- Public plan templates (accessible without login)
- Personalized study plans (requires authentication)
- Milestone-based progress tracking
- Daily task generation
- Progress calculation and adaptive adjustments

API Prefix: /f-api/v1/study-plan/
"""

import logging
from flask import request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# ============================================
# Constants & Reference Data
# ============================================

JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"]

PLAN_STATUSES = ["active", "paused", "completed", "abandoned"]

MILESTONE_STATUSES = ["pending", "in_progress", "completed", "overdue"]

TASK_STATUSES = ["pending", "completed", "skipped"]

TASK_TYPES = ["flashcard", "quiz", "reading", "grammar_lesson", "assessment"]

# JLPT Level Requirements (vocabulary, kanji, grammar points)
JLPT_REQUIREMENTS = {
    "N5": {"vocabulary": 800, "kanji": 100, "grammar_points": 80},
    "N4": {"vocabulary": 1500, "kanji": 300, "grammar_points": 165},
    "N3": {"vocabulary": 3000, "kanji": 600, "grammar_points": 200},
    "N2": {"vocabulary": 6000, "kanji": 1000, "grammar_points": 200},
    "N1": {"vocabulary": 10000, "kanji": 2000, "grammar_points": 250},
}

# Default study time options (minutes)
STUDY_TIME_OPTIONS = [15, 30, 60, 90, 120]

# Default milestone templates per duration
TEMPLATE_DURATIONS = {
    "3_month": 12,   # weeks
    "6_month": 24,
    "1_year": 52,
}

# ============================================
# Plan Template Data (Seeded at startup)
# ============================================

def get_n5_milestones_12_weeks() -> List[Dict]:
    """N5 3-Month Intensive Plan Milestones"""
    return [
        {
            "week_start": 1,
            "week_end": 2,
            "title": "Foundation: Hiragana & Katakana",
            "category": "mixed",
            "criteria": [
                {"type": "kanji_count", "target_value": 0, "unit": "characters"},
                {"type": "vocab_count", "target_value": 100, "unit": "words"},
            ],
        },
        {
            "week_start": 3,
            "week_end": 4,
            "title": "Basic Vocabulary & Numbers",
            "category": "vocabulary",
            "criteria": [
                {"type": "vocab_count", "target_value": 200, "unit": "words"},
            ],
        },
        {
            "week_start": 5,
            "week_end": 6,
            "title": "Core Grammar Patterns",
            "category": "grammar",
            "criteria": [
                {"type": "grammar_points", "target_value": 30, "unit": "patterns"},
            ],
        },
        {
            "week_start": 7,
            "week_end": 8,
            "title": "N5 Kanji Part 1",
            "category": "kanji",
            "criteria": [
                {"type": "kanji_count", "target_value": 50, "unit": "characters"},
            ],
        },
        {
            "week_start": 9,
            "week_end": 10,
            "title": "N5 Kanji Part 2 & Vocabulary",
            "category": "mixed",
            "criteria": [
                {"type": "kanji_count", "target_value": 100, "unit": "characters"},
                {"type": "vocab_count", "target_value": 600, "unit": "words"},
            ],
        },
        {
            "week_start": 11,
            "week_end": 12,
            "title": "Final Review & Mock Exam",
            "category": "mixed",
            "criteria": [
                {"type": "quiz_score", "target_value": 70, "unit": "%"},
                {"type": "vocab_count", "target_value": 800, "unit": "words"},
            ],
        },
    ]


def get_n4_milestones_24_weeks() -> List[Dict]:
    """N4 6-Month Standard Plan Milestones"""
    return [
        {
            "week_start": 1,
            "week_end": 4,
            "title": "N5 Review & Foundation",
            "category": "mixed",
            "criteria": [
                {"type": "vocab_count", "target_value": 200, "unit": "words"},
                {"type": "quiz_score", "target_value": 60, "unit": "%"},
            ],
        },
        {
            "week_start": 5,
            "week_end": 8,
            "title": "N4 Vocabulary Core",
            "category": "vocabulary",
            "criteria": [
                {"type": "vocab_count", "target_value": 600, "unit": "words"},
            ],
        },
        {
            "week_start": 9,
            "week_end": 12,
            "title": "N4 Grammar Patterns",
            "category": "grammar",
            "criteria": [
                {"type": "grammar_points", "target_value": 80, "unit": "patterns"},
            ],
        },
        {
            "week_start": 13,
            "week_end": 16,
            "title": "N4 Kanji Mastery",
            "category": "kanji",
            "criteria": [
                {"type": "kanji_count", "target_value": 300, "unit": "characters"},
            ],
        },
        {
            "week_start": 17,
            "week_end": 20,
            "title": "Reading & Listening Practice",
            "category": "mixed",
            "criteria": [
                {"type": "vocab_count", "target_value": 1200, "unit": "words"},
            ],
        },
        {
            "week_start": 21,
            "week_end": 24,
            "title": "Final Review & Mock Exams",
            "category": "mixed",
            "criteria": [
                {"type": "quiz_score", "target_value": 70, "unit": "%"},
                {"type": "vocab_count", "target_value": 1500, "unit": "words"},
            ],
        },
    ]


def get_n3_milestones_52_weeks() -> List[Dict]:
    """N3 1-Year Comprehensive Plan Milestones"""
    return [
        {
            "week_start": 1,
            "week_end": 8,
            "title": "N4 Review & Solidification",
            "category": "mixed",
            "criteria": [
                {"type": "vocab_count", "target_value": 500, "unit": "words"},
                {"type": "quiz_score", "target_value": 70, "unit": "%"},
            ],
        },
        {
            "week_start": 9,
            "week_end": 16,
            "title": "N3 Vocabulary Building",
            "category": "vocabulary",
            "criteria": [
                {"type": "vocab_count", "target_value": 1500, "unit": "words"},
            ],
        },
        {
            "week_start": 17,
            "week_end": 24,
            "title": "N3 Grammar Mastery",
            "category": "grammar",
            "criteria": [
                {"type": "grammar_points", "target_value": 150, "unit": "patterns"},
            ],
        },
        {
            "week_start": 25,
            "week_end": 32,
            "title": "N3 Kanji Deep Dive",
            "category": "kanji",
            "criteria": [
                {"type": "kanji_count", "target_value": 600, "unit": "characters"},
            ],
        },
        {
            "week_start": 33,
            "week_end": 40,
            "title": "Reading Comprehension",
            "category": "reading",
            "criteria": [
                {"type": "vocab_count", "target_value": 2500, "unit": "words"},
            ],
        },
        {
            "week_start": 41,
            "week_end": 48,
            "title": "Listening & Speaking",
            "category": "listening",
            "criteria": [
                {"type": "vocab_count", "target_value": 2800, "unit": "words"},
            ],
        },
        {
            "week_start": 49,
            "week_end": 52,
            "title": "Final Review & Mock Exams",
            "category": "mixed",
            "criteria": [
                {"type": "quiz_score", "target_value": 70, "unit": "%"},
                {"type": "vocab_count", "target_value": 3000, "unit": "words"},
                {"type": "kanji_count", "target_value": 600, "unit": "characters"},
            ],
        },
    ]


# ============================================
# Study Plan Module Class
# ============================================

class StudyPlanModule:
    """
    Handles JLPT study plan creation, management, and progress tracking.
    """

    def __init__(self):
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
        )
        self.logger = logging.getLogger(__name__)

        # MongoDB connections
        self.mongo_client = MongoClient("mongodb://localhost:27017/")
        self.study_db = self.mongo_client["flaskStudyPlanDB"]

        # Collections
        self.plans_collection = self.study_db["study_plans"]
        self.milestones_collection = self.study_db["milestones"]
        self.tasks_collection = self.study_db["daily_tasks"]
        self.templates_collection = self.study_db["plan_templates"]

        # Initialize indexes
        self._create_indexes()

        # Seed templates if not exists
        self._seed_templates()

    def _create_indexes(self):
        """Create MongoDB indexes for efficient queries."""
        try:
            # Study plans indexes
            self.plans_collection.create_index([("user_id", 1), ("status", 1)])
            self.plans_collection.create_index([("target_level", 1)])

            # Milestones indexes
            self.milestones_collection.create_index([("plan_id", 1), ("milestone_number", 1)])
            self.milestones_collection.create_index([("status", 1)])

            # Daily tasks indexes
            self.tasks_collection.create_index([("user_id", 1), ("date", 1)])
            self.tasks_collection.create_index([("plan_id", 1), ("milestone_id", 1)])

            # Templates indexes
            self.templates_collection.create_index([("target_level", 1), ("duration_weeks", 1)])
            self.templates_collection.create_index([("is_public", 1)])

            self.logger.info("Study plan indexes created successfully")
        except Exception as e:
            self.logger.error(f"Error creating indexes: {e}")

    def _seed_templates(self):
        """Seed plan templates if they don't exist."""
        try:
            # Check if templates already exist
            if self.templates_collection.count_documents({}) > 0:
                self.logger.info("Templates already seeded")
                return

            templates = [
                # N5 Templates
                {
                    "target_level": "N5",
                    "duration_weeks": 12,
                    "title": "3-Month N5 Intensive",
                    "description": "Fast-track your N5 preparation with focused daily practice. Ideal for dedicated learners with 1-2 hours per day.",
                    "milestones": get_n5_milestones_12_weeks(),
                    "daily_minutes_recommended": 60,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                {
                    "target_level": "N5",
                    "duration_weeks": 24,
                    "title": "6-Month N5 Relaxed",
                    "description": "A comfortable pace for N5 preparation. Perfect for busy schedules with 30-45 minutes per day.",
                    "milestones": get_n5_milestones_12_weeks(),  # Will be scaled
                    "daily_minutes_recommended": 30,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                # N4 Templates
                {
                    "target_level": "N4",
                    "duration_weeks": 24,
                    "title": "6-Month N4 Standard",
                    "description": "Build on your N5 foundation with comprehensive N4 coverage.",
                    "milestones": get_n4_milestones_24_weeks(),
                    "daily_minutes_recommended": 45,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                {
                    "target_level": "N4",
                    "duration_weeks": 36,
                    "title": "9-Month N4 Comprehensive",
                    "description": "Thorough N4 preparation with extra review time.",
                    "milestones": get_n4_milestones_24_weeks(),  # Will be scaled
                    "daily_minutes_recommended": 30,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                # N3 Templates
                {
                    "target_level": "N3",
                    "duration_weeks": 52,
                    "title": "1-Year N3 Master Plan",
                    "description": "Comprehensive N3 preparation covering all JLPT sections.",
                    "milestones": get_n3_milestones_52_weeks(),
                    "daily_minutes_recommended": 45,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                {
                    "target_level": "N3",
                    "duration_weeks": 36,
                    "title": "9-Month N3 Intensive",
                    "description": "Accelerated N3 preparation for motivated learners.",
                    "milestones": get_n3_milestones_52_weeks(),  # Will be scaled
                    "daily_minutes_recommended": 60,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                # N2 Templates (Simplified for now)
                {
                    "target_level": "N2",
                    "duration_weeks": 52,
                    "title": "1-Year N2 Preparation",
                    "description": "Advanced Japanese mastery for N2 certification.",
                    "milestones": [
                        {"week_start": 1, "week_end": 13, "title": "Advanced Vocabulary", "category": "vocabulary", "criteria": [{"type": "vocab_count", "target_value": 2000, "unit": "words"}]},
                        {"week_start": 14, "week_end": 26, "title": "Complex Grammar", "category": "grammar", "criteria": [{"type": "grammar_points", "target_value": 100, "unit": "patterns"}]},
                        {"week_start": 27, "week_end": 39, "title": "Kanji Expansion", "category": "kanji", "criteria": [{"type": "kanji_count", "target_value": 1000, "unit": "characters"}]},
                        {"week_start": 40, "week_end": 52, "title": "Full Review & Mock Exams", "category": "mixed", "criteria": [{"type": "quiz_score", "target_value": 70, "unit": "%"}]},
                    ],
                    "daily_minutes_recommended": 60,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
                # N1 Templates
                {
                    "target_level": "N1",
                    "duration_weeks": 52,
                    "title": "1-Year N1 Expert",
                    "description": "Ultimate Japanese proficiency for N1 certification.",
                    "milestones": [
                        {"week_start": 1, "week_end": 13, "title": "Expert Vocabulary", "category": "vocabulary", "criteria": [{"type": "vocab_count", "target_value": 3000, "unit": "words"}]},
                        {"week_start": 14, "week_end": 26, "title": "Nuanced Grammar", "category": "grammar", "criteria": [{"type": "grammar_points", "target_value": 125, "unit": "patterns"}]},
                        {"week_start": 27, "week_end": 39, "title": "Full Kanji Mastery", "category": "kanji", "criteria": [{"type": "kanji_count", "target_value": 2000, "unit": "characters"}]},
                        {"week_start": 40, "week_end": 52, "title": "Exam Preparation", "category": "mixed", "criteria": [{"type": "quiz_score", "target_value": 70, "unit": "%"}]},
                    ],
                    "daily_minutes_recommended": 90,
                    "is_public": True,
                    "created_at": datetime.utcnow(),
                },
            ]

            self.templates_collection.insert_many(templates)
            self.logger.info(f"Seeded {len(templates)} plan templates")

        except Exception as e:
            self.logger.error(f"Error seeding templates: {e}")

    # ============================================
    # Plan Generation Logic
    # ============================================

    def select_template(self, target_level: str, total_days: int) -> Optional[Dict]:
        """
        Select the best matching template for given level and duration.
        """
        total_weeks = total_days // 7

        # Find templates for the level, sorted by closest duration
        templates = list(self.templates_collection.find(
            {"target_level": target_level, "is_public": True}
        ).sort("duration_weeks", 1))

        if not templates:
            return None

        # Find closest match
        best_match = templates[0]
        min_diff = abs(templates[0]["duration_weeks"] - total_weeks)

        for template in templates:
            diff = abs(template["duration_weeks"] - total_weeks)
            if diff < min_diff:
                min_diff = diff
                best_match = template

        return best_match

    def scale_milestone(self, template_milestone: Dict, template_weeks: int, actual_weeks: int) -> Dict:
        """
        Scale a milestone's timeline to fit the actual plan duration.
        """
        scale_factor = actual_weeks / template_weeks

        return {
            "week_start": max(1, round(template_milestone["week_start"] * scale_factor)),
            "week_end": max(1, round(template_milestone["week_end"] * scale_factor)),
            "title": template_milestone["title"],
            "category": template_milestone["category"],
            "criteria": template_milestone["criteria"],
        }

    def generate_plan(self, user_id: str, target_level: str, exam_date: datetime, settings: Dict) -> Dict:
        """
        Generate a personalized study plan.

        Args:
            user_id: User identifier
            target_level: N5, N4, N3, N2, or N1
            exam_date: Target exam date
            settings: User preferences (daily_minutes, study_days, focus_areas)

        Returns:
            Created plan document
        """
        today = datetime.utcnow()
        total_days = (exam_date - today).days

        if total_days <= 0:
            raise ValueError("Exam date must be in the future")

        # Select template
        template = self.select_template(target_level, total_days)
        if not template:
            raise ValueError(f"No template found for level {target_level}")

        total_weeks = total_days // 7
        template_weeks = template["duration_weeks"]

        # Create plan document
        plan = {
            "user_id": user_id,
            "target_level": target_level,
            "exam_date": exam_date,
            "created_at": today,
            "updated_at": today,
            "status": "active",
            "start_date": today,
            "total_days": total_days,
            "days_remaining": total_days,
            "current_milestone_id": None,
            "overall_progress_percent": 0,
            "daily_study_minutes": settings.get("daily_study_minutes", 30),
            "study_days_per_week": settings.get("study_days_per_week", 5),
            "preferred_focus": settings.get("preferred_focus", ["vocabulary", "grammar"]),
            "template_id": template["_id"],
        }

        # Insert plan
        result = self.plans_collection.insert_one(plan)
        plan_id = result.inserted_id
        plan["_id"] = plan_id

        # Generate milestones
        milestones = []
        for idx, template_milestone in enumerate(template["milestones"]):
            scaled = self.scale_milestone(template_milestone, template_weeks, total_weeks)

            # Calculate actual dates
            start_offset = (scaled["week_start"] - 1) * 7
            end_offset = scaled["week_end"] * 7 - 1

            milestone = {
                "plan_id": plan_id,
                "milestone_number": idx + 1,
                "title": scaled["title"],
                "description": f"Complete {scaled['title']} by week {scaled['week_end']}",
                "category": scaled["category"],
                "target_start_date": today + timedelta(days=start_offset),
                "target_end_date": today + timedelta(days=end_offset),
                "actual_start_date": None,
                "actual_end_date": None,
                "criteria": [
                    {**c, "current_value": 0} for c in scaled["criteria"]
                ],
                "status": "pending",
                "progress_percent": 0,
                "linked_quiz_ids": [],
                "linked_flashcard_decks": [],
            }

            milestones.append(milestone)

        if milestones:
            self.milestones_collection.insert_many(milestones)

            # Set first milestone as current
            first_milestone = self.milestones_collection.find_one({"plan_id": plan_id, "milestone_number": 1})
            if first_milestone:
                self.plans_collection.update_one(
                    {"_id": plan_id},
                    {"$set": {"current_milestone_id": first_milestone["_id"]}}
                )

        self.logger.info(f"Created plan {plan_id} with {len(milestones)} milestones for user {user_id}")

        return plan

    # ============================================
    # Progress Calculation
    # ============================================

    def calculate_milestone_progress(self, milestone: Dict) -> float:
        """Calculate progress percentage for a milestone based on criteria."""
        criteria = milestone.get("criteria", [])
        if not criteria:
            return 0

        scores = []
        for criterion in criteria:
            target = criterion.get("target_value", 0)
            current = criterion.get("current_value", 0)

            if target > 0:
                progress = (current / target) * 100
                scores.append(min(progress, 100))

        return sum(scores) / len(scores) if scores else 0

    def calculate_plan_progress(self, plan_id: ObjectId) -> float:
        """Calculate overall plan progress based on milestones."""
        milestones = list(self.milestones_collection.find({"plan_id": plan_id}))
        if not milestones:
            return 0

        total_progress = sum(self.calculate_milestone_progress(m) for m in milestones)
        return total_progress / len(milestones)

    # ============================================
    # Daily Task Generation
    # ============================================

    def generate_daily_tasks(self, plan_id: ObjectId, date: datetime) -> List[Dict]:
        """
        Generate tasks for a specific date.

        Balances:
        - Milestone requirements
        - User's daily time budget
        - SRS due cards (placeholder for integration)
        """
        plan = self.plans_collection.find_one({"_id": plan_id})
        if not plan:
            return []

        # Get current milestone
        current_milestone_id = plan.get("current_milestone_id")
        milestone = None
        if current_milestone_id:
            milestone = self.milestones_collection.find_one({"_id": current_milestone_id})

        tasks = []
        remaining_minutes = plan.get("daily_study_minutes", 30)

        # Task 1: SRS Review (placeholder - will integrate with flashcard system)
        srs_task = {
            "plan_id": plan_id,
            "milestone_id": current_milestone_id,
            "user_id": plan["user_id"],
            "date": date,
            "task_type": "flashcard",
            "title": "Review Due Cards",
            "description": "Complete your daily SRS flashcard review",
            "content_ref": {"type": "flashcard_deck", "id": None},
            "estimated_minutes": min(15, remaining_minutes),
            "status": "pending",
            "completed_at": None,
            "score": None,
        }
        tasks.append(srs_task)
        remaining_minutes -= srs_task["estimated_minutes"]

        # Task 2: Milestone-specific task
        if milestone and remaining_minutes > 0:
            category = milestone.get("category", "mixed")

            if category == "vocabulary" or category == "mixed":
                tasks.append({
                    "plan_id": plan_id,
                    "milestone_id": current_milestone_id,
                    "user_id": plan["user_id"],
                    "date": date,
                    "task_type": "flashcard",
                    "title": "Learn New Vocabulary",
                    "description": f"Learn new words for {plan['target_level']}",
                    "content_ref": {"type": "flashcard_deck", "id": f"{plan['target_level']}_vocab"},
                    "estimated_minutes": min(20, remaining_minutes),
                    "status": "pending",
                    "completed_at": None,
                    "score": None,
                })
                remaining_minutes -= 20

            if category == "grammar" or category == "mixed":
                if remaining_minutes > 0:
                    tasks.append({
                        "plan_id": plan_id,
                        "milestone_id": current_milestone_id,
                        "user_id": plan["user_id"],
                        "date": date,
                        "task_type": "grammar_lesson",
                        "title": "Study Grammar Point",
                        "description": f"Learn a new grammar pattern for {plan['target_level']}",
                        "content_ref": {"type": "grammar_point", "id": None},
                        "estimated_minutes": min(15, remaining_minutes),
                        "status": "pending",
                        "completed_at": None,
                        "score": None,
                    })
                    remaining_minutes -= 15

            if category == "kanji":
                tasks.append({
                    "plan_id": plan_id,
                    "milestone_id": current_milestone_id,
                    "user_id": plan["user_id"],
                    "date": date,
                    "task_type": "flashcard",
                    "title": "Kanji Practice",
                    "description": f"Study kanji for {plan['target_level']}",
                    "content_ref": {"type": "flashcard_deck", "id": f"{plan['target_level']}_kanji"},
                    "estimated_minutes": min(20, remaining_minutes),
                    "status": "pending",
                    "completed_at": None,
                    "score": None,
                })

        return tasks

    # ============================================
    # Adaptive Plan Adjustments (Phase 8)
    # ============================================

    def check_plan_health(self, plan_id: ObjectId) -> Dict:
        """
        Analyze plan health and identify issues.
        
        Returns:
            health_status: "on_track", "slightly_behind", "significantly_behind", "ahead"
            issues: List of identified problems
            recommendations: List of suggested actions
        """
        plan = self.plans_collection.find_one({"_id": plan_id})
        if not plan:
            return {"error": "Plan not found"}

        milestones = list(self.milestones_collection.find(
            {"plan_id": plan_id}
        ).sort("milestone_number", 1))

        if not milestones:
            return {"health_status": "unknown", "issues": ["No milestones found"]}

        today = datetime.utcnow()
        issues = []
        recommendations = []

        # Check for overdue milestones
        overdue_count = 0
        for m in milestones:
            if m["status"] != "completed" and m["target_end_date"] < today:
                overdue_count += 1
                issues.append({
                    "type": "overdue_milestone",
                    "milestone_id": str(m["_id"]),
                    "title": m["title"],
                    "days_overdue": (today - m["target_end_date"]).days,
                })

        # Calculate expected vs actual progress
        total_days = plan.get("total_days", 1)
        elapsed_days = (today - plan["start_date"]).days
        expected_progress = min(100, (elapsed_days / total_days) * 100)
        actual_progress = self.calculate_plan_progress(plan_id)
        progress_gap = expected_progress - actual_progress

        # Determine health status
        if progress_gap < -10:
            health_status = "ahead"
            recommendations.append({
                "type": "maintain_pace",
                "message": "Great progress! You're ahead of schedule.",
            })
        elif progress_gap < 10:
            health_status = "on_track"
            recommendations.append({
                "type": "keep_going",
                "message": "You're on track! Keep up the good work.",
            })
        elif progress_gap < 25:
            health_status = "slightly_behind"
            recommendations.append({
                "type": "increase_effort",
                "message": f"You're about {int(progress_gap)}% behind. Consider adding 10-15 minutes daily.",
            })
            if overdue_count > 0:
                recommendations.append({
                    "type": "focus_overdue",
                    "message": f"Focus on completing {overdue_count} overdue milestone(s).",
                })
        else:
            health_status = "significantly_behind"
            recommendations.append({
                "type": "adjust_plan",
                "message": "Consider adjusting your exam date or increasing study time significantly.",
            })
            recommendations.append({
                "type": "prioritize",
                "message": "Focus on the most critical topics for the exam.",
            })

        return {
            "health_status": health_status,
            "expected_progress": round(expected_progress, 1),
            "actual_progress": round(actual_progress, 1),
            "progress_gap": round(progress_gap, 1),
            "overdue_milestones": overdue_count,
            "issues": issues,
            "recommendations": recommendations,
        }

    def recalculate_milestones(self, plan_id: ObjectId, new_exam_date: Optional[datetime] = None) -> Dict:
        """
        Recalculate milestone timelines based on current progress and remaining time.
        
        Called when:
        - User changes exam date
        - User is significantly behind/ahead
        
        Returns:
            success: bool
            adjustments: list of changes made
        """
        plan = self.plans_collection.find_one({"_id": plan_id})
        if not plan:
            return {"success": False, "error": "Plan not found"}

        today = datetime.utcnow()
        exam_date = new_exam_date or plan["exam_date"]
        remaining_days = (exam_date - today).days

        if remaining_days <= 0:
            return {"success": False, "error": "Exam date has passed"}

        # Get incomplete milestones
        milestones = list(self.milestones_collection.find({
            "plan_id": plan_id,
            "status": {"$ne": "completed"}
        }).sort("milestone_number", 1))

        if not milestones:
            return {"success": True, "message": "All milestones completed", "adjustments": []}

        # Redistribute remaining time across incomplete milestones
        adjustments = []
        remaining_weeks = remaining_days // 7
        weeks_per_milestone = max(1, remaining_weeks // len(milestones))
        
        current_start = today
        for idx, m in enumerate(milestones):
            is_last = idx == len(milestones) - 1
            
            if is_last:
                # Last milestone gets all remaining time
                new_end = exam_date - timedelta(days=7)  # End 1 week before exam
            else:
                new_end = current_start + timedelta(weeks=weeks_per_milestone)

            old_end = m["target_end_date"]
            
            self.milestones_collection.update_one(
                {"_id": m["_id"]},
                {"$set": {
                    "target_start_date": current_start,
                    "target_end_date": new_end,
                }}
            )
            
            adjustments.append({
                "milestone_id": str(m["_id"]),
                "title": m["title"],
                "old_end_date": old_end.isoformat(),
                "new_end_date": new_end.isoformat(),
            })
            
            current_start = new_end + timedelta(days=1)

        # Update plan if exam date changed
        if new_exam_date:
            new_total_days = (new_exam_date - plan["start_date"]).days
            self.plans_collection.update_one(
                {"_id": plan_id},
                {"$set": {
                    "exam_date": new_exam_date,
                    "total_days": new_total_days,
                    "updated_at": today,
                }}
            )

        return {
            "success": True,
            "adjustments": adjustments,
            "remaining_days": remaining_days,
        }

    def update_milestone_from_quiz(self, plan_id: ObjectId, quiz_result: Dict) -> Dict:
        """
        Update milestone progress based on quiz results.
        
        Args:
            plan_id: Study plan ID
            quiz_result: {
                "category": "vocabulary" | "grammar" | "kanji" | "mixed",
                "score": 0-100,
                "items_correct": number,
                "items_total": number,
            }
        
        Returns:
            Updated milestone info
        """
        plan = self.plans_collection.find_one({"_id": plan_id})
        if not plan:
            return {"error": "Plan not found"}

        current_milestone_id = plan.get("current_milestone_id")
        if not current_milestone_id:
            return {"error": "No current milestone"}

        milestone = self.milestones_collection.find_one({"_id": current_milestone_id})
        if not milestone:
            return {"error": "Milestone not found"}

        # Update criteria based on quiz category
        quiz_category = quiz_result.get("category", "mixed")
        score = quiz_result.get("score", 0)
        items_correct = quiz_result.get("items_correct", 0)

        criteria_updated = []
        for criterion in milestone["criteria"]:
            if criterion["type"] == "quiz_score" and score > criterion.get("current_value", 0):
                criterion["current_value"] = score
                criteria_updated.append("quiz_score")
            
            if quiz_category == "vocabulary" and criterion["type"] == "vocab_count":
                criterion["current_value"] = criterion.get("current_value", 0) + items_correct
                criteria_updated.append("vocab_count")
            
            if quiz_category == "grammar" and criterion["type"] == "grammar_points":
                criterion["current_value"] = criterion.get("current_value", 0) + items_correct
                criteria_updated.append("grammar_points")
            
            if quiz_category == "kanji" and criterion["type"] == "kanji_count":
                criterion["current_value"] = criterion.get("current_value", 0) + items_correct
                criteria_updated.append("kanji_count")

        # Recalculate progress
        new_progress = self.calculate_milestone_progress(milestone)

        # Update milestone
        self.milestones_collection.update_one(
            {"_id": current_milestone_id},
            {"$set": {
                "criteria": milestone["criteria"],
                "progress_percent": new_progress,
            }}
        )

        # Check if milestone is now complete
        if new_progress >= 100:
            self.milestones_collection.update_one(
                {"_id": current_milestone_id},
                {"$set": {
                    "status": "completed",
                    "actual_end_date": datetime.utcnow(),
                }}
            )
            
            # Advance to next milestone
            next_milestone = self.milestones_collection.find_one({
                "plan_id": plan_id,
                "milestone_number": milestone["milestone_number"] + 1
            })
            
            if next_milestone:
                self.plans_collection.update_one(
                    {"_id": plan_id},
                    {"$set": {
                        "current_milestone_id": next_milestone["_id"],
                        "updated_at": datetime.utcnow(),
                    }}
                )
                self.milestones_collection.update_one(
                    {"_id": next_milestone["_id"]},
                    {"$set": {
                        "status": "in_progress",
                        "actual_start_date": datetime.utcnow(),
                    }}
                )

        return {
            "milestone_id": str(current_milestone_id),
            "title": milestone["title"],
            "new_progress": round(new_progress, 1),
            "criteria_updated": criteria_updated,
            "completed": new_progress >= 100,
        }

    def update_milestone_from_srs(self, user_id: str, srs_stats: Dict) -> Optional[Dict]:
        """
        Update milestone progress based on SRS (flashcard) statistics.
        
        Args:
            user_id: User identifier
            srs_stats: {
                "category": "vocabulary" | "kanji",
                "cards_learned": number of cards with retention >= 80%,
                "total_reviewed": number of cards reviewed today,
            }
        """
        # Find active plan
        plan = self.plans_collection.find_one({
            "user_id": user_id,
            "status": "active"
        })
        
        if not plan:
            return None

        current_milestone_id = plan.get("current_milestone_id")
        if not current_milestone_id:
            return None

        milestone = self.milestones_collection.find_one({"_id": current_milestone_id})
        if not milestone:
            return None

        # Update criteria based on SRS category
        srs_category = srs_stats.get("category", "vocabulary")
        cards_learned = srs_stats.get("cards_learned", 0)

        criteria_type = "vocab_count" if srs_category == "vocabulary" else "kanji_count"
        
        for criterion in milestone["criteria"]:
            if criterion["type"] == criteria_type:
                current = criterion.get("current_value", 0)
                criterion["current_value"] = max(current, cards_learned)

        # Recalculate and update
        new_progress = self.calculate_milestone_progress(milestone)

        self.milestones_collection.update_one(
            {"_id": current_milestone_id},
            {"$set": {
                "criteria": milestone["criteria"],
                "progress_percent": new_progress,
            }}
        )

        return {
            "milestone_id": str(current_milestone_id),
            "new_progress": round(new_progress, 1),
        }

    # ============================================
    # Route Registration
    # ============================================

    def register_routes(self, app):
        """Register all study plan API routes."""

        # ---- PUBLIC ENDPOINTS (No Auth Required) ----

        @app.route("/f-api/v1/study-plan/templates", methods=["GET"])
        def list_templates():
            """List all public plan templates."""
            try:
                level = request.args.get("level")
                query = {"is_public": True}

                if level and level in JLPT_LEVELS:
                    query["target_level"] = level

                templates = list(self.templates_collection.find(query))

                result = []
                for t in templates:
                    result.append({
                        "id": str(t["_id"]),
                        "target_level": t["target_level"],
                        "duration_weeks": t["duration_weeks"],
                        "title": t["title"],
                        "description": t["description"],
                        "daily_minutes_recommended": t["daily_minutes_recommended"],
                        "milestone_count": len(t.get("milestones", [])),
                    })

                return jsonify({"templates": result}), 200

            except Exception as e:
                self.logger.error(f"Error listing templates: {e}")
                return jsonify({"error": "Failed to fetch templates"}), 500

        @app.route("/f-api/v1/study-plan/templates/<template_id>", methods=["GET"])
        def get_template(template_id):
            """Get a specific template with milestone details."""
            try:
                template = self.templates_collection.find_one({"_id": ObjectId(template_id)})

                if not template:
                    return jsonify({"error": "Template not found"}), 404

                return jsonify({
                    "id": str(template["_id"]),
                    "target_level": template["target_level"],
                    "duration_weeks": template["duration_weeks"],
                    "title": template["title"],
                    "description": template["description"],
                    "daily_minutes_recommended": template["daily_minutes_recommended"],
                    "milestones": template.get("milestones", []),
                    "jlpt_requirements": JLPT_REQUIREMENTS.get(template["target_level"], {}),
                }), 200

            except Exception as e:
                self.logger.error(f"Error fetching template: {e}")
                return jsonify({"error": "Failed to fetch template"}), 500

        @app.route("/f-api/v1/study-plan/jlpt-info", methods=["GET"])
        def get_jlpt_info():
            """Get JLPT level requirements and exam info."""
            return jsonify({
                "levels": JLPT_LEVELS,
                "requirements": JLPT_REQUIREMENTS,
                "study_time_options": STUDY_TIME_OPTIONS,
            }), 200

        # ---- AUTHENTICATED ENDPOINTS ----

        @app.route("/f-api/v1/study-plan/plans", methods=["POST"])
        def create_plan():
            """Create a personalized study plan."""
            try:
                data = request.get_json()

                if not data:
                    return jsonify({"error": "No data provided"}), 400

                user_id = data.get("user_id")
                if not user_id:
                    return jsonify({"error": "user_id is required"}), 400

                target_level = data.get("target_level")
                if target_level not in JLPT_LEVELS:
                    return jsonify({"error": "Invalid target_level"}), 400

                exam_date_str = data.get("exam_date")
                if not exam_date_str:
                    return jsonify({"error": "exam_date is required"}), 400

                try:
                    exam_date = datetime.fromisoformat(exam_date_str.replace("Z", "+00:00"))
                except:
                    return jsonify({"error": "Invalid exam_date format"}), 400

                settings = {
                    "daily_study_minutes": data.get("daily_study_minutes", 30),
                    "study_days_per_week": data.get("study_days_per_week", 5),
                    "preferred_focus": data.get("preferred_focus", []),
                }

                plan = self.generate_plan(user_id, target_level, exam_date, settings)

                return jsonify({
                    "id": str(plan["_id"]),
                    "message": "Study plan created successfully",
                    "target_level": plan["target_level"],
                    "total_days": plan["total_days"],
                }), 201

            except ValueError as ve:
                return jsonify({"error": str(ve)}), 400
            except Exception as e:
                self.logger.error(f"Error creating plan: {e}")
                return jsonify({"error": "Failed to create plan"}), 500

        @app.route("/f-api/v1/study-plan/plans", methods=["GET"])
        def list_plans():
            """List user's study plans."""
            try:
                user_id = request.args.get("user_id")
                if not user_id:
                    return jsonify({"error": "user_id is required"}), 400

                status = request.args.get("status")
                query = {"user_id": user_id}
                if status and status in PLAN_STATUSES:
                    query["status"] = status

                plans = list(self.plans_collection.find(query).sort("created_at", -1))

                result = []
                for p in plans:
                    # Calculate days remaining
                    days_remaining = (p["exam_date"] - datetime.utcnow()).days
                    days_remaining = max(0, days_remaining)

                    # Calculate progress
                    progress = self.calculate_plan_progress(p["_id"])

                    result.append({
                        "id": str(p["_id"]),
                        "target_level": p["target_level"],
                        "exam_date": p["exam_date"].isoformat(),
                        "status": p["status"],
                        "days_remaining": days_remaining,
                        "overall_progress_percent": round(progress, 1),
                        "daily_study_minutes": p.get("daily_study_minutes", 30),
                        "created_at": p["created_at"].isoformat(),
                    })

                return jsonify({"plans": result}), 200

            except Exception as e:
                self.logger.error(f"Error listing plans: {e}")
                return jsonify({"error": "Failed to fetch plans"}), 500

        @app.route("/f-api/v1/study-plan/plans/<plan_id>", methods=["GET"])
        def get_plan(plan_id):
            """Get detailed plan information."""
            try:
                plan = self.plans_collection.find_one({"_id": ObjectId(plan_id)})

                if not plan:
                    return jsonify({"error": "Plan not found"}), 404

                # Get milestones
                milestones = list(self.milestones_collection.find(
                    {"plan_id": ObjectId(plan_id)}
                ).sort("milestone_number", 1))

                milestone_data = []
                for m in milestones:
                    progress = self.calculate_milestone_progress(m)
                    milestone_data.append({
                        "id": str(m["_id"]),
                        "plan_id": str(m["plan_id"]),
                        "milestone_number": m["milestone_number"],
                        "title": m["title"],
                        "description": m.get("description", ""),
                        "category": m["category"],
                        "status": m["status"],
                        "progress_percent": round(progress, 1),
                        "target_start_date": m["target_start_date"].isoformat(),
                        "target_end_date": m["target_end_date"].isoformat(),
                        "criteria": m["criteria"],
                    })

                # Calculate days remaining
                days_remaining = (plan["exam_date"] - datetime.utcnow()).days
                days_remaining = max(0, days_remaining)

                # Overall progress
                overall_progress = self.calculate_plan_progress(plan["_id"])

                return jsonify({
                    "id": str(plan["_id"]),
                    "target_level": plan["target_level"],
                    "exam_date": plan["exam_date"].isoformat(),
                    "start_date": plan["start_date"].isoformat(),
                    "status": plan["status"],
                    "total_days": plan["total_days"],
                    "days_remaining": days_remaining,
                    "overall_progress_percent": round(overall_progress, 1),
                    "daily_study_minutes": plan.get("daily_study_minutes", 30),
                    "study_days_per_week": plan.get("study_days_per_week", 5),
                    "preferred_focus": plan.get("preferred_focus", []),
                    "current_milestone_id": str(plan["current_milestone_id"]) if plan.get("current_milestone_id") else None,
                    "milestones": milestone_data,
                    "jlpt_requirements": JLPT_REQUIREMENTS.get(plan["target_level"], {}),
                }), 200

            except Exception as e:
                self.logger.error(f"Error fetching plan: {e}")
                return jsonify({"error": "Failed to fetch plan"}), 500

        @app.route("/f-api/v1/study-plan/plans/<plan_id>", methods=["PATCH"])
        def update_plan(plan_id):
            """Update plan settings."""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "No data provided"}), 400

                plan = self.plans_collection.find_one({"_id": ObjectId(plan_id)})
                if not plan:
                    return jsonify({"error": "Plan not found"}), 404

                # Allowed updates
                updates = {}
                if "daily_study_minutes" in data:
                    updates["daily_study_minutes"] = data["daily_study_minutes"]
                if "study_days_per_week" in data:
                    updates["study_days_per_week"] = data["study_days_per_week"]
                if "preferred_focus" in data:
                    updates["preferred_focus"] = data["preferred_focus"]
                if "status" in data and data["status"] in PLAN_STATUSES:
                    updates["status"] = data["status"]

                if updates:
                    updates["updated_at"] = datetime.utcnow()
                    self.plans_collection.update_one(
                        {"_id": ObjectId(plan_id)},
                        {"$set": updates}
                    )

                return jsonify({"message": "Plan updated successfully"}), 200

            except Exception as e:
                self.logger.error(f"Error updating plan: {e}")
                return jsonify({"error": "Failed to update plan"}), 500

        @app.route("/f-api/v1/study-plan/plans/<plan_id>", methods=["DELETE"])
        def delete_plan(plan_id):
            """Abandon/delete a study plan."""
            try:
                plan = self.plans_collection.find_one({"_id": ObjectId(plan_id)})
                if not plan:
                    return jsonify({"error": "Plan not found"}), 404

                # Mark as abandoned (soft delete)
                self.plans_collection.update_one(
                    {"_id": ObjectId(plan_id)},
                    {"$set": {"status": "abandoned", "updated_at": datetime.utcnow()}}
                )

                return jsonify({"message": "Plan abandoned successfully"}), 200

            except Exception as e:
                self.logger.error(f"Error deleting plan: {e}")
                return jsonify({"error": "Failed to delete plan"}), 500

        # ---- MILESTONE ENDPOINTS ----

        @app.route("/f-api/v1/study-plan/milestones/<milestone_id>", methods=["GET"])
        def get_milestone(milestone_id):
            """Get milestone details."""
            try:
                milestone = self.milestones_collection.find_one({"_id": ObjectId(milestone_id)})

                if not milestone:
                    return jsonify({"error": "Milestone not found"}), 404

                progress = self.calculate_milestone_progress(milestone)

                return jsonify({
                    "id": str(milestone["_id"]),
                    "plan_id": str(milestone["plan_id"]),
                    "milestone_number": milestone["milestone_number"],
                    "title": milestone["title"],
                    "description": milestone.get("description", ""),
                    "category": milestone["category"],
                    "status": milestone["status"],
                    "progress_percent": round(progress, 1),
                    "target_start_date": milestone["target_start_date"].isoformat(),
                    "target_end_date": milestone["target_end_date"].isoformat(),
                    "actual_start_date": milestone["actual_start_date"].isoformat() if milestone.get("actual_start_date") else None,
                    "actual_end_date": milestone["actual_end_date"].isoformat() if milestone.get("actual_end_date") else None,
                    "criteria": milestone["criteria"],
                }), 200

            except Exception as e:
                self.logger.error(f"Error fetching milestone: {e}")
                return jsonify({"error": "Failed to fetch milestone"}), 500

        @app.route("/f-api/v1/study-plan/milestones/<milestone_id>/complete", methods=["PATCH"])
        def complete_milestone(milestone_id):
            """Mark a milestone as complete."""
            try:
                milestone = self.milestones_collection.find_one({"_id": ObjectId(milestone_id)})

                if not milestone:
                    return jsonify({"error": "Milestone not found"}), 404

                self.milestones_collection.update_one(
                    {"_id": ObjectId(milestone_id)},
                    {"$set": {
                        "status": "completed",
                        "actual_end_date": datetime.utcnow(),
                        "progress_percent": 100,
                    }}
                )

                # Advance to next milestone
                plan = self.plans_collection.find_one({"_id": milestone["plan_id"]})
                if plan:
                    next_milestone = self.milestones_collection.find_one({
                        "plan_id": milestone["plan_id"],
                        "milestone_number": milestone["milestone_number"] + 1
                    })

                    if next_milestone:
                        self.plans_collection.update_one(
                            {"_id": milestone["plan_id"]},
                            {"$set": {
                                "current_milestone_id": next_milestone["_id"],
                                "updated_at": datetime.utcnow(),
                            }}
                        )
                        self.milestones_collection.update_one(
                            {"_id": next_milestone["_id"]},
                            {"$set": {
                                "status": "in_progress",
                                "actual_start_date": datetime.utcnow(),
                            }}
                        )

                return jsonify({"message": "Milestone completed"}), 200

            except Exception as e:
                self.logger.error(f"Error completing milestone: {e}")
                return jsonify({"error": "Failed to complete milestone"}), 500

        # ---- DAILY TASKS ENDPOINTS ----

        @app.route("/f-api/v1/study-plan/daily-tasks", methods=["GET"])
        def get_daily_tasks():
            """Get tasks for today or a specific date."""
            try:
                user_id = request.args.get("user_id")
                if not user_id:
                    return jsonify({"error": "user_id is required"}), 400

                date_str = request.args.get("date")
                if date_str:
                    try:
                        target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
                    except:
                        target_date = datetime.utcnow().date()
                else:
                    target_date = datetime.utcnow().date()

                # Find active plan
                plan = self.plans_collection.find_one({
                    "user_id": user_id,
                    "status": "active"
                })

                if not plan:
                    return jsonify({"tasks": [], "message": "No active study plan"}), 200

                # Check if tasks already generated for this date
                start_of_day = datetime.combine(target_date, datetime.min.time())
                end_of_day = datetime.combine(target_date, datetime.max.time())

                existing_tasks = list(self.tasks_collection.find({
                    "user_id": user_id,
                    "date": {"$gte": start_of_day, "$lte": end_of_day}
                }))

                if not existing_tasks:
                    # Generate tasks
                    generated = self.generate_daily_tasks(plan["_id"], start_of_day)
                    if generated:
                        self.tasks_collection.insert_many(generated)
                        existing_tasks = generated

                tasks_result = []
                for t in existing_tasks:
                    tasks_result.append({
                        "id": str(t["_id"]) if "_id" in t else None,
                        "task_type": t["task_type"],
                        "title": t["title"],
                        "description": t["description"],
                        "estimated_minutes": t["estimated_minutes"],
                        "status": t["status"],
                        "completed_at": t["completed_at"].isoformat() if t.get("completed_at") else None,
                        "score": t.get("score"),
                    })

                return jsonify({
                    "date": target_date.isoformat(),
                    "tasks": tasks_result,
                    "plan_id": str(plan["_id"]),
                }), 200

            except Exception as e:
                self.logger.error(f"Error fetching daily tasks: {e}")
                return jsonify({"error": "Failed to fetch tasks"}), 500

        @app.route("/f-api/v1/study-plan/daily-tasks/<task_id>/complete", methods=["PATCH"])
        def complete_task(task_id):
            """Mark a task as complete."""
            try:
                data = request.get_json() or {}

                self.tasks_collection.update_one(
                    {"_id": ObjectId(task_id)},
                    {"$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "score": data.get("score"),
                    }}
                )

                return jsonify({"message": "Task completed"}), 200

            except Exception as e:
                self.logger.error(f"Error completing task: {e}")
                return jsonify({"error": "Failed to complete task"}), 500

        @app.route("/f-api/v1/study-plan/progress/<plan_id>", methods=["GET"])
        def get_progress(plan_id):
            """Get detailed progress report for a plan."""
            try:
                plan = self.plans_collection.find_one({"_id": ObjectId(plan_id)})
                if not plan:
                    return jsonify({"error": "Plan not found"}), 404

                # Overall progress
                overall = self.calculate_plan_progress(plan["_id"])

                # Milestone progress
                milestones = list(self.milestones_collection.find({"plan_id": ObjectId(plan_id)}))
                milestone_progress = []
                for m in milestones:
                    progress = self.calculate_milestone_progress(m)
                    milestone_progress.append({
                        "milestone_number": m["milestone_number"],
                        "title": m["title"],
                        "status": m["status"],
                        "progress_percent": round(progress, 1),
                    })

                # Days remaining
                days_remaining = max(0, (plan["exam_date"] - datetime.utcnow()).days)

                # Study streak (placeholder)
                study_streak = 0

                return jsonify({
                    "plan_id": str(plan["_id"]),
                    "overall_progress_percent": round(overall, 1),
                    "days_remaining": days_remaining,
                    "days_studied": plan["total_days"] - days_remaining,
                    "study_streak": study_streak,
                    "milestone_progress": milestone_progress,
                    "jlpt_requirements": JLPT_REQUIREMENTS.get(plan["target_level"], {}),
                }), 200

            except Exception as e:
                self.logger.error(f"Error fetching progress: {e}")
                return jsonify({"error": "Failed to fetch progress"}), 500

        # ---- ADAPTIVE ADJUSTMENT ENDPOINTS ----

        @app.route("/f-api/v1/study-plan/plans/<plan_id>/health", methods=["GET"])
        def check_plan_health(plan_id):
            """Get plan health analysis with recommendations."""
            try:
                result = self.check_plan_health(ObjectId(plan_id))
                if "error" in result:
                    return jsonify(result), 404
                return jsonify(result), 200
            except Exception as e:
                self.logger.error(f"Error checking plan health: {e}")
                return jsonify({"error": "Failed to check plan health"}), 500

        @app.route("/f-api/v1/study-plan/plans/<plan_id>/recalculate", methods=["POST"])
        def recalculate_plan(plan_id):
            """Recalculate milestone timelines."""
            try:
                data = request.get_json() or {}
                new_exam_date = None
                
                if "exam_date" in data:
                    try:
                        new_exam_date = datetime.fromisoformat(
                            data["exam_date"].replace("Z", "+00:00")
                        )
                    except:
                        return jsonify({"error": "Invalid exam_date format"}), 400

                result = self.recalculate_milestones(ObjectId(plan_id), new_exam_date)
                
                if not result.get("success"):
                    return jsonify(result), 400
                    
                return jsonify(result), 200
                
            except Exception as e:
                self.logger.error(f"Error recalculating plan: {e}")
                return jsonify({"error": "Failed to recalculate plan"}), 500

        @app.route("/f-api/v1/study-plan/plans/<plan_id>/quiz-update", methods=["POST"])
        def update_from_quiz(plan_id):
            """Update milestone progress based on quiz results."""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "No data provided"}), 400

                quiz_result = {
                    "category": data.get("category", "mixed"),
                    "score": data.get("score", 0),
                    "items_correct": data.get("items_correct", 0),
                    "items_total": data.get("items_total", 0),
                }

                result = self.update_milestone_from_quiz(ObjectId(plan_id), quiz_result)
                
                if "error" in result:
                    return jsonify(result), 400
                    
                return jsonify(result), 200
                
            except Exception as e:
                self.logger.error(f"Error updating from quiz: {e}")
                return jsonify({"error": "Failed to update from quiz"}), 500

        @app.route("/f-api/v1/study-plan/srs-update", methods=["POST"])
        def update_from_srs():
            """Update milestone progress based on SRS statistics."""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "No data provided"}), 400

                user_id = data.get("user_id")
                if not user_id:
                    return jsonify({"error": "user_id is required"}), 400

                srs_stats = {
                    "category": data.get("category", "vocabulary"),
                    "cards_learned": data.get("cards_learned", 0),
                    "total_reviewed": data.get("total_reviewed", 0),
                }

                result = self.update_milestone_from_srs(user_id, srs_stats)
                
                if result is None:
                    return jsonify({"message": "No active plan found"}), 200
                    
                return jsonify(result), 200
                
            except Exception as e:
                self.logger.error(f"Error updating from SRS: {e}")
                return jsonify({"error": "Failed to update from SRS"}), 500

        self.logger.info("Study Plan routes registered")

