# Database Migration: SQLite → PostgreSQL

## Date: 2026-01-03T05:35:00Z

## Summary
Migrated Hanachan backend from SQLite to PostgreSQL for production-ready data persistence.

## Changes Made

### 1. Configuration Updates
- **`.env`**: Changed `DATABASE_URL` from SQLite path to PostgreSQL connection string
  ```
  # Before
  DATABASE_URL=sqlite:////path/to/hanachan.db
  
  # After
  DATABASE_URL=postgresql://user:password@localhost:5433/mydatabase
  ```

### 2. Files Deleted
- `hanachan.db` - SQLite database file (deleted)
- `scripts/apply_stm_db_changes.py` - SQLite migration script (deleted, not needed)

### 3. Test Files Updated
- `test/run_full_system.py` - PostgreSQL connection
- `test/integration/test_summarization_task.py` - PostgreSQL connection
- `test/integration/test_stm_integration.py` - PostgreSQL connection

### 4. Documentation Updated
- `scripts/backdoor_debug.py` - Updated docstring to say PostgreSQL

### 5. PostgreSQL Schema Updates
Added missing STM columns to existing PostgreSQL tables:
```sql
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_summarized_msg_id INTEGER;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB;
```

## Database Connection Details
- **Host**: localhost
- **Port**: 5433
- **Database**: mydatabase
- **User**: user
- **Password**: password
- **Container**: user-input-db-1

## Current Data in PostgreSQL
- **Conversations**: 12
- **Messages**: 29
- **Tables**: 15 (full schema with flashcards, mindmaps, vocabulary, etc.)

## Legacy Data Policy
- **SQLite files ignored**: `*.db` in `.gitignore`
- **Legacy data handling**: Throw general errors, do not attempt recovery
- **No backward compatibility**: SQLite support completely removed

## Verification
```bash
# Test connection
uv run python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    print(db.session.execute(db.text('SELECT version()')).scalar())
"
```

## Status: ✅ COMPLETED
PostgreSQL is now the only database for Hanachan.
