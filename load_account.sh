#!/bin/bash

# Define backend URL - adjust port if needed (defaulting to typical Express backend port or Next.js proxy)
# Assuming running locally with default ports
# Trying direct backend if possible, or frontend proxy

# Define backend URL
# Using direct backend URL to get tokens (frontend proxy hides them in cookies)
API_URL="http://localhost:8000/e-api/v1/auth/login"
# API_URL="http://localhost:3000/api/auth/login"

echo "Backend URL: $API_URL"
echo "Logging in to test account (timeout 10s)..."

curl -v --connect-timeout 5 --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@hanachan.org",
    "password": "password123"
  }'

echo -e "\n\nLogin request finished."


# testuser2@hanachan.org
# TestPass123!

