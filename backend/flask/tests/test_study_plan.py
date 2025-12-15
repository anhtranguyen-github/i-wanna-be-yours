"""
Unit Tests for Study Plan Module

Tests for:
- Plan template seeding
- Plan generation
- Milestone creation
- Progress calculation
- API endpoints
"""

import unittest
import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from bson import ObjectId

# Import the module
import sys
sys.path.append('..')
from modules.study_plan import StudyPlanModule, JLPT_LEVELS, JLPT_REQUIREMENTS


class TestStudyPlanConstants(unittest.TestCase):
    """Test constants and reference data."""
    
    def test_jlpt_levels_defined(self):
        """All JLPT levels should be defined."""
        expected = ["N5", "N4", "N3", "N2", "N1"]
        self.assertEqual(JLPT_LEVELS, expected)
    
    def test_jlpt_requirements_complete(self):
        """All levels should have vocabulary, kanji, and grammar requirements."""
        for level in JLPT_LEVELS:
            self.assertIn(level, JLPT_REQUIREMENTS)
            self.assertIn("vocabulary", JLPT_REQUIREMENTS[level])
            self.assertIn("kanji", JLPT_REQUIREMENTS[level])
            self.assertIn("grammar_points", JLPT_REQUIREMENTS[level])
    
    def test_requirements_increase_with_difficulty(self):
        """Higher JLPT levels should have higher requirements."""
        # Vocabulary
        self.assertLess(JLPT_REQUIREMENTS["N5"]["vocabulary"], JLPT_REQUIREMENTS["N4"]["vocabulary"])
        self.assertLess(JLPT_REQUIREMENTS["N4"]["vocabulary"], JLPT_REQUIREMENTS["N3"]["vocabulary"])
        
        # Kanji
        self.assertLess(JLPT_REQUIREMENTS["N5"]["kanji"], JLPT_REQUIREMENTS["N4"]["kanji"])
        self.assertLess(JLPT_REQUIREMENTS["N4"]["kanji"], JLPT_REQUIREMENTS["N3"]["kanji"])


class TestMilestoneGeneration(unittest.TestCase):
    """Test milestone template functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        from modules.study_plan import get_n5_milestones_12_weeks
        self.n5_milestones = get_n5_milestones_12_weeks()
    
    def test_n5_milestones_not_empty(self):
        """N5 milestones should not be empty."""
        self.assertGreater(len(self.n5_milestones), 0)
    
    def test_milestones_have_required_fields(self):
        """Each milestone should have required fields."""
        for milestone in self.n5_milestones:
            self.assertIn("week_start", milestone)
            self.assertIn("week_end", milestone)
            self.assertIn("title", milestone)
            self.assertIn("category", milestone)
            self.assertIn("criteria", milestone)
    
    def test_milestone_weeks_are_sequential(self):
        """Milestone weeks should be sequential without gaps."""
        prev_end = 0
        for milestone in self.n5_milestones:
            self.assertGreaterEqual(milestone["week_start"], prev_end)
            self.assertGreaterEqual(milestone["week_end"], milestone["week_start"])
            prev_end = milestone["week_end"]


class TestProgressCalculation(unittest.TestCase):
    """Test progress calculation functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock the StudyPlanModule to avoid DB connections
        with patch.object(StudyPlanModule, '__init__', lambda x: None):
            self.module = StudyPlanModule()
    
    def test_calculate_milestone_progress_empty_criteria(self):
        """Empty criteria should return 0 progress."""
        milestone = {"criteria": []}
        progress = self.module.calculate_milestone_progress(milestone)
        self.assertEqual(progress, 0)
    
    def test_calculate_milestone_progress_partial(self):
        """Partial completion should be calculated correctly."""
        milestone = {
            "criteria": [
                {"type": "vocab_count", "target_value": 100, "current_value": 50}
            ]
        }
        progress = self.module.calculate_milestone_progress(milestone)
        self.assertEqual(progress, 50)
    
    def test_calculate_milestone_progress_complete(self):
        """Complete criteria should return 100."""
        milestone = {
            "criteria": [
                {"type": "vocab_count", "target_value": 100, "current_value": 100}
            ]
        }
        progress = self.module.calculate_milestone_progress(milestone)
        self.assertEqual(progress, 100)
    
    def test_calculate_milestone_progress_over_100(self):
        """Over-achievement should be capped at 100 per criterion."""
        milestone = {
            "criteria": [
                {"type": "vocab_count", "target_value": 100, "current_value": 150}
            ]
        }
        progress = self.module.calculate_milestone_progress(milestone)
        self.assertEqual(progress, 100)
    
    def test_calculate_milestone_progress_multiple_criteria(self):
        """Multiple criteria should be averaged."""
        milestone = {
            "criteria": [
                {"type": "vocab_count", "target_value": 100, "current_value": 50},  # 50%
                {"type": "kanji_count", "target_value": 50, "current_value": 50},   # 100%
            ]
        }
        progress = self.module.calculate_milestone_progress(milestone)
        self.assertEqual(progress, 75)  # (50 + 100) / 2


class TestMilestoneScaling(unittest.TestCase):
    """Test milestone scaling for different durations."""
    
    def setUp(self):
        """Set up test fixtures."""
        with patch.object(StudyPlanModule, '__init__', lambda x: None):
            self.module = StudyPlanModule()
    
    def test_scale_milestone_same_duration(self):
        """Scaling with same duration should not change weeks."""
        template_milestone = {
            "week_start": 1,
            "week_end": 4,
            "title": "Test",
            "category": "vocabulary",
            "criteria": []
        }
        
        scaled = self.module.scale_milestone(template_milestone, 12, 12)
        
        self.assertEqual(scaled["week_start"], 1)
        self.assertEqual(scaled["week_end"], 4)
    
    def test_scale_milestone_double_duration(self):
        """Doubling duration should roughly double milestone weeks."""
        template_milestone = {
            "week_start": 1,
            "week_end": 4,
            "title": "Test",
            "category": "vocabulary",
            "criteria": []
        }
        
        scaled = self.module.scale_milestone(template_milestone, 12, 24)
        
        self.assertEqual(scaled["week_start"], 2)
        self.assertEqual(scaled["week_end"], 8)
    
    def test_scale_milestone_preserves_content(self):
        """Scaling should preserve title, category, and criteria."""
        template_milestone = {
            "week_start": 1,
            "week_end": 4,
            "title": "My Milestone",
            "category": "grammar",
            "criteria": [{"type": "vocab_count", "target_value": 100, "unit": "words"}]
        }
        
        scaled = self.module.scale_milestone(template_milestone, 12, 24)
        
        self.assertEqual(scaled["title"], "My Milestone")
        self.assertEqual(scaled["category"], "grammar")
        self.assertEqual(len(scaled["criteria"]), 1)


class TestDailyTaskGeneration(unittest.TestCase):
    """Test daily task generation."""
    
    def setUp(self):
        """Set up test fixtures."""
        with patch.object(StudyPlanModule, '__init__', lambda x: None):
            self.module = StudyPlanModule()
            # Mock collections
            self.module.plans_collection = MagicMock()
            self.module.milestones_collection = MagicMock()
            self.module.tasks_collection = MagicMock()
    
    def test_generate_daily_tasks_no_plan(self):
        """No plan should return empty tasks."""
        self.module.plans_collection.find_one.return_value = None
        
        tasks = self.module.generate_daily_tasks(ObjectId(), datetime.utcnow())
        
        self.assertEqual(tasks, [])
    
    def test_generate_daily_tasks_includes_srs_review(self):
        """Daily tasks should always include SRS review."""
        plan = {
            "_id": ObjectId(),
            "user_id": "test_user",
            "daily_study_minutes": 30,
            "current_milestone_id": None,
        }
        self.module.plans_collection.find_one.return_value = plan
        self.module.milestones_collection.find_one.return_value = None
        
        tasks = self.module.generate_daily_tasks(plan["_id"], datetime.utcnow())
        
        self.assertGreater(len(tasks), 0)
        self.assertEqual(tasks[0]["task_type"], "flashcard")
        self.assertEqual(tasks[0]["title"], "Review Due Cards")


class TestAPIEndpoints(unittest.TestCase):
    """Test API endpoint responses."""
    
    def setUp(self):
        """Set up test fixtures."""
        from flask import Flask
        self.app = Flask(__name__)
        
        with patch.object(StudyPlanModule, '__init__', lambda x: None):
            with patch.object(StudyPlanModule, '_create_indexes', lambda x: None):
                with patch.object(StudyPlanModule, '_seed_templates', lambda x: None):
                    self.module = StudyPlanModule()
                    # Mock collections
                    self.module.plans_collection = MagicMock()
                    self.module.milestones_collection = MagicMock()
                    self.module.tasks_collection = MagicMock()
                    self.module.templates_collection = MagicMock()
                    self.module.logger = MagicMock()
                    self.module.register_routes(self.app)
        
        self.client = self.app.test_client()
    
    def test_jlpt_info_endpoint(self):
        """JLPT info endpoint should return level info."""
        response = self.client.get('/f-api/v1/study-plan/jlpt-info')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn("levels", data)
        self.assertIn("requirements", data)
        self.assertEqual(len(data["levels"]), 5)
    
    def test_templates_list_endpoint(self):
        """Templates list endpoint should return templates."""
        self.module.templates_collection.find.return_value = [
            {
                "_id": ObjectId(),
                "target_level": "N5",
                "duration_weeks": 12,
                "title": "Test Template",
                "description": "Test",
                "daily_minutes_recommended": 30,
                "milestones": [],
            }
        ]
        
        response = self.client.get('/f-api/v1/study-plan/templates')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("templates", data)
    
    def test_create_plan_requires_user_id(self):
        """Create plan endpoint should require user_id."""
        response = self.client.post(
            '/f-api/v1/study-plan/plans',
            data=json.dumps({"target_level": "N5"}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)
    
    def test_create_plan_requires_valid_level(self):
        """Create plan endpoint should validate JLPT level."""
        response = self.client.post(
            '/f-api/v1/study-plan/plans',
            data=json.dumps({
                "user_id": "test_user",
                "target_level": "N99",
                "exam_date": "2025-07-06T00:00:00Z"
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
