import unittest
from unittest.mock import MagicMock
import json
from backend.hanachan.tools.notifier import NotificationService

class TestNotificationService(unittest.TestCase):
    def setUp(self):
        self.mock_redis = MagicMock()
        self.service = NotificationService()
        self.service.redis = self.mock_redis

    def test_send_notification(self):
        user_id = "u1"
        message = "Hello"
        
        self.service.send_notification(user_id, message)
        
        self.mock_redis.publish.assert_called_once()
        args = self.mock_redis.publish.call_args[0]
        channel = args[0]
        payload = json.loads(args[1])
        
        self.assertEqual(channel, f"notifications:{user_id}")
        self.assertEqual(payload["message"], "Hello")
        self.assertEqual(payload["type"], "info")

if __name__ == '__main__':
    unittest.main()
