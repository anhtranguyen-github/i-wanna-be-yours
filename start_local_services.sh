#!/usr/bin/env bash
set -e

# === LOG FOLDERS ===
LOG_ROOT="logs"
mkdir -p $LOG_ROOT/express-db
mkdir -p $LOG_ROOT/flask-dynamic-db
mkdir -p $LOG_ROOT/dictionary-db

STARTUP_LOG="$LOG_ROOT/startup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$STARTUP_LOG"
}

log "==============================="
log " STARTUP RUN"
log "==============================="


# ================================================
# EXPRESS-DB (Node) → port 8000
# ================================================
log "=== Starting express-db (port 8000) ==="

cd backend/express
PORT=8000 node my_server.js \
    > "../../$LOG_ROOT/express-db/express-db_8000.log" 2>&1 &
cd ../../

log "express-db started (log: $LOG_ROOT/express-db/express-db_8000.log)"


# ================================================
# FLASK-DYNAMIC-DB → port 5100
# ================================================
log "=== Starting flask-dynamic-db (port 5100) ==="

cd backend/flask
. .venv/bin/activate

./.venv/bin/gunicorn -w 4 -b 0.0.0.0:5100 server:app \
    > "../../$LOG_ROOT/flask-dynamic-db/flask-dynamic-db_5100.log" 2>&1 &

deactivate
cd ../../

log "flask-dynamic-db started (log: $LOG_ROOT/flask-dynamic-db/flask-dynamic-db_5100.log)"


# ================================================
# DICTIONARY-DB (Node) → port 5200
# ================================================
log "=== Starting dictionary-db (port 5200) ==="

cd backend/dictionary
PORT=5200 node main_server.js \
    > "../../$LOG_ROOT/dictionary-db/dictionary-db_5200.log" 2>&1 &
cd ../../

log "dictionary-db started (log: $LOG_ROOT/dictionary-db/dictionary-db_5200.log)"


echo ""
echo "🎉 All services started successfully!"
echo "---------------------------------------"
echo " express-db:        http://localhost:8000"
echo " flask-dynamic-db:  http://localhost:5100"
echo " dictionary-db:     http://localhost:5200"
echo "---------------------------------------"
echo "All logs stored in: logs/"

echo ""
echo "Stop all with:"
echo "  kill -9 \$(lsof -t -i:8000 -i:5100 -i:5200 2>/dev/null)"
