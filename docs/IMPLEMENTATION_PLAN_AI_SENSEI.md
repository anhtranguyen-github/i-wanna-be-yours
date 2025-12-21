# 🤖 Implementation Plan: AI Sensei Dashboard (`/study-plan-ai`)

This plan outlines the roadmap for building the "Agentic Layer" using **LangChain**, **LangGraph**, and the **Hanachan Service**. It follows the industry-standard "Skills & Tools" terminology for scalable agent behavior. **Note: All phases require real model integration (Ollama or Cloud); simulated/static text responses are prohibited.**

## 1. Architecture: The Hanachan Agent Ecosystem

### A. Backend Services
*   **Target Service**: `backend/hanachan` (Unified AI/Agent service).
*   **Orchestration**: **LangGraph** will manage the multi-step reasoning loops and transitions between different agent "Skills."
*   **LLM Providers**: Managed via a unified factory supporting:
    *   **External**: OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet).
    *   **Local**: Ollama (Running **`qwen3:1.7b`** as the primary local test model) for offline/private study sessions.

### B. "Skills" vs. "Tools" (The Anthropic Standard)
*   **Skills (`/hanachan/skills/*.md`)**: Packaged domain expertise (Instructions, System Prompts, Reasoning Chains).
    *   `sensei-navigator.md`: Handles the high-level conversation and session flow.
    *   `sensei-planner.md`: Expertise in JLPT milestones and schedule optimization.
    *   `sensei-analyst.md`: Expert interpreting the RYG (Red-Yellow-Green) Priority Matrix.
*   **Tools (`/hanachan/services/`)**: Executable Python functions that interact with the system.
    *   `StudyPlanTool`: Fetches current milestones.
    *   `MasteryTrackerTool`: Updates SRS data.
    *   `ContextLogTool`: Ingests user mood/energy data.

---

## 2. Multi-Agent Design with LangGraph

The Sensei logic will be implemented as a stateful graph to ensure consistent "memory" across the learning session.

### A. Graph State (`SenseiState`)
The global object passed between agents includes:
*   `user_id`: Current student identifier.
*   `dashboard_snapshot`: A condensed summary of OKRs, PACTs, and Priorities.
*   `last_feedback`: Student's emotional state from the latest check-in.
*   `active_mission`: The current tactical task being executed.

### B. Graph Topography
1.  **Node: Context Ingestor**: Fetches real data from the Study Plan DB and "hydrates" the graph state.
2.  **Node: Analyst**: Evaluates the snapshot to find "Red Zone" critical gaps.
3.  **Node: Navigator**: Decides whether to suggest a Quiz, a Lesson, or a Break.
4.  **Node: Executor**: Calls the appropriate **Tools** to update the user's dashboard tasks.

---

## 3. Frontend Integration (`/study-plan-ai`)

### A. The "Autopilot" UI
*   **Route**: `frontend-next/src/app/study-plan-ai/page.tsx`.
*   **UI Experience**: 
    *   **The Hub**: A central, pulsing AI orb or card showing the "Current Mission."
    *   **Collaborative Chat**: A sidebar for the student to talk to the Sensei using the `hanachan` streaming API.
    *   **Model Selector**: A config panel in the header to switch between Cloud models and **Ollama Local**.

### B. Technical Integration
*   Use **Vercel AI SDK** with a custom provider pointing to the `hanachan` LangGraph endpoint.
*   Implement **Server-Sent Events (SSE)** for streaming reasoning steps (so the user knows the AI is "Thinking about your past errors...").

---

## 4. Development Roadmap

### Phase 1: The Brain (Architecture)
*   [ ] Define `SenseiGraph` in `hanachan/agent/graph.py` using LangGraph.
    *   [ ] Implement `LLMProviderFactory` with Ollama support (defaulting to **`qwen3:1.7b`**).
*   [ ] Create basic `sensei-ui-base.md` skill.

### Phase 2: The Eyes (Context)
*   [ ] Build "Snapshot" services in `hanachan` to fetch data from the `study-plan-service`.
*   [ ] Implement `ContextIngestor` node to turn Mongo records into AI-friendly text.

### Phase 3: The Hands (Skills & Tools)
*   [ ] Create `skills/sensei-planner.md` (The strategist).
*   [ ] Implement `UpdateTaskTool` to allow the agent to write back to the dashboard.

### Phase 4: The Interface (Frontend)
*   [ ] Scaffold the `/study-plan-ai` route.
*   [ ] Connect the chat sidebar to the `hanachan` streaming endpoint.

---

## 5. Summary Value
By integrating with **LangGraph** inside the **Hanachan** service, we transform the dashboard from a reporting tool into a living, thinking tutor. The separation of **Skills** (How to teach) and **Tools** (Technical actions) ensures that the Sensei can grow in intelligence without needing constant code refactoring.
