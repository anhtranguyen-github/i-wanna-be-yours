import redis
import json
import time
import os
from typing import Optional
from backend.hanachan.schemas.signal import Signal
from backend.hanachan.services.policy_engine import SignalPolicyEngine

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
SIGNAL_QUEUE_NAME = "hanachan_signals"

class SignalConsumer:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        if redis_client:
            self.redis = redis_client
        else:
            self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
        
        self.policy = SignalPolicyEngine()
        self.running = False

    def process_message(self, message_json: str) -> str:
        """
        Processes a single JSON message. Returns status string.
        """
        try:
            data = json.loads(message_json)
            # Parse into Pydantic model (Validated)
            signal = Signal(**data)
            
            # Policy Check
            if self.policy.evaluate(signal):
                self._dispatch_to_agent(signal)
                return "PROCESSED"
            else:
                return "DROPPED_BY_POLICY"
                
        except Exception as e:
            print(f"[SignalConsumer] Error processing message: {e}")
            return "ERROR"

    def _dispatch_to_agent(self, signal: Signal):
        """
        Wake up the Agent Workflow.
        """
        print(f"!!! WAKING AGENT !!! Signal: {signal.type} | Priority: {signal.priority} | Trace: {signal.trace_id}")
        # Here we would call langgraph_workflow.invoke(signal)
    
    def run(self):
        """
        Main loop to drain the queue.
        """
        print(f"[SignalConsumer] Listening on {SIGNAL_QUEUE_NAME}...")
        self.running = True
        while self.running:
            try:
                # Blocking pop with timeout
                result = self.redis.blpop(SIGNAL_QUEUE_NAME, timeout=5)
                if result:
                    _, message = result
                    status = self.process_message(message)
                    print(f"[SignalConsumer] {status}")
            except Exception as e:
                print(f"[SignalConsumer] Loop error: {e}")
                time.sleep(1)

if __name__ == "__main__":
    consumer = SignalConsumer()
    consumer.run()
