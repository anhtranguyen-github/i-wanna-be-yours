import time
import threading
import uuid
import statistics
from concurrent.futures import ThreadPoolExecutor
from backend.flask.services.signal_producer import SignalProducer
from backend.hanachan.services.policy_engine import SignalPolicyEngine
from backend.hanachan.schemas.signal import SignalPriority

# Configuration
NUM_USERS = 50
SIGNALS_PER_USER = 20
THREADS = 10

def run_stress_test():
    print(f"\n[PHASE 4] Starting Stress Test: {NUM_USERS} Users, {SIGNALS_PER_USER} Signals/User...")
    
    producer = SignalProducer() # Redis localhost
    # Note: determining "Success" is tricky without a consumer running.
    # For this script, we assume the "Consumer Worker" is running separately OR we verify Queue Depth.
    # Let's verify Queue Depth as a metric of "Ingestion Speed".
    
    start_time = time.time()
    
    def simulate_user(user_idx):
        user_id = f"stress_user_{user_idx}"
        for i in range(SIGNALS_PER_USER):
            # Mix priorities
            prio = "P2"
            if i % 10 == 0: prio = "P1" # Occasional high priority
            
            producer.emit(
                type="test.stress_event", 
                priority=prio, 
                user_id=user_id,
                payload={"iter": i}
            )
            # tiny sleep to prevent absolute flooding locally
            time.sleep(0.001) 

    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        futures = [executor.submit(simulate_user, i) for i in range(NUM_USERS)]
        for f in futures:
            f.result()
            
    end_time = time.time()
    duration = end_time - start_time
    total_signals = NUM_USERS * SIGNALS_PER_USER
    throughput = total_signals / duration
    
    print(f"\n[RESULTS] Stress Test Completed")
    print(f"Total Signals Emitted: {total_signals}")
    print(f"Duration: {duration:.2f}s")
    print(f"Throughput: {throughput:.2f} signals/sec")
    
    # Ideally check Redis queue length here
    import redis
    r = redis.Redis()
    q_len = r.llen("hanachan_signals")
    print(f"Final Queue Depth: {q_len}")
    
    if throughput > 100:
        print("✅ PASS: Throughput > 100 sig/sec")
    else:
        print("⚠️ WARN: Low throughput")

if __name__ == "__main__":
    run_stress_test()
