#!/bin/bash

BASE_URL="http://localhost:3000/api/auth"
EMAIL="test_curl_$(date +%s)@example.com"
PASSWORD="password123"
COOKIE_FILE="cookies.txt"

echo "1. Testing Registration..."
curl -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  -v

echo -e "\n\n2. Testing Login..."
curl -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  -c $COOKIE_FILE \
  -v

echo -e "\n\n3. Testing /me endpoint..."
curl -X GET "$BASE_URL/me" \
  -b $COOKIE_FILE \
  -v

echo -e "\n\n4. Testing Logout..."
curl -X POST "$BASE_URL/logout" \
  -b $COOKIE_FILE \
  -c $COOKIE_FILE \
  -v

echo -e "\n\n5. Testing /me after logout..."
curl -X GET "$BASE_URL/me" \
  -b $COOKIE_FILE \
  -v

rm $COOKIE_FILE
