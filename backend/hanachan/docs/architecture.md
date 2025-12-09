# System Architecture Documentation

## 1. High-Level Overview

The application is built as a modular Python web service using the **Flask** framework. It follows a **layered architecture** (Route-Service-Repository) to ensure separation of concerns, scalability, and maintainability. The system is designed to orchestrate AI Agents, managing the flow from API requests to data persistence and agent execution.

## 2. Directory Structure

The codebase is organized into the following key directories:

- **`/routes`**: Contains the API controllers (Blueprints). These handle incoming HTTP requests, validate input, and delegate logic to services.
- **`/services`**: Contains the business logic. Services orchestrate the flow between data access and core domain logic (like agent execution).
- **`/repositories`**: The Data Access Layer. Responsible for all database interactions, abstracting the specific ORM calls from the services.
- **`/models`**: Contains the SQLAlchemy database models (Entities) representing the database schema.
- **`/mappers`**: Responsible for transforming data between different formats (e.g., converting incoming JSON DTOs to internal Domain Models).
- **`/agent`**: Holds the core logic for the Agent system (Graph construction, builders, etc.).
- **`/data`**: Likely used for localized data storage or resources.

## 3. Key Architectural Internal Layers

### 3.1 Web Layer (Flask Blueprints)
- **File**: `routes/agent.py`
- **Responsibility**: Defines API endpoints.
- **Actions**: Receives JSON payloads, calls the appropriate Service, and returns JSON responses. DOES NOT contain business logic.

### 3.2 Service Layer
- **File**: `services/agent_service.py`
- **Responsibility**: The brain of the operation.
- **Actions**:
  1. Utilizes **Mappers** to convert raw input into Domain Objects.
  2. Calls **Repositories** to persist data.
  3. Invokes the **Agent** logic (Graph execution).

### 3.3 Data Layer (Repositories & Models)
- **Repository**: `repositories/request_repository.py`. Uses Dependency Injection principles (referenced in Service) to allow for easier testing.
- **Models**: `models/request.py`. Defines the schema using SQLAlchemy.
  - **Request**: The central entity (Session ID, User ID, Prompt).
  - **ContextConfiguration**: Stores model settings (temperature, max tokens) and resources.
  - **HistoryMessage**: Stores the chat history.

## 4. Request Lifecycle

The flow of a typical request (e.g., `/agent/invoke`) is as follows:

1.  **Income**: The Client sends a POST request with JSON data to `/routes/agent.py`.
2.  **Delegation**: The route handler instantiates `AgentService`.
3.  **Mapping**: `AgentService` uses `RequestMapper` to transform the dictionary `data` into a `Request` model instance.
4.  **Persistence**: `AgentService` calls `RequestRepository.save(request_model)`.
    - The `Request` and its related `ContextConfiguration` and `HistoryMessage`s are saved to the database.
5.  **Execution**: `AgentService` functions as the orchestrator to trigger the specific Agent logic (currently located in `agent/`).
6.  **Response**: The service returns a result dict, which the route converts to JSON and sends back to the client.

## 5. Database Schema

The database is relational (SQLAlchemy), centered around the **Request** entity:

- **Requests Table**: Main entry point.
- **ContextConfigurations Table**: One-to-One with Requests. Configuration details.
- **HistoryMessages Table**: One-to-Many with Requests. Stores the conversation log.
- **ResourcePointers Table**: Stores references to resources (docs, files) associated with a configuration.
