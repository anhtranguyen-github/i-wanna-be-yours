import redis
import json
import os

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

class NotificationService:
    def __init__(self):
        self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

    def send_notification(self, user_id: str, message: str, type: str = "info"):
        """
        Publishes a notification to the user's Redis channel.
        """
        channel = f"notifications:{user_id}"
        payload = {
            "type": type,
            "message": message,
            "timestamp": "now" # In real app use iso format
        }
        # Publish
        count = self.redis.publish(channel, json.dumps(payload))
        return count > 0 # Returns True if clients received it (subscribed)

# Tool wrapper (if needed for LangChain)
def send_notification_tool(user_id: str, message: str):
    svc = NotificationService()
    svc.send_notification(user_id, message)
    return "Notification sent."
