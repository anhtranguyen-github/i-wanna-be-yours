#!/bin/bash
echo "Testing Study Review Endpoint..."
# Note: userId must match the one used in creation (testUser)
response=$(curl -s -X GET "http://localhost:5100/f-api/v1/study/due?userId=testUser")

echo "Response length: ${#response}"
echo "Response snippet: ${response:0:200}"

if [[ "$response" == *"TestFront"* && "$response" == *"TestBack"* ]]; then
  echo "✅ Test Passed: Found hydrated card."
else
  echo "❌ Test Failed: Content missing."
fi
