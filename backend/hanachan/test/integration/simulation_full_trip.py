import unittest
import redis
import json
import os
import time
from backend.flask.services.signal_producer import SignalProducer
from backend.hanachan.workers.signal_consumer import SignalConsumer

class SimulationFrontend:
    """Mocks the ChatContext.tsx SSE listener behavior"""
    def __init__(self, user_id, r_client):
        self.user_id = user_id
        self.redis = r_client
        self.received_notifications = []

    def listen_once(self):
        pubsub = self.redis.pubsub()
        pubsub.subscribe(f"notifications:{self.user_id}")
        # Wait for 1 message
        for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                self.received_notifications.append(data)
                return data

class FullEndToEndSimulation(unittest.TestCase):
    def test_full_agent_to_ui_roundtrip(self):
        r = redis.Redis(host='localhost', port=6379, db=0)
        user_id = "sim_user_99"
        
        # 1. UI is "Online" and listening
        ui = SimulationFrontend(user_id, r)
        
        # 2. Flask emits a high-priority "Streak Broken" event
        producer = SignalProducer(redis_client=r)
        print("\n[Sim] Flask emitting 'streak_at_risk'...")
        trace_id = producer.emit("streak_at_risk", "P1", user_id)
        
        # 3. Simulate the Background Worker (Consumer) waking up
        consumer = SignalConsumer(redis_client=r)
        _, raw_msg = r.blpop("hanachan_signals", timeout=1)
        print("[Sim] Consumer processing signal...")
        consumer.process_message(raw_msg)
        
        # 4. Verify UI received the "Coaching Nudge"
        print("[Sim] UI waiting for SSE event...")
        notification = ui.listen_once()
        
        print(f"[Sim] NOTIFICATION RECEIVED: {notification['message']}")
        self.assertEqual(notification['type'], "coaching_nudge")
        self.assertIn("Japanese streak is at risk", notification['message'])
        print("✅ SUCCESS: Full system coordination verified from Flask to UI (Mock).")

if __name__ == "__main__":
    unittest.main()
