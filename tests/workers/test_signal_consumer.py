import unittest
from unittest.mock import MagicMock
import json
from backend.hanachan.workers.signal_consumer import SignalConsumer
from backend.hanachan.schemas.signal import Signal, SignalPriority
from backend.hanachan.services.policy_engine import SignalPolicyEngine

class TestSignalConsumer(unittest.TestCase):
    def setUp(self):
        self.mock_redis = MagicMock()
        self.consumer = SignalConsumer(redis_client=self.mock_redis)
        # Mock policy engine ensuring it returns what we want
        self.consumer.policy = MagicMock(spec=SignalPolicyEngine)

    def test_process_valid_signal_accepted(self):
        # Setup
        sig_data = {
            "type": "test",
            "priority": "P1",
            "user_id": "u1",
            "payload": {}
        }
        msg_json = json.dumps(sig_data)
        
        # Policy says YES
        self.consumer.policy.evaluate.return_value = True
        
        # Action
        status = self.consumer.process_message(msg_json)
        
        # Assert
        self.assertEqual(status, "PROCESSED")
        # Ensure policy was checked
        self.consumer.policy.evaluate.assert_called_once()

    def test_process_signal_rejected(self):
        # Setup
        sig_data = {
            "type": "spam",
            "priority": "P2",
            "user_id": "u1"
        }
        msg_json = json.dumps(sig_data)
        
        # Policy says NO
        self.consumer.policy.evaluate.return_value = False
        
        # Action
        status = self.consumer.process_message(msg_json)
        
        # Assert
        self.assertEqual(status, "DROPPED_BY_POLICY")

    def test_process_invalid_json(self):
        status = self.consumer.process_message("{invalid json")
        self.assertEqual(status, "ERROR")
