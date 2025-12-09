# 🤖 Professional Multimodal Chatbot Template

> A production-ready, modular foundation for building advanced AI chat applications with Flask, SQLite/PostgreSQL, and a polished Glassmorphic UI.

## 🚀 Overview

This repository is designed as a **starter kit** for developers building:
*   **Multimodal Chatbots** (Text, Tasks, Suggestions, Media)
*   **RAG (Retrieval Augmented Generation) Pipelines**
*   **Agentic Workflows**

It comes pre-configured with a **Mock Agent** for rapid UI/UX development and testing without incurring LLM costs.

---

## 🏗 Architecture

| Component | Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML/CSS/JS (Vanilla) | Zero-build complexity. "Premium Dark Glass" integration. |
| **Backend** | Python / Flask | RESTful API for chat, resources, and agent execution. |
| **Database** | SQLAlchemy (SQLite/Postgres) | Persist conversations, messages, and file metadata. |
| **Package Mgr** | `uv` | Ultra-fast Python dependency management. |
| **Testing** | `MockAgent` | Simulates complex AI behavior (Tasks, Suggestions). |

---

## 🛠 Setup & Installation

**Prerequisites:** Python 3.12+

1.  **Install `uv`** (if not installed):
    ```bash
    pip install uv
    ```

2.  **Initialize Project**:
    ```bash
    uv sync
    ```

3.  **Run Development Server**:
    ```bash
    uv run app.py
    ```

    *Opens at `http://localhost:5000`*

---

## 📘 Documentation Suite

This template includes a rigorous set of **Skill Cards** in the `skills/` directory to guide your development:

1.  **[`chatbot-ui-base.md`](skills/chatbot-ui-base.md)**: The "Constitution" of the UI. Defines strict requirements for aesthetics, spam prevention, and error handling.
2.  **[`chatbot-debug-agent.md`](skills/chatbot-debug-agent.md)**: Standard for the "Echo Agent". Use this to verify your backend pipeline before connecting real LLMs.
3.  **[`chatbot-optional.md`](skills/chatbot-optional.md)**: A menu of advanced features (Context Injection, Multimodal Output) to implement as you scale.

---

## 🧪 The Mock Agent

Located at `agent/mock_agent.py`.
This agent is **active by default**. It echoes your prompt and returns rich structured data:
*   **Debug Info:** Session ID, User ID, Context Configuration.
*   **Rich Content:** Triggers "Proposed Tasks" and "Suggestions" chips in the UI.

**To customize:**
Edit `agent/mock_agent.py` to simulate different response types (e.g., Markdown tables, JSON artifacts).

---

## 📂 Project Structure

```text
├── agent/              # Agent logic (MockAgent, etc.)
├── routes/             # API Endpoints (Chat, Resources)
├── services/           # Business Logic layer
├── models/             # Database Models
├── schemas/            # Pydantic DTOs
├── skills/             # Requirement Documentation (Skill Cards)
├── static/             # Frontend Assets (CSS, JS, HTML)
├── app.py              # Application Entry Point
└── pyproject.toml      # Dependency Config
```

## 📝 License
[MIT](LICENSE)

