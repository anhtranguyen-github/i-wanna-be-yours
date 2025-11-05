#!/usr/bin/env bash
set -e

echo "=== Starting MongoDB ==="
mongod --dbpath /data/db --bind_ip_all --fork --logpath /var/log/mongodb/mongod.log
sleep 3
echo "MongoDB running ✅"

echo "=== Starting Flask backend (port 5100) ==="
cd backend/flask
. .venv/bin/activate
./.venv/bin/gunicorn -w 4 -b 0.0.0.0:5100 server:app > flask.log 2>&1 &
deactivate
cd ../../

echo "=== Starting Dictionary backend (port 5200) ==="
cd backend/dictionary
node main_server.js > dictionary_5200.log 2>&1 &
cd ../../

echo "=== Starting Dictionary backend (port 8000) ==="
cd backend/dictionary
node main_server.js > dictionary_8000.log 2>&1 &
cd ../../

echo ""
echo "🎉 All services started successfully!"
echo "---------------------------------------"
echo " Flask API (Python):     http://localhost:5100"
echo " Dictionary API #1:      http://localhost:5200"
echo " Dictionary API #2:      http://localhost:8000"
echo "---------------------------------------"
echo "Logs: backend/*/*.log"
echo ""
echo "Stop all with:  pkill -f gunicorn; pkill -f node; pkill -f mongod"
