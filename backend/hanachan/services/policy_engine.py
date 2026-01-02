import time
from typing import Dict, Optional
from backend.hanachan.schemas.signal import Signal, SignalPriority

class SignalPolicyEngine:
    def __init__(self, dedup_window_seconds: int = 300):
        # simple in-memory cache for deduplication: { "user_id:signal_type": timestamp }
        # In production this should be Redis
        self._dedup_cache: Dict[str, float] = {} 
        self._dedup_window_seconds = dedup_window_seconds

    def evaluate(self, signal: Signal) -> bool:
        """
        Returns True if the signal should be processed (ACCEPTED),
        False if it should be dropped (REJECTED).
        """
        # 1. Loop Guard: If trace info shows agent loop (omitted for now)
        
        # 2. Priority Check - P3 Background signals dropped for Agent execution
        if signal.priority == SignalPriority.BACKGROUND:
            # Only for analytics, not agent acting
            return False

        # 3. Deduplication (except for P0/Critical)
        if signal.priority != SignalPriority.CRITICAL:
            if self._is_duplicate(signal):
                return False

        return True

    def _is_duplicate(self, signal: Signal) -> bool:
        # Key based on user and signal type
        key = f"{signal.user_id}:{signal.type}"
        now = time.time()
        
        last_seen = self._dedup_cache.get(key)
        if last_seen and (now - last_seen < self._dedup_window_seconds):
            return True
        
        self._dedup_cache[key] = now
        return False
