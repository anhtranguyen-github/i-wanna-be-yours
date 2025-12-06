curl -X POST \
  http://localhost:5400/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the capital of France?"}'