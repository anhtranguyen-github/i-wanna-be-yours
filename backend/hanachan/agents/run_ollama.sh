#!/bin/bash
set -e

# Check if Ollama container already exists
if [ "$(docker ps -a -q -f name=ollama)" ]; then
  echo "Container 'ollama' already exists. Starting it..."
  docker start ollama
else
  echo "Creating and starting new Ollama container..."
  docker run -d \
    -v ollama:/root/.ollama \
    -p 11434:11434 \
    --name ollama \
    ollama/ollama
fi

# Wait a bit for container to initialize
sleep 3

# List models
echo "Listing available models..."
docker exec -it ollama ollama list

# Run Qwen3 model (4B)
echo "Running qwen3:4b..."
docker exec -it ollama ollama run qwen3:4b
