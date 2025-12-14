#!/bin/bash
echo "Testing Create Personal Card Endpoint..."
response=$(curl -s -X POST http://localhost:5100/f-api/v1/cards/personal \
-H "Content-Type: application/json" \
-d '{"userId": "testUser", "front": "TestFront", "back": "TestBack", "type": "vocabulary", "deck_name": "TestDeck"}')

echo "Response:"
echo "$response"

if [[ "$response" == *"cardId"* && "$response" == *"progressId"* ]]; then
  echo "✅ Test Passed"
else
  echo "❌ Test Failed"
fi
