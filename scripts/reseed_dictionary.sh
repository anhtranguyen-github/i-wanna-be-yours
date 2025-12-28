#!/bin/bash

# Script to re-seed the full dictionary database (Kanjidic2 + JMDict)
# Usage: ./reseed_dictionary.sh

set -e

echo "=== Reseeding Dictionary Database ==="

cd backend/dictionary

# 1. Prepare simplified JMDict data if needed
echo "[1/3] Streamlining JMDict JSON data..."
node streamline_jmdict_json.js

# 2. Run the unified seeding script
echo "[2/3] Seeding Kanjidic2 and JMDict to MongoDB..."
node seed_dictionary_full.js

echo "[3/3] Done!"
echo "Database 'jmdictDatabase' has been populated."
