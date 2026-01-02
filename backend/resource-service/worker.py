import os
import logging
from redis import Redis
from rq import Worker, Queue
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s : %(message)s",
)
logger = logging.getLogger("nrs.worker")

listen = ["nrs_ingestion"]
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

conn = Redis.from_url(redis_url)

if __name__ == "__main__":
    queues = [Queue(name, connection=conn) for name in listen]
    worker = Worker(queues, connection=conn)
    logger.info(f"👷 NRS Worker started, listening on {listen}")
    worker.work()
