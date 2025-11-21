#!/usr/bin/env bash
# Updated script to start services in parallel with exception handling
set -e # Exit immediately if a command exits with a non-zero status

PROJECT_ROOT="$(pwd)"
LOG_ROOT="$PROJECT_ROOT/logs"
DB_ROOT="$HOME/hanabira_data/mongo-main"
MONGO_LOG="$LOG_ROOT/mongo/mongo.log"

# Array to hold background process IDs for cleanup
PIDS=()

# --- Utility Functions ---

# Timestamp logger
log() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_ROOT/startup.log"
}

# General error handler for service startup
# Usage: on_error "Service Name" $?
on_error() {
    local service_name="$1"
    local exit_code="$2"
    if [ "$exit_code" -ne 0 ]; then
        log "❌ ERROR: Failed to start $service_name (Exit code: $exit_code). Check logs for details."
        return 1 # Indicate failure
    fi
    return 0 # Indicate success
}

# Cleanup function to kill all background jobs upon script exit/interrupt
cleanup() {
    log "Initiating cleanup..."
    # Kill services started in the background
    if [ ${#PIDS[@]} -gt 0 ]; then
        log "Killing background processes: ${PIDS[*]}"
        kill -9 "${PIDS[@]}" 2>/dev/null || true
    fi
    # Kill services by port (as a fallback)
    log "Killing services by port: 8000, 5100, 5200"
    kill -9 $(lsof -t -i:8000 -i:5100 -i:5200 2>/dev/null) || true
    # Kill MongoDB (only if we started it, but safe to killall)
    # log "Attempting to stop mongod..."
    # killall mongod 2>/dev/null || true
    log "Cleanup complete."
}

# Trap signals for robust cleanup
trap cleanup EXIT INT TERM

# --- Setup Directories ---
mkdir -p "$LOG_ROOT/mongo" "$DB_ROOT"
mkdir -p "$LOG_ROOT/express-db" "$LOG_ROOT/flask-dynamic-db" "$LOG_ROOT/dictionary-db"

# --- Main Logic ---
log "=== Initializing Startup Script ==="

# ======================================================================
# 1. Start ONE MongoDB Instance for ALL services
# (Must be sequential as other services depend on it)
# ======================================================================
log "=== Starting main MongoDB instance ==="

if pgrep mongod > /dev/null; then
    log "MongoDB already running. Skipping start."
else
    mongod --dbpath "$DB_ROOT" \
           --bind_ip_all \
           --fork \
           --logpath "$MONGO_LOG"
    if ! on_error "MongoDB" $?; then
        exit 1 # Fatal: cannot proceed without MongoDB
    fi
    log "MongoDB started (dbpath: $DB_ROOT)"
fi

# ======================================================================
# 2. Start Services in Parallel
# ======================================================================
log "=== Starting all web services in parallel ==="

# --- Start EXPRESS-DB (port 8000) ---
(
    log "Starting express-db (port 8000) in background..."
    cd backend/express || exit 1

    # Seeding
    log "Seeding express-db..."
    ./seed_db_wrapper.sh > "$LOG_ROOT/express-db/seed.log" 2>&1 || true

    # Launch API
    PORT=8000 node my_server.js > "$LOG_ROOT/express-db/express_8000.log" 2>&1
    on_error "express-db" $?
) &
PIDS+=($!) # Store the process ID of the subshell

# --- Start FLASK-DYNAMIC-DB (port 5100) ---
(
    log "Starting flask-dynamic-db (port 5100) in background..."
    cd backend/flask || exit 1
    
    # Check for venv activation/existence and activate
    if [ -f .venv/bin/activate ]; then
        . .venv/bin/activate
    else
        log "WARNING: Flask virtual environment not found. Launching without activation."
    fi

    # Launch API
    ./.venv/bin/gunicorn -w 4 -b 0.0.0.0:5100 server:app \
    > "$LOG_ROOT/flask-dynamic-db/flask_5100.log" 2>&1
    on_error "flask-dynamic-db" $?

    # Deactivate venv if it was activated
    [ -n "$VIRTUAL_ENV" ] && deactivate
) &
PIDS+=($!)

# --- Start DICTIONARY-DB (port 5200) ---
(
    log "Starting dictionary-db (port 5200) in background..."
    cd backend/dictionary || exit 1

    # Seeding
    log "Seeding dictionary (JMDict)..."
    node seed_jmdict_data.js > "$LOG_ROOT/dictionary-db/dict_seed.log" 2>&1 || true

    # Launch API
    PORT=5200 node main_server.js \
    > "$LOG_ROOT/dictionary-db/dict_5200.log" 2>&1
    on_error "dictionary-db" $?
) &
PIDS+=($!)

# Wait for all background services to finish their startup logs/processes
log "Waiting for all parallel services to initialize..."
wait

log "All parallel startup processes completed."

# ======================================================================
# Summary
# ======================================================================
echo ""
echo "🎉 All services *attempted* to start with ONE MongoDB instance!"
echo "------------------------------------------------"
echo " express-db:        http://localhost:8000"
echo " flask-dynamic-db:  http://localhost:5100"
echo " dictionary-db:     http://localhost:5200"
echo "------------------------------------------------"
echo "MongoDB dbpath: $DB_ROOT"
echo "All logs stored in: logs/"
echo ""
echo "To stop everything, the 'trap cleanup' mechanism should handle it."
echo "Alternatively, manually run:"
echo "  kill -9 \$(lsof -t -i:8000 -i:5100 -i:5200 2>/dev/null)"
echo "  killall mongod"
echo ""

# The cleanup function is automatically called now due to 'trap cleanup EXIT'
#  kill -9 $(lsof -t -i:8000 -i:5100 -i:5200 2>/dev/null)
# sudo kill -9 $(pgrep mongod)
