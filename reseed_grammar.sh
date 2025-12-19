#!/bin/bash

# Navigate to backend/express directory
cd backend/express

# Run the grammar seeding script
node ./seeding_scripts/seed_grammar_to_db.js

# Return to original directory
cd ../..
