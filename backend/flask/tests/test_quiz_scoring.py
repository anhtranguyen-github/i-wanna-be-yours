"""
Unit tests for Quiz scoring engine
"""

import unittest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.quiz import (
    score_binary,
    score_partial_order,
    score_question,
    score_submission,
)


class TestBinaryScoring(unittest.TestCase):
    """Tests for binary (all-or-nothing) scoring."""
    
    def test_correct_answer_string(self):
        """Correct string answer should give full points."""
        result = score_binary("たべる", "たべる", 1)
        self.assertTrue(result["is_correct"])
        self.assertEqual(result["points_earned"], 1)
    
    def test_incorrect_answer_string(self):
        """Incorrect string answer should give zero points."""
        result = score_binary("たべる", "のむ", 1)
        self.assertFalse(result["is_correct"])
        self.assertEqual(result["points_earned"], 0)
    
    def test_case_insensitive(self):
        """Scoring should be case-insensitive for strings."""
        result = score_binary("Big", "big", 1)
        self.assertTrue(result["is_correct"])
    
    def test_whitespace_handling(self):
        """Scoring should ignore leading/trailing whitespace."""
        result = score_binary("answer", "  answer  ", 1)
        self.assertTrue(result["is_correct"])
    
    def test_points_value(self):
        """Correct answer should return the specified points value."""
        result = score_binary("correct", "correct", 5)
        self.assertEqual(result["points_earned"], 5)


class TestPartialOrderScoring(unittest.TestCase):
    """Tests for partial scoring (sentence ordering)."""
    
    def test_all_correct(self):
        """All items in correct order should give full points."""
        result = score_partial_order(["a", "b", "c"], ["a", "b", "c"], 3)
        self.assertTrue(result["is_correct"])
        self.assertEqual(result["points_earned"], 3)
    
    def test_all_wrong(self):
        """All items in wrong order should give zero points."""
        result = score_partial_order(["a", "b", "c"], ["c", "a", "b"], 3)
        self.assertFalse(result["is_correct"])
        self.assertEqual(result["points_earned"], 0)
    
    def test_partial_correct(self):
        """Some items in correct order should give partial points."""
        # 2 out of 3 correct positions
        result = score_partial_order(["a", "b", "c"], ["a", "b", "x"], 3)
        self.assertFalse(result["is_correct"])
        self.assertEqual(result["points_earned"], 2)
    
    def test_length_mismatch(self):
        """Different length arrays should give zero points."""
        result = score_partial_order(["a", "b"], ["a", "b", "c"], 3)
        self.assertFalse(result["is_correct"])
        self.assertEqual(result["points_earned"], 0)
    
    def test_non_list_input(self):
        """Non-list inputs should give zero points."""
        result = score_partial_order("not a list", ["a"], 1)
        self.assertFalse(result["is_correct"])
        self.assertEqual(result["points_earned"], 0)


class TestQuestionScoring(unittest.TestCase):
    """Tests for scoring individual questions."""
    
    def test_vocab_reading_correct(self):
        """Correct vocab reading answer."""
        question = {
            "question_type": "vocab_reading",
            "content": {
                "correct_answer": "たべる",
                "scoring_rule": "binary",
            },
            "points": 1,
        }
        result = score_question(question, "たべる")
        self.assertTrue(result["is_correct"])
    
    def test_grammar_sentence_order(self):
        """Sentence order uses partial scoring."""
        question = {
            "question_type": "grammar_sentence_order",
            "content": {
                "correct_answer": ["私", "は", "学生", "です"],
            },
            "points": 4,
        }
        # 3 out of 4 correct
        result = score_question(question, ["私", "は", "学生", "だ"])
        self.assertEqual(result["points_earned"], 3)


class TestSubmissionScoring(unittest.TestCase):
    """Tests for complete quiz submission scoring."""
    
    def setUp(self):
        """Set up test quiz."""
        self.quiz = {
            "questions": [
                {
                    "question_id": "q1",
                    "question_type": "vocab_reading",
                    "content": {
                        "correct_answer": "たべる",
                    },
                    "learning_points": ["食べる"],
                    "linked_flashcard_ids": [],
                    "points": 1,
                },
                {
                    "question_id": "q2",
                    "question_type": "vocab_reading",
                    "content": {
                        "correct_answer": "のむ",
                    },
                    "learning_points": ["飲む"],
                    "linked_flashcard_ids": [],
                    "points": 1,
                },
                {
                    "question_id": "q3",
                    "question_type": "vocab_meaning",
                    "content": {
                        "correct_answer": "big",
                    },
                    "learning_points": ["大きい"],
                    "linked_flashcard_ids": [],
                    "points": 1,
                },
            ]
        }
    
    def test_all_correct(self):
        """All correct answers should give 100%."""
        answers = {
            "q1": "たべる",
            "q2": "のむ",
            "q3": "big",
        }
        result = score_submission(self.quiz, answers)
        
        self.assertEqual(result["total_score"], 3)
        self.assertEqual(result["max_score"], 3)
        self.assertEqual(result["percentage"], 100.0)
        self.assertEqual(len(result["weak_items"]), 0)
    
    def test_all_wrong(self):
        """All wrong answers should give 0%."""
        answers = {
            "q1": "wrong",
            "q2": "wrong",
            "q3": "wrong",
        }
        result = score_submission(self.quiz, answers)
        
        self.assertEqual(result["total_score"], 0)
        self.assertEqual(result["percentage"], 0)
        self.assertEqual(len(result["weak_items"]), 3)
    
    def test_partial_correct(self):
        """Some correct answers should give partial score."""
        answers = {
            "q1": "たべる",  # correct
            "q2": "wrong",   # wrong
            "q3": "big",     # correct
        }
        result = score_submission(self.quiz, answers)
        
        self.assertEqual(result["total_score"], 2)
        self.assertEqual(result["max_score"], 3)
        self.assertAlmostEqual(result["percentage"], 66.7, places=1)
        self.assertEqual(len(result["weak_items"]), 1)
    
    def test_missing_answers(self):
        """Missing answers should be marked as incorrect."""
        answers = {
            "q1": "たべる",
            # q2 and q3 missing
        }
        result = score_submission(self.quiz, answers)
        
        self.assertEqual(result["total_score"], 1)
        self.assertEqual(len(result["weak_items"]), 2)
    
    def test_weak_items_tracking(self):
        """Weak items should include learning points from wrong answers."""
        answers = {
            "q1": "wrong",
        }
        result = score_submission(self.quiz, answers)
        
        # Check that weak items contain the learning point
        learning_points = [item["learning_point"] for item in result["weak_items"]]
        self.assertIn("食べる", learning_points)


if __name__ == "__main__":
    unittest.main(verbosity=2)
