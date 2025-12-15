#!/bin/bash
# Test script for Quiz API endpoints

BASE_URL="http://localhost:5100/f-api/v1"

echo "=================================="
echo "Testing Quiz API Endpoints"
echo "=================================="

# Test 1: List quizzes
echo ""
echo "1. GET /quizzes - List all quizzes"
echo "-----------------------------------"
curl -s "$BASE_URL/quizzes" | python3 -m json.tool | head -30

# Test 2: List quizzes with filter
echo ""
echo "2. GET /quizzes?level=N5 - Filter by level"
echo "-------------------------------------------"
curl -s "$BASE_URL/quizzes?level=N5" | python3 -m json.tool

# Test 3: Get specific quiz
echo ""
echo "3. GET /quizzes/:id - Get quiz details"
echo "---------------------------------------"
# Get first quiz ID from list
QUIZ_ID=$(curl -s "$BASE_URL/quizzes" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['quizzes'][0]['id'] if data['quizzes'] else '')")

if [ -n "$QUIZ_ID" ]; then
    echo "Quiz ID: $QUIZ_ID"
    curl -s "$BASE_URL/quizzes/$QUIZ_ID" | python3 -m json.tool | head -40
else
    echo "No quizzes found"
fi

# Test 4: Submit quiz (guest mode)
echo ""
echo "4. POST /quizzes/:id/submit - Submit quiz (guest)"
echo "--------------------------------------------------"
if [ -n "$QUIZ_ID" ]; then
    # Get question IDs
    QUESTIONS=$(curl -s "$BASE_URL/quizzes/$QUIZ_ID")
    Q1_ID=$(echo "$QUESTIONS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['questions'][0]['question_id'] if data['questions'] else '')")
    Q1_OPTIONS=$(echo "$QUESTIONS" | python3 -c "import sys, json; data=json.load(sys.stdin); opts=data['questions'][0]['content'].get('options',[]); print(opts[0] if opts else '')")
    
    echo "Submitting answer for question: $Q1_ID"
    echo "Answer: $Q1_OPTIONS"
    
    curl -s -X POST "$BASE_URL/quizzes/$QUIZ_ID/submit" \
        -H "Content-Type: application/json" \
        -d "{
            \"answers\": {
                \"$Q1_ID\": \"$Q1_OPTIONS\"
            },
            \"started_at\": \"$(date -Iseconds)\"
        }" | python3 -m json.tool
fi

# Test 5: Submit quiz (logged in user)
echo ""
echo "5. POST /quizzes/:id/submit - Submit quiz (logged in)"
echo "------------------------------------------------------"
if [ -n "$QUIZ_ID" ]; then
    curl -s -X POST "$BASE_URL/quizzes/$QUIZ_ID/submit" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"test-user-123\",
            \"answers\": {
                \"$Q1_ID\": \"$Q1_OPTIONS\"
            },
            \"started_at\": \"$(date -Iseconds)\"
        }" | python3 -m json.tool
fi

# Test 6: Get user attempts
echo ""
echo "6. GET /quiz-attempts - Get user attempts"
echo "------------------------------------------"
curl -s "$BASE_URL/quiz-attempts?user_id=test-user-123" | python3 -m json.tool

echo ""
echo "=================================="
echo "Quiz API Tests Complete"
echo "=================================="
