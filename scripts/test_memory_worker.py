import os
import sys
import redis
from rq import Queue
import uuid

# Add paths
sys.path.append(os.path.join(os.getcwd(), 'backend', 'hanachan'))

def test_worker_integration():
    redis_url = "redis://localhost:6379/0"
    conn = redis.from_url(redis_url)
    q = Queue('default', connection=conn)

    user_id = "test-user-selective-memory"
    session_id = str(uuid.uuid4())

    print(f"🚀 Enqueuing test interactions for User: {user_id}, Session: {session_id}")

    interactions = [
        ("Hello Hanachan!", "Hi there! Ready to learn?"),
        ("I am a software engineer interested in game localization.", "That is cool! Game localization is a great way to practice language."),
        ("Let's pretend you are a samurai from the Edo period.", "Duly noted. I shall speak with the honor of a warrior of the Shogun."),
        ("I actually hate learning Kanji with mnemonics, I prefer rote writing.", "I understand. We will focus on stroke order and repetition then.")
    ]

    from tasks.memory import process_interaction

    for user_msg, agent_resp in interactions:
        print(f"📝 Enqueuing: {user_msg[:30]}...")
        job = q.enqueue(
            process_interaction,
            session_id=session_id,
            user_id=user_id,
            user_message=user_msg,
            agent_response=agent_resp
        )
        print(f"   Job ID: {job.id}")

    print("\n✅ All jobs enqueued. Check logs/hanachan/worker.log for GATEKEEPER output.")

if __name__ == "__main__":
    test_worker_integration()
