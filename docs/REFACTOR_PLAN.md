# Refactoring Plan: MERN Stack Unification & MySQL Removal

## Objective
Migrate the application from a hybrid MySQL/MongoDB architecture to a unified **MERN (MongoDB, Express, React, Node)** stack, specifically removing MySQL dependencies used for authentication and consolidating user data into MongoDB.

## Current State
- **Frontend**: Next.js (React)
- **Backend Services**:
  - `frontend-next` (Next.js): Handles UI and currently manages Auth via MySQL.
  - `express-db` (Node/Express): Static content API (MongoDB `zenRelationshipsAutomated`).
  - `flask-dynamic-db` (Python/Flask): User progress/Flashcards (MongoDB `flaskFlashcardDB`).
- **Database**:
  - MySQL (`hanabira_auth`): Stores Users, Sessions, Verification Tokens.
  - MongoDB: Stores everything else.

## Target State
- **Authentication**: Managed by `frontend-next` via Mongoose connecting to MongoDB.
- **Data persistence**: All data (Users + App Data) in MongoDB.
- **MySQL**: Completely removed from the project stack.

## Implementation Steps

### Phase 1: Preparation & Setup
1.  **Dependencies**: Install `mongoose` in `frontend-next`.
2.  **Infrastructure**: Update `frontend-next` env vars to point to MongoDB instead of MySQL.

### Phase 2: MongoDB Implementation in Next.js
1.  **Database Connection**: Implement `src/lib/mongodb.ts` using the singleton/global cache pattern to prevent connection exhaustion in Next.js dev mode.
2.  **User Schema**: Create `src/models/User.ts` with Mongoose.
    - Fields: `name`, `email`, `password` (hashed), `image`, `createdAt`, `updatedAt`.
    - *Note: We will match the existing MySQL schema fields to minimize frontend disruption.*

### Phase 3: Auth API Migration
1.  **Refactor Register Route** (`src/app/api/auth/register/route.ts`):
    - specific: Replace MySQL `INSERT` with Mongoose `User.create()`.
    - specific: Handle duplicate email errors via Mongoose codes.
2.  **Refactor Login Route** (`src/app/api/auth/login/route.ts`):
    - specific: Replace MySQL `SELECT` with `User.findOne()`.
    - specific: Verify `bcrypt` comparison (logic remains similar).
    - specific: Update session creation (if managing JWT/Session manually). *Current implementation seems to be JWT-based or custom session. We need to check `logout`.*
3.  **Refactor Logout Route** (`src/app/api/auth/logout/route.ts`):
    - Update logic if it relies on a DB session store.

### Phase 4: Cleanup & MySQL Removal
1.  **Remove MySQL Service**: Delete `mysql-db` service from `docker-compose.yml`.
2.  **Remove Initialization**: Delete `mysql_init/` directory.
3.  **Uninstall Driver**: `npm uninstall mysql2` in `frontend-next`.
4.  **Clean Code**: Delete `src/lib/db.ts` (MySQL pool).

### Phase 5: Verification
1.  **Test Registration**: Create a new user.
2.  **Test Login**: Log in with the new user.
3.  **Test Persistence**: Restart services and ensure user remains valid.

## Future Refactoring (Post-Migration)
- **Consolidate APIs**: Consider merging `flask-dynamic-db` logic into Next.js API routes or the Express backend to achieve a pure MERN stack (Node.js only backend).
- **Unified DB**: Migrate `zenRelationshipsAutomated` and `flaskFlashcardDB` into a single logical database `hanabira_main`.
