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
is_safe_to_kill() {
    local pid=$1
    local cmd=$(ps -p "$pid" -o args= 2>/dev/null)
    if [[ "$cmd" == *".vscode-server"* ]]; then
        return 1
    fi
    return 0
}

check_and_free_port() {
    local port=$1
    local name=$2
    
    # Find all PIDs using the port
    local pids=$(lsof -t -i:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        log "⚠️  Port $port ($name) is in use by PID(s) $pids. Checking safety..."
        
        for pid in $pids; do
            if is_safe_to_kill "$pid"; then
                log "  Killing PID $pid..."
                kill $pid 2>/dev/null || true
            else
                log "  ⚠️  Skipping PID $pid (IDE process) on port $port."
            fi
        done
        
        sleep 1
        
        # Check if still alive, then force kill
        local still_alive=$(lsof -t -i:$port 2>/dev/null)
        if [ -n "$still_alive" ]; then
             for pid in $still_alive; do
                if is_safe_to_kill "$pid"; then
                    log "  Force killing PID $pid..."
                    kill -9 $pid 2>/dev/null || true
                else
                    log "  ⚠️  Skipping force kill for PID $pid (IDE process)."
                fi
             done
        fi
        
        # Final check (only warn if we failed to kill a SAFE process, but hard to distinguish here, just warn)
        if lsof -t -i:$port >/dev/null; then
             # Check if the remaining process is the unsafe one
             local remaining=$(lsof -t -i:$port)
             local all_safe=true
             for pid in $remaining; do
                 if is_safe_to_kill "$pid"; then
                     all_safe=false
                 fi
             done
             
             if [ "$all_safe" = true ]; then
                 log "ℹ️ Port $port is held by IDE processes (safe to ignore)."
             else
                 log "❌ Failed to free port $port. Manual intervention required."
                 return 1
             fi
        fi
        
        log "✅ Port check complete for $port."
    else
        log "✅ Port $port is free."
    fi
}

# Aggressively kill known service markers
# Aggressively kill known service markers
kill_existing_processes() {
    log "🧹 Aggressively cleaning up existing processes and services..."
    
    # 1. Stop Docker Infrastructure (Cleanest way)
    log "  Stopping Docker infrastructure..."
    docker stop ollama_fixed >/dev/null 2>&1 || true
    docker compose stop neo4j qdrant redis flask-dynamic-db express-db dictionary-db study-plan-service hanachan >/dev/null 2>&1 || true
    
    # 2. Kill by Name
    log "  Killing processes by name..."
    local patterns=(
        "next-server"
        "flask/bin/gunicorn"
        "python3 app.py"
        "express-db/my_server.js"
        "dictionary-db/main_server.js"
        "hanachan/app.py"
        "node main_server.js"
        "mongod"
        "rq worker"
        "gunicorn"
        "uvicorn"
    )
    
    for pattern in "${patterns[@]}"; do
        pkill -9 -f "$pattern" 2>/dev/null || true
    done

    # Remove stale mongo lock if present after killing
    if [ -f "$DB_ROOT/mongod.lock" ]; then
         log "  🗑️ Removing stale mongod lock file..."
         rm -f "$DB_ROOT/mongod.lock"
    fi
    
    # 3. Kill by Ports (Linux + Windows/WSL)
    local ports=(3000 5100 5200 5400 5500 8000 7474 7687 6333 6379 27017)
    for port in "${ports[@]}"; do
        # A. Linux Check
        local pids_on_port=$(lsof -t -i:$port 2>/dev/null)
        if [ -n "$pids_on_port" ]; then
            log "  Checking port $port (Linux)..."
            for pid in $pids_on_port; do
                if is_safe_to_kill "$pid"; then
                    log "    Force killing PID $pid..."
                    kill -9 "$pid" 2>/dev/null || true
                else
                    log "    ⚠️  Skipping PID $pid (IDE process) on port $port."
                fi
            done
        fi
        

    done
    
    log "✅ Cleanup phase complete."
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
    pkill -f "rq worker" && log "  🛑 Killed rq worker" || true
    pkill -f "uvicorn" && log "  🛑 Killed uvicorn" || true

    # 3. Fallback: Kill by Ports
    log "Checking for leftover services on ports..."
    pids=$(lsof -t -i:3000 -i:8000 -i:5100 -i:5200 -i:5400 -i:5500 -i:7474 -i:7687 -i:6333 2>/dev/null || true)
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

    # Stop Neo4j
    (
        log "🛑 Stopping Neo4j..."
        docker compose stop neo4j >/dev/null 2>&1 && log "✅ Neo4j stopped." || true
    ) &

    # Stop Qdrant
    (
        log "🛑 Stopping Qdrant..."
        docker compose stop qdrant >/dev/null 2>&1 && log "✅ Qdrant stopped." || true
    ) &

    # Stop Redis
    (
        log "🛑 Stopping Redis..."
        docker compose stop redis >/dev/null 2>&1 && log "✅ Redis stopped." || true
    ) &
    
    wait
    
    log "👋 All services have been stopped."
    exit 0
}

# Trap signals for robust cleanup
trap cleanup EXIT INT TERM

# --- Setup Directories ---
mkdir -p "$LOG_ROOT/mongo" "$DB_ROOT"
mkdir -p "$LOG_ROOT/express-db" "$LOG_ROOT/flask-dynamic-db" "$LOG_ROOT/study-plan-service" "$LOG_ROOT/dictionary-db" "$LOG_ROOT/hanachan" "$LOG_ROOT/frontend"

# --- Argument Parsing ---
SHOULD_SEED=false
SHOULD_REBUILD=false
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
    if [[ "$arg" == "rebuild" || "$arg" == "--rebuild" ]]; then
        SHOULD_REBUILD=true
    fi
done

# --- Main Logic ---
log "=== Initializing Startup Script ==="

# Load JWT_SECRET from .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep 'JWT_SECRET' | xargs)
fi

# ======================================================================
# 0. Clean Slate
# ======================================================================
kill_existing_processes
# Double check ports just in case
log "=== Verifying Ports are Free ==="
check_and_free_port 3000 "frontend-next" &
check_and_free_port 5100 "flask-dynamic-db" &
check_and_free_port 5200 "dictionary-python" &
check_and_free_port 5500 "study-plan-service" &
check_and_free_port 8000 "express-db" &
check_and_free_port 5400 "hanachan" &
check_and_free_port 7474 "neo4j-http" &
check_and_free_port 7687 "neo4j-bolt" &
check_and_free_port 6333 "qdrant" &
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
    if lsof -i:27017 > /dev/null; then
        log "✅ MongoDB is already running on port 27017."
    else
        # Ensure no zombie mongod is confusing things
        pkill mongod 2>/dev/null || true
        
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

# --- Neo4j ---
(
    if docker ps --format '{{.Names}}' | grep -q "neo4j"; then
        log "✅ Neo4j is already running."
    else
        log "🚀 Starting Neo4j..."
        docker compose up -d neo4j >/dev/null 2>&1 && log "✅ Neo4j started." || { log "❌ Failed to start Neo4j"; exit 1; }
    fi
) &
DB_PIDS+=($!)

# --- Qdrant ---
(
    if docker ps --format '{{.Names}}' | grep -q "qdrant"; then
        log "✅ Qdrant is already running."
    else
        log "🚀 Starting Qdrant..."
        docker compose up -d qdrant >/dev/null 2>&1 && log "✅ Qdrant started." || { log "❌ Failed to start Qdrant"; exit 1; }
    fi
) &
DB_PIDS+=($!)

# --- Redis ---
(
    if docker ps --format '{{.Names}}' | grep -q "redis"; then
        log "✅ Redis is already running."
    else
        log "🚀 Starting Redis..."
        docker compose up -d redis >/dev/null 2>&1 && log "✅ Redis started." || { log "❌ Failed to start Redis"; exit 1; }
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
    
    # Ensure venv exists and is managed by uv
    if [ ! -d .venv ]; then
        uv venv .venv
    fi
    
    # Sync dependencies
    uv pip install -r requirements.txt > /dev/null 2>&1

    uv run gunicorn -w 1 -b 0.0.0.0:5100 --timeout 120 --access-logfile - --error-logfile - server:app \
    > "$LOG_ROOT/flask-dynamic-db/flask_5100.log" 2>&1
    on_error "flask-dynamic-db" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started flask-dynamic-db (PID: $pid)"

# --- Start STUDY-PLAN-SERVICE (port 5500) ---
(
    log "🚀 Starting study-plan-service (port 5500)..."
    cd backend/study-plan-service || exit 1
    
    # Ensure venv exists and is managed by uv
    if [ ! -d .venv ]; then
        uv venv .venv
    fi
    
    # Sync dependencies
    uv pip install -r requirements.txt > /dev/null 2>&1

    uv run gunicorn -w 1 -b 0.0.0.0:5500 --timeout 120 server:app \
    > "$LOG_ROOT/study-plan-service/study_plan_5500.log" 2>&1
    on_error "study-plan-service" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started study-plan-service (PID: $pid)"

# --- Start DICTIONARY-DB (Legacy Node.js - DECOMMISSIONED) ---
# (
#     log "🚀 Starting legacy dictionary-db (port 5200)..."
#     cd backend/dictionary || exit 1
#
#     if [ "$SHOULD_SEED" = true ]; then
#         log "🌱 Seeding dictionary..."
#         node seed_jmdict_data.js > "$LOG_ROOT/dictionary-db/dict_seed.log" 2>&1 || true
#     else
#         log "ℹ️  Skipping dictionary seeding (use 'seed' arg to enable)"
#     fi
#
#     PORT=5200 node main_server.js \
#     > "$LOG_ROOT/dictionary-db/dict_5200.log" 2>&1
#     on_error "dictionary-db" $?
# ) &
# pid=$!
# PIDS+=($pid)
# log "✅ Started legacy dictionary-db (PID: $pid)"

# --- Start PYTHON-DICTIONARY (port 5200) ---
(
    log "🚀 Starting python-dictionary (port 5200)..."
    cd backend/python-dictionary || exit 1
    
    if [ "$SHOULD_SEED" = true ]; then
        log "🌱 Seeding dictionary (Full JMDict + Kanjidic)..."
        # The reseed script handles both JMDict and Kanjidic
        cd ../../ && ./reseed_dictionary.sh > "$LOG_ROOT/dictionary-db/full_seed.log" 2>&1 || true
        cd backend/python-dictionary || exit 1
    fi

    uv run uvicorn main:app --host 0.0.0.0 --port 5200 \
    > "$LOG_ROOT/dictionary-db/python_dict_5200.log" 2>&1
    on_error "python-dictionary" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started python-dictionary (PID: $pid)"

# --- Start HANACHAN (port 5400) ---
(
    log "🚀 Starting hanachan (port 5400)..."
    cd backend/hanachan || exit 1
    
    # Ensure venv exists and is managed by uv
    if [ ! -d .venv ]; then
        uv venv .venv
    fi
    
    # Sync dependencies
    uv pip install -r requirements.txt > /dev/null 2>&1

    # Assuming app.py is the entry point and it uses FLASK_PORT env var
    export FLASK_PORT=5400
    uv run python app.py > "$LOG_ROOT/hanachan/hanachan_5400.log" 2>&1
    on_error "hanachan" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started hanachan (PID: $pid)"

# --- Start HANACHAN WORKER ---
(
    log "🚀 Starting hanachan-worker..."
    cd backend/hanachan || exit 1
    
    # Ensure REDIS_URL is set (default for local)
    export REDIS_URL="redis://localhost:6379/0"
    export RESOURCES_API_URL="http://localhost:5100"
    # Ensure OBJC_DISABLE_INITIALIZE_FORK_SAFETY is set for macOS/some Linux
    export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
    
    # dependencies should be already synced by the hanachan service block
    uv run ./run_worker.sh > "$LOG_ROOT/hanachan/worker.log" 2>&1
    on_error "hanachan-worker" $?
) &
pid=$!
PIDS+=($pid)
log "✅ Started hanachan-worker (PID: $pid)"

# --- Start FRONTEND-NEXT (port 3000) ---
(
    log "🚀 Starting frontend-next (port 3000)..."
    cd frontend-next || exit 1
    
    if [ "$MODE" == "prod" ]; then
        if [ "$SHOULD_REBUILD" = true ] || [ ! -d ".next" ]; then
             log "🔨 Building frontend-next for production..."
             npm run build
        fi
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
