import unittest
from unittest.mock import MagicMock
import json
from services.signal_producer import SignalProducer, SIGNAL_QUEUE_NAME

class TestSignalProducer(unittest.TestCase):
    def setUp(self):
        self.mock_redis = MagicMock()
        self.producer = SignalProducer(redis_client=self.mock_redis)

    def test_emit_structure(self):
        trace_id = self.producer.emit(
            type="test.signal",
            priority="P2",
            user_id="u1",
            payload={"foo": "bar"}
        )
        
        self.mock_redis.rpush.assert_called_once()
        args = self.mock_redis.rpush.call_args[0]
        queue_name = args[0]
        message_json = args[1]
        
        self.assertEqual(queue_name, SIGNAL_QUEUE_NAME)
        
        message = json.loads(message_json)
        self.assertEqual(message["type"], "test.signal")
        self.assertEqual(message["priority"], "P2")
        self.assertEqual(message["user_id"], "u1")
        self.assertEqual(message["payload"]["foo"], "bar")
        self.assertEqual(message["trace_id"], trace_id)

if __name__ == '__main__':
    unittest.main()
