import time
import uuid
import redis
from backend.flask.services.signal_producer import SignalProducer
from backend.hanachan.workers.signal_consumer import SignalConsumer

def generate_live_traces():
    print("🚀 GENERATING LIVE TRACES FOR OBSERVABILITY DASHBOARD...")
    r = redis.Redis(host='localhost', port=6379, db=0)
    producer = SignalProducer(redis_client=r)
    consumer = SignalConsumer(redis_client=r)
    
    scenarios = [
        {"type": "streak_at_risk", "priority": "P1", "user_id": "user_demo_1"},
        {"type": "lesson_completed", "priority": "P2", "user_id": "user_demo_2"},
        {"type": "missed_goal", "priority": "P0", "user_id": "user_demo_3"}
    ]
    
    for s in scenarios:
        print(f"   Generating {s['type']}...")
        trace_id = producer.emit(s['type'], s['priority'], s['user_id'])
        
        # Pull from Redis and Process
        _, raw_msg = r.blpop("hanachan_signals", timeout=1)
        consumer.process_message(raw_msg)
        
        time.sleep(1)

    print("✅ Done. Traces should now be visible in MongoDB and on the UI.")

if __name__ == "__main__":
    generate_live_traces()
