import unittest
import redis
import json
import threading
import time
import uuid
import os
from datetime import datetime

# Import our components
from backend.flask.services.signal_producer import SignalProducer, SIGNAL_QUEUE_NAME
from backend.hanachan.workers.signal_consumer import SignalConsumer
from backend.hanachan.tools.notifier import NotificationService
from backend.hanachan.schemas.signal import SignalPriority

# Configuration (Assume local Redis from docker-compose or similar)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost") 
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

class TestCoordinationFlow(unittest.TestCase):
    def setUp(self):
        # Try to connect to Redis. If fails, skip test (or fail if strict)
        try:
            self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
            self.redis.ping()
        except redis.ConnectionError:
            self.skipTest("Redis not available - skipping integration test")

        # Clear Redis (Queue and any test keys)
        self.redis.delete(SIGNAL_QUEUE_NAME)
        self.test_user_id = f"test_user_{uuid.uuid4()}"
        self.notification_channel = f"notifications:{self.test_user_id}"
        
        # Initialize Components
        self.producer = SignalProducer(redis_client=self.redis)
        self.consumer = SignalConsumer(redis_client=self.redis)
        self.notifier = NotificationService()
        self.notifier.redis = self.redis

    def tearDown(self):
        self.redis.delete(SIGNAL_QUEUE_NAME)

    def test_full_round_trip(self):
        """
        Simulates: Flask emits Signal -> Queue -> Hanachan Processes -> Hanachan Notifies -> Frontend Receives
        """
        print(f"\n[TEST] Starting Full Round Trip for {self.test_user_id}...")

        # 1. Start a "Frontend" listener (PubSub)
        received_notifications = []
        
        def frontend_listener():
            pubsub = self.redis.pubsub()
            pubsub.subscribe(self.notification_channel)
            print("[UI] Listening for notifications...")
            for message in pubsub.listen():
                if message['type'] == 'message':
                    data = json.loads(message['data'])
                    received_notifications.append(data)
                    print(f"[UI] Received: {data}")
                    # Stop after receiving expected message
                    if data.get("type") == "agent_alert":
                        break
        
        listener_thread = threading.Thread(target=frontend_listener)
        listener_thread.daemon = True
        listener_thread.start()
        time.sleep(0.5) # Wait for subscription

        # 2. Simulate User Action (Flask Producer)
        print("[Flask] Emitting 'streak_broken' signal (P1)...")
        self.producer.emit(
            type="streak_broken",
            priority="P1",
            user_id=self.test_user_id,
            payload={"days_missed": 1}
        )

        # 3. Verify Message in Queue (Infrastructure Check)
        queue_len = self.redis.llen(SIGNAL_QUEUE_NAME)
        self.assertEqual(queue_len, 1, "Queue should have 1 signal")

        # 4. Run Consumer (Hanachan)
        # We manually pop to simulate the worker loop
        _, msg_json = self.redis.blpop(SIGNAL_QUEUE_NAME, timeout=2)
        print("[Hanachan] Popped message from queue")
        
        # Override the _dispatch_to_agent to perform the Notification Action
        # This mocks the "Reasoning Engine" deciding to Notify
        original_dispatch = self.consumer._dispatch_to_agent
        def mock_agent_action(signal):
            print("[Agent] Thinking... Deciding to notify user.")
            self.notifier.send_notification(
                user_id=signal.user_id,
                message="Oh no! Your streak is broken. Do a quick 5min review to save it?",
                type="agent_alert"
            )
        self.consumer._dispatch_to_agent = mock_agent_action

        # Process the message
        status = self.consumer.process_message(msg_json)
        self.assertEqual(status, "PROCESSED")

        # 5. Verify Notification Received (Frontend)
        time.sleep(1) # Allow PubSub propagation
        
        self.assertTrue(len(received_notifications) > 0, "UI should have received notification")
        last_msg = received_notifications[-1]
        self.assertEqual(last_msg["type"], "agent_alert")
        self.assertIn("streak is broken", last_msg["message"])
        print("[TEST] Round Trip Successful!")

    def test_policy_filtering(self):
        """
        Simulates: Spamming signals -> Policy Engine Filters -> Only 1 Processed
        """
        print("\n[TEST] Testing Policy Filtering/Spam Protection...")
        
        # Emit 5 identical signals
        for _ in range(5):
            self.producer.emit(type="button_click", priority="P2", user_id=self.test_user_id)
        
        processed_count = 0
        dropped_count = 0
        
        # Process all 5
        for _ in range(5):
            result = self.redis.blpop(SIGNAL_QUEUE_NAME, timeout=1)
            if result:
                _, msg = result
                status = self.consumer.process_message(msg)
                if status == "PROCESSED":
                    processed_count += 1
                elif status == "DROPPED_BY_POLICY":
                    dropped_count += 1
        
        print(f"[Results] Processed: {processed_count}, Dropped: {dropped_count}")
        self.assertEqual(processed_count, 1, "Should processed only 1 unique signal")
        self.assertEqual(dropped_count, 4, "Should drop 4 duplicates")

if __name__ == '__main__':
    unittest.main()
