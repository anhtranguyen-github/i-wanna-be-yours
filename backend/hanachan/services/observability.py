import os
from pymongo import MongoClient
from datetime import datetime, timezone
from typing import Dict, Any, List

MONGO_URI = os.getenv("MONGO_URI_FLASK", "mongodb://localhost:27017/")
DB_NAME = "flaskStudyPlanDB"

class ObservabilityService:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[DB_NAME]
        self.traces_col = self.db["hanachan_traces"]
        self.traces_col.create_index([("trace_id", 1)])
        self.traces_col.create_index([("user_id", 1)])
        self.traces_col.create_index([("timestamp", -1)])

    def log_event(self, trace_id: str, user_id: str, step: str, status: str, metadata: Dict[str, Any] = None):
        """
        Logs a step in the intelligent workflow.
        Steps: 'signal_produced', 'policy_evaluated', 'agent_invoked', 'response_delivered'
        """
        event = {
            "trace_id": trace_id,
            "user_id": user_id,
            "step": step,
            "status": status,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc)
        }
        self.traces_col.insert_one(event)

    def get_trace_history(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """
        Retrieves recent traces with their full history, optionally filtered by user.
        """
        match_stage = {"$match": {"user_id": user_id}} if user_id else {"$match": {}}
        
        pipeline = [
            match_stage,
            {"$sort": {"timestamp": -1}},
            {"$group": {
                "_id": "$trace_id",
                "user_id": {"$first": "$user_id"},
                "events": {"$push": "$$ROOT"},
                "latest_timestamp": {"$first": "$timestamp"}
            }},
            {"$sort": {"latest_timestamp": -1}},
            {"$limit": limit}
        ]
        results = list(self.traces_col.aggregate(pipeline))
        
        # Format for UI
        formatted = []
        for res in results:
            formatted.append({
                "trace_id": res["_id"],
                "user_id": res.get("user_id", "unknown"),
                "events": sorted(res["events"], key=lambda x: x["timestamp"]),
                "last_active": res["latest_timestamp"].isoformat()
            })
        return formatted

# Global Instance
obs_service = ObservabilityService()

import atexit
@atexit.register
def close_mongo_connection():
    try:
        obs_service.client.close()
    except:
        pass
