import redis
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import os

# Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
SIGNAL_QUEUE_NAME = "hanachan_signals"

class SignalProducer:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        if redis_client:
            self.redis = redis_client
        else:
            self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

    def emit(self, 
             type: str, 
             priority: str, 
             user_id: str, 
             payload: Dict[str, Any] = None, 
             trace_id: Optional[str] = None) -> str:
        
        if payload is None:
            payload = {}
            
        if trace_id is None:
            trace_id = str(uuid.uuid4())

        signal_packet = {
            "id": str(uuid.uuid4()),
            "trace_id": trace_id,
            "type": type,
            "priority": priority,
            "user_id": user_id,
            "payload": payload,
            "timestamp": datetime.now().isoformat()
        }

        # Push to the queue
        try:
            self.redis.rpush(SIGNAL_QUEUE_NAME, json.dumps(signal_packet))
            print(f"[SignalProducer] Emitted {type} for {user_id} (Trace: {trace_id})")
            
            # Persist Trace
            try:
                from backend.hanachan.services.observability import obs_service
                obs_service.log_event(trace_id, user_id, "signal_produced", "SUCCESS", {
                    "type": type,
                    "priority": priority
                })
            except Exception as e:
                print(f"[SignalProducer] Trace logging error: {e}")
                
            return trace_id
        except Exception as e:
            print(f"[SignalProducer] Error emitting signal: {e}")
            return None
