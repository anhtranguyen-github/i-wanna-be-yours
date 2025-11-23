# Hanachan Chat Service Setup

This guide provides instructions for setting up the Hanachan Chat Service, which uses Flask, MongoDB, and Ollama.

## Prerequisites

-   **Python 3.10+**
-   **MongoDB**: Ensure you have MongoDB installed locally or access to a MongoDB instance.
-   **Ollama**: Ensure Ollama is installed and running for local LLM inference.

## 1. Environment Setup

It is recommended to use a virtual environment.

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

## 2. Install Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

## 3. Database Setup (MongoDB)

### Local MongoDB
If you have MongoDB installed locally, start the service.

**Option A: System Service**
```bash
sudo systemctl start mongod
```
*Note: If this fails (common in WSL), use Option B.*

**Option B: Manual Start (Recommended for Dev)**
```bash
# Create data directory if it doesn't exist
mkdir -p data/db

# Start mongod (adjust path as needed)
mongod --dbpath ./data/db --port 27017 --fork --logpath ./data/mongod.log
```

### Seeding Data
To populate the database with initial users and chat history for testing:

```bash
python seed_users_chat.py
```
This will create a `hanachan_db` database with `users` and `chat_history` collections.

## 4. LLM Setup (Ollama)

1.  **Install Ollama**: Follow instructions at [ollama.com](https://ollama.com).
2.  **Pull Model**: Pull the model specified in `config.yaml`.
    *   Current config uses: `qwen3:1.7b` (Ensure this model exists or update `config.yaml` to a valid model like `qwen2.5:1.5b`).

```bash
# Example
ollama pull qwen2.5:1.5b
```
3.  **Start Ollama**:
```bash
ollama serve
```

## 5. MCP Servers (Tools)

The agent uses MCP (Model Context Protocol) servers for tools (e.g., Qdrant).
The configuration uses `uvx` to run these servers.

-   **Install uv**:
    ```bash
    pip install uv
    ```
    Or follow instructions at [docs.astral.sh/uv](https://docs.astral.sh/uv/).

## 6. Configuration

The service is configured via `config.yaml`. Key settings:

-   **Server**: Port and environment.
-   **Database**: MongoDB host, port, and database name.
-   **Models**: Ollama model name and base URL.
-   **Agents**: System prompts and tool configurations.

## 7. Running the Service

Start the Flask application:

```bash
python app.py
```

The server will start at `http://localhost:5400` (default).

## 8. Using the Chat Interface

1.  Open your browser and navigate to `http://localhost:5400`.
2.  **User ID**: Default is `user_001`.
3.  **Conversation**: Click "+" to start a new conversation or enter an existing UUID.
4.  **Thinking Mode**: Toggle "Show Thinking" to see the model's internal reasoning process (if supported/enabled).

## Troubleshooting

-   **Connection Refused**: Ensure MongoDB is running on port 27017.
-   **Ollama Error**: Ensure `ollama serve` is running and the model is pulled.
-   **Missing Modules**: Run `pip install -r requirements.txt` again.
