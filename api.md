# agent-api Documentation

This document describes the HTTP agent-api provided by the backend application.

**Base URL**: `http://localhost:5400`

## General

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Checks if the agent-api is running.
- **Response**: `200 OK` "OK"

## Agent & Threads

These endpoints manage chat threads and interaction with the AI agent.

### List Threads
- **URL**: `/agent-api/threads`
- **Method**: `GET`
- **Description**: Returns a list of all chat threads, ordered by most recently updated.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "string (UUID)",
      "title": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ]
  ```

### Create Thread
- **URL**: `/agent-api/threads`
- **Method**: `POST`
- **Description**: Creates a new chat thread.
- **Request Body**:
  ```json
  {
    "title": "string (optional, default: 'New Chat')"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "id": "string (UUID)",
    "title": "string",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
  ```

### Stream Agent Response
- **URL**: `/agent-api/stream`
- **Method**: `GET`
- **Description**: Streams the agent's response for a given user message. This endpoint uses Server-Sent Events (SSE).
- **Query Parameters**:
  - `content`: The user's input message string.
  - `threadId`: The ID of the thread to continue.
  - `model`: (Optional) The model to use (default: "gpt-4o").
- **Response**: Stream of events.
  - `event: error`: On failure.
  - `data`: JSON object with `type` ("ai") and `content` (chunk).
  - `event: done`: When generation is complete.

### Get History
- **URL**: `/agent-api/history/<thread_id>`
- **Method**: `GET`
- **Description**: Retrieves the full message history for a specific thread.
- **Path Parameters**:
  - `thread_id`: The ID of the thread.
- **Response**: `200 OK`
  ```json
  [
    {
      "role": "user" | "ai",
      "content": "string",
      "id": "string (UUID)"
    }
  ]
  ```

## MCP Servers

These endpoints manage the Model Context Protocol (MCP) servers configuration.

### List Servers
- **URL**: `/agent-api/mcp-servers`
- **Method**: `GET`
- **Description**: Lists all configured MCP servers.
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "type": "stdio" | "websocket",
      "enabled": "boolean",
      "command": "string (optional)",
      "args": ["string"] (optional),
      "env": {"key": "value"} (optional),
      "url": "string (optional)",
      "headers": {"key": "value"} (optional),
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ]
  ```

### Create Server
- **URL**: `/agent-api/mcp-servers`
- **Method**: `POST`
- **Description**: Registers a new MCP server.
- **Request Body**:
  ```json
  {
    "name": "string",
    "type": "stdio" | "websocket",
    "enabled": "boolean (optional, default: true)",
    "command": "string (for stdio type)",
    "args": ["string"] (for stdio type),
    "env": {"key": "value"} (optional),
    "url": "string (for websocket type)",
    "headers": {"key": "value"} (optional)
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "integer"
  }
  ```

### Update Server
- **URL**: `/agent-api/mcp-servers`
- **Method**: `PATCH`
- **Description**: Updates an existing MCP server configuration. Currently mainly supports toggling `enabled`.
- **Request Body**:
  ```json
  {
    "id": "integer",
    "enabled": "boolean"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Error**: `404 Not Found` if server does not exist.

### Delete Server
- **URL**: `/agent-api/mcp-servers`
- **Method**: `DELETE`
- **Description**: Deletes an MCP server configuration.
- **Query Parameters**:
  - `id`: The ID of the server to delete.
- **Response**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Error**: `404 Not Found` if server does not exist.

### List Tools
- **URL**: `/agent-api/mcp-tools`
- **Method**: `GET`
- **Description**: Lists all available tools from the currently connected and enabled MCP servers.
- **Response**: `200 OK`
  ```json
  {
    "serverGroups": {
        "serverName": [
            {
               "name": "tool_name",
               "description": "...",
               "inputSchema": { ... }
            }
        ]
    },
    "totalCount": "integer"
  }
  ```
