#!/bin/bash
# run_worker.sh
# Entrypoint for RQ Worker

echo "Starting RQ Worker..."
# Wait for Redis
# (Simple wait, for robustness we could use a wait-for-it script)
sleep 5

# Run worker
# Validates connection to Redis and listens on 'default' queue
rq worker default --url $REDIS_URL
