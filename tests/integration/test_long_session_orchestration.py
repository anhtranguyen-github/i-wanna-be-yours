import time
import uuid
import json
import redis
from backend.flask.services.signal_producer import SignalProducer
from backend.hanachan.workers.signal_consumer import SignalConsumer
from backend.hanachan.services.memory import MemoryService
from backend.hanachan.workflows.enhanced_agent import study_agent

def run_long_session_simulation():
    print("\n" + "="*60)
    print("🚀 STARTING LONG-SESSION ORCHESTRATION SIMULATION")
    print("="*60)

    r = redis.Redis(host='localhost', port=6379, db=0)
    producer = SignalProducer(redis_client=r)
    consumer = SignalConsumer(redis_client=r)
    memory = MemoryService(persistence_path="./long_session_db")
    user_id = f"long_user_{uuid.uuid4().hex[:8]}"
    
    # 0. Mocking UI Notification Listener
    pubsub = r.pubsub()
    pubsub.subscribe(f"notifications:{user_id}")
    
    def check_notifications():
        msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
        if msg:
            data = json.loads(msg['data'])
            print(f"   [UI BROWSER] Popup: {data['message']}")
            return data
        return None

    # STEP 1: Onboarding (Semantic Memory)
    print("\n[Step 1] User Onboarding...")
    memory.add_semantic_fact(user_id, "User prefers studying N3 Grammar after 6 PM.")
    memory.add_semantic_fact(user_id, "User is currently focusing on JLPT N3 vocabulary.")
    print("   ✅ Semantic memory initialized.")

    # STEP 2: Active Study Session (Episodic Memory)
    print("\n[Step 2] Simulated Chat Conversation...")
    interactions = [
        "Hi Hanachan, I want to review some N3 grammar today.",
        "Let's focus on '~koto ga aru' syntax.",
        "That was helpful! I'll take a break now."
    ]
    
    for msg in interactions:
        print(f"   [User]: {msg}")
        res = study_agent.handle_interaction({"user_id": user_id, "message": msg})
        print(f"   [Hanachan]: {res['response']}")
        time.sleep(0.5)

    # STEP 3: System Signal Coordination (Proactive Event)
    print("\n[Step 3] Environmental Signal: 10 PM Time-Check Logic...")
    # Simulate a cron job emitting a P1 "Time to wrap up" signal
    producer.emit("late_night_check", "P1", user_id, payload={"current_time": "22:00"})
    
    # Process queue
    _, raw_sig = r.blpop("hanachan_signals", timeout=1)
    print("   [Hanachan Worker] Picking up System Signal...")
    consumer.process_message(raw_sig)
    
    # Check if UI received notification
    time.sleep(0.5)
    check_notifications()

    # STEP 4: Memory Recall (Validation of Continuity)
    print("\n[Step 4] Final Continuity Check (Asking about previous context)...")
    # We ask a question that requires remembering Step 1 (N3) and Step 2 (~koto ga aru)
    final_query = "What did we work on today, and based on my preferences, what's next?"
    print(f"   [User]: {final_query}")
    
    # Clear local context to force DB retrieval
    final_res = study_agent.handle_interaction({"user_id": user_id, "message": final_query})
    print(f"   [Hanachan Response]: {final_res['response']}")
    
    # STEP 5: Verification
    print("\n" + "-"*40)
    print("📊 SIMULATION VERIFICATION")
    
    # Retrieve all episodic memories to verify storage
    all_history = memory.retrieve_episodic_memory(user_id, "N3 syntax", n_results=10)
    print(f"   - Total Interaction Episodes Recorded: {len(all_history)}")
    
    has_onboarding = any("pref" in f["fact"].lower() for f in memory.retrieve_semantic_facts(user_id))
    has_grammar = any("koto ga aru" in h["content"] for h in all_history)
    
    if has_onboarding and has_grammar:
        print("\n✅ PASSED: System successfully coordinated over a long multi-feature session.")
    else:
        print("\n❌ FAILED: Information was lost during coordination.")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_long_session_simulation()
