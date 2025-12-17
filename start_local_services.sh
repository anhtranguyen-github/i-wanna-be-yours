#!/usr/bin/env bash
# Updated script to start all backend and frontend services with robust exception handling
# Usage: ./start_local_services.sh [stop|close|down]
set -e # Exit immediately if a command exits with a non-zero status

PROJECT_ROOT="$(pwd)"
LOG_ROOT="$PROJECT_ROOT/logs"
DB_ROOT="$HOME/hanachan_data/mongo-main"
MONGO_LOG="$LOG_ROOT/mongo/mongo.log"

# Array to hold background process IDs for cleanup
PIDS=()
DB_PIDS=()

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

# Function to check if a port is in use and free it
check_and_free_port() {
    local port=$1
    local name=$2
    
    # Find all PIDs using the port (comma separated)
    local pids=$(lsof -t -i:$port)
    
    if [ -n "$pids" ]; then
        log "⚠️  Port $port ($name) is in use by PID(s) $pids. Killing them..."
        # Try graceful kill first
        kill $pids 2>/dev/null
        sleep 1
        
        # Check if still alive
        if lsof -t -i:$port >/dev/null; then
             log "⚠️  Port $port ($name) still active. Force killing..."
             kill -9 $(lsof -t -i:$port) 2>/dev/null
        fi
        
        log "✅ Port $port freed."
    else
        log "✅ Port $port is free."
    fi
}

# Cleanup function to kill all background jobs upon script exit/interrupt
# Cleanup function to kill all background jobs upon script exit/interrupt
cleanup() {
    log "Initiating cleanup..."
    local stopped_count=0

    # 1. Kill by PIDs (Background Subshells)
    if [ ${#PIDS[@]} -gt 0 ]; then
        log "Killing ${#PIDS[@]} background subshells..."
        for pid in "${PIDS[@]}"; do
            kill -TERM "$pid" 2>/dev/null || true
        done
        wait 2>/dev/null || true
    fi
    
    # 2. Kill by Process Names (Robust)
    log "Ensuring all child processes are dead..."
    pkill -f "next-server" && log "  🛑 Killed next-server" && stopped_count=$((stopped_count + 1)) || true
    pkill -f "flask/bin/gunicorn" && log "  🛑 Killed gunicorn" && stopped_count=$((stopped_count + 1)) || true
    pkill -f "python3 app.py" && log "  🛑 Killed python3 app" && stopped_count=$((stopped_count + 1)) || true
    # Be careful with 'node' as it might be used by other system things, but for this dev env it's likely ours
    # We target the specific server scripts to be safer if possible, or fall back to ports
    pkill -f "express-db/my_server.js" && log "  🛑 Killed express server" || true
    pkill -f "dictionary-db/main_server.js" && log "  🛑 Killed dictionary server" || true

    # 3. Fallback: Kill by Ports
    log "Checking for leftover services on ports..."
    pids=$(lsof -t -i:3000 -i:8000 -i:5100 -i:5200 -i:5400 2>/dev/null || true)
    if [ -n "$pids" ]; then
        for pid in $pids; do
            log "  🛑 Killing leftover process on port PID: $pid"
            kill -9 "$pid" 2>/dev/null || true
            stopped_count=$((stopped_count + 1))
        done
    else
        log "✅ No leftover services found on ports."
    fi
    
    log "Cleanup complete."
}

# Full shutdown function
shutdown_all() {
    log "🛑 Shutting down ALL services..."
    
    # 1. Kill processes and ports
    cleanup
    
    # 2. Stop Infrastructure in Parallel
    log "🛑 Stopping infrastructure services in parallel..."
    
    # Stop MongoDB
    (
        if pgrep mongod > /dev/null; then
            log "🛑 Stopping MongoDB..."
            killall mongod 2>/dev/null || true
            log "✅ MongoDB stopped."
        else
            log "✅ MongoDB is not running."
        fi
    ) &
    
    # MySQL Removed

    # Stop Ollama
    (
        log "🛑 Stopping Ollama..."
        if docker stop ollama_fixed >/dev/null 2>&1; then
            log "✅ Ollama stopped."
        else
            log "⚠️  Failed to stop Ollama (or it wasn't running)."
        fi
    ) &
    
    wait
    
    log "👋 All services have been stopped."
    exit 0
}

# Trap signals for robust cleanup
trap cleanup EXIT INT TERM

# --- Setup Directories ---
mkdir -p "$LOG_ROOT/mongo" "$DB_ROOT"
mkdir -p "$LOG_ROOT/express-db" "$LOG_ROOT/flask-dynamic-db" "$LOG_ROOT/dictionary-db" "$LOG_ROOT/hanachan" "$LOG_ROOT/frontend"

# --- Argument Parsing ---
SHOULD_SEED=false
MODE="dev"

for arg in "$@"; do
    if [[ "$arg" == "stop" || "$arg" == "close" || "$arg" == "down" ]]; then
        shutdown_all
    fi
    if [[ "$arg" == "seed" || "$arg" == "--seed" ]]; then
        SHOULD_SEED=true
    fi
    if [[ "$arg" == "prod" || "$arg" == "--prod" ]]; then
        MODE="prod"
    fi
done

# --- Main Logic ---
log "=== Initializing Startup Script ==="

# ======================================================================
# 0. Pre-flight Checks: Ports
# ======================================================================
log "=== Checking Ports (Parallel) ==="
check_and_free_port 3000 "frontend-next" &
check_and_free_port 5100 "flask-dynamic-db" &
check_and_free_port 5200 "dictionary-db" &
check_and_free_port 8000 "express-db" &
check_and_free_port 5400 "hanachan" &
wait
log "✅ All ports checked/freed."

# ======================================================================
# 1. Database Initialization (Mongo & MySQL)
# ======================================================================
# ======================================================================
# 1. Database & Infrastructure Initialization (Parallel)
# ======================================================================
log "=== Initializing Databases & Infrastructure in Parallel ==="

# --- MongoDB ---
(
    if pgrep mongod > /dev/null; then
        log "✅ MongoDB is already running."
    else
        log "🚀 Starting MongoDB..."
        mongod --dbpath "$DB_ROOT" \
               --bind_ip_all \
               --fork \
               --logpath "$MONGO_LOG" >/dev/null 2>&1
        if ! on_error "MongoDB" $?; then
            exit 1
        fi
        log "✅ MongoDB started."
    fi
) &
DB_PIDS+=($!)

    # MySQL Removed

# --- Ollama ---
(
    if docker ps --format '{{.Names}}' | grep -q "^ollama_fixed$"; then
        log "✅ Ollama is already running."
    else
        log "🚀 Starting Ollama..."
        if docker start ollama_fixed >/dev/null 2>&1; then
            log "✅ Ollama started."
        else
            log "❌ Failed to start Ollama."
            exit 1
        fi
    fi
) &
DB_PIDS+=($!)

# Wait for all DB/Infra tasks to complete
for pid in "${DB_PIDS[@]}"; do
    wait "$pid"
    if [ $? -ne 0 ]; then
        log "❌ A database/infrastructure service failed to start. Aborting."
        exit 1
    fi
done
log "✅ All databases and infrastructure services are ready."

# ======================================================================
# 2. Start Services in Parallel
# ======================================================================
log "=== Starting all services in parallel ==="

# --- Start EXPRESS-DB (port 8000) ---
(
    log "🚀 Starting express-db (port 8000)..."
    cd backend/express || exit 1
    
    # Seeding
    if [ "$SHOULD_SEED" = true ]; then
        log "🌱 Seeding express-db..."
        ./seed_db_wrapper.sh > "$LOG_ROOT/express-db/seed.log" 2>&1 || true
    else
        log "ℹ️  Skipping express-db seeding (use 'seed' arg to enable)"
    fi

    # Launch API
    PORT=8000 node my_server.js > "$LOG_ROOT/express-db/express_8000.log" 2>&1
    on_error "express-db" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started express-db (PID: $pid)"

# --- Start FLASK-DYNAMIC-DB (port 5100) ---
(
    log "🚀 Starting flask-dynamic-db (port 5100)..."
    cd backend/flask || exit 1
    
    if [ -f .venv/bin/activate ]; then
        . .venv/bin/activate
    else
        log "⚠️  Flask venv not found. Running without activation."
    fi

    ./.venv/bin/gunicorn -w 4 -b 0.0.0.0:5100 server:app \
    > "$LOG_ROOT/flask-dynamic-db/flask_5100.log" 2>&1
    on_error "flask-dynamic-db" $?
    
    [ -n "$VIRTUAL_ENV" ] && deactivate
) &
pid=$!
PIDS+=($pid)
log "✅ Started flask-dynamic-db (PID: $pid)"

# --- Start DICTIONARY-DB (port 5200) ---
(
    log "🚀 Starting dictionary-db (port 5200)..."
    cd backend/dictionary || exit 1

    if [ "$SHOULD_SEED" = true ]; then
        log "🌱 Seeding dictionary..."
        node seed_jmdict_data.js > "$LOG_ROOT/dictionary-db/dict_seed.log" 2>&1 || true
    else
        log "ℹ️  Skipping dictionary seeding (use 'seed' arg to enable)"
    fi

    PORT=5200 node main_server.js \
    > "$LOG_ROOT/dictionary-db/dict_5200.log" 2>&1
    on_error "dictionary-db" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started dictionary-db (PID: $pid)"

# --- Start HANACHAN (port 5400) ---
(
    log "🚀 Starting hanachan (port 5400)..."
    cd backend/hanachan || exit 1
    
    if [ -f .venv/bin/activate ]; then
        . .venv/bin/activate
    fi

    # Assuming app.py is the entry point and it uses FLASK_PORT env var
    export FLASK_PORT=5400
    python3 app.py > "$LOG_ROOT/hanachan/hanachan_5400.log" 2>&1
    on_error "hanachan" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started hanachan (PID: $pid)"

# --- Start FRONTEND-NEXT (port 3000) ---
(
    log "🚀 Starting frontend-next (port 3000)..."
    cd frontend-next || exit 1
    
    if [ "$MODE" == "prod" ]; then
        log "🚀 Starting frontend-next (OPTIMIZED PRODUCTION)..."
        npm start > "$LOG_ROOT/frontend/next_3000.log" 2>&1
    else
        npm run dev > "$LOG_ROOT/frontend/next_3000.log" 2>&1
    fi
    on_error "frontend-next" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started frontend-next (PID: $pid)"

# Wait for all background services
log "⏳ Waiting for services to initialize..."
log "🎉 Successfully started ${#PIDS[@]} services in the background."
wait
