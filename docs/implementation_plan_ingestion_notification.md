---
title: Resource Ingestion Notification Plan
description: Plan to implement real-time notifications for resource ingestion status in the frontend.
---

## Objective
Enable the frontend (Next.js) to receive real-time updates when a resource finishes processing (ingestion and vector embedding) so the user knows when they can start chatting with it.

## Current State
- **Backend (Hanachan)**:
  - Uses `RQ` (Redis Queue) for background ingestion tasks.
  - Exposes `POST /resource/ingest/<id>` to trigger ingestion.
  - Exposes `GET /resource/ingest/status/<job_id>` to poll status.
- **Frontend**:
  - Uploads file to Flask (`/f-api/v1/resources/upload`).
  - Does NOT currently trigger ingestion automatically or track it.

## Proposed Architecture

### 1. Trigger Ingestion on Upload
**Component**: `frontend-next/src/app/api/resources/upload/route.ts` (or similar component logic)
- After successful upload to Flask, the frontend (or Flask proxy) should call Hanachan `POST /resource/ingest/<id>`.
- Store the returned `job_id` in the frontend state or associated with the file in a local store/context.

### 2. Notification Mechanism
We have two options: **Polling** (Simpler) or **WebSockets** (Better UX).

#### Option A: Polling (Recommended for MVP)
Since ingestion takes 10-60s, polling every 2-3 seconds is acceptable.
1. **Frontend**: When a file is uploaded, add it to a "Processing" list with its `job_id`.
2. **Hook**: Create a `useIngestionStatus(jobId)` hook.
3. **Logic**:
   - Poll `GET /resource/ingest/status/<jobId>` every 3s.
   - When status is `finished`, trigger a toast notification "Resource Ready!" and update UI (e.g., enable checkbox).
   - If `failed`, show error.

#### Option B: Server-Sent Events (SSE) or WebSockets
For a more robust solution later.
1. **Endpoint**: `GET /events` in Hanachan.
2. **Worker**: When job finishes, publish event to Redis Pub/Sub.
3. **Server**: Subscribe to Redis channel and push event to connected client via SSE.

## Implementation Steps (MVP - Polling)

1. **Frontend API**:
   - Create client-side API function `triggerIngest(resourceId)` calling Hanachan.
   - Create client-side API function `getIngestStatus(jobId)`.

2. **UI Update (`UploadResourceModal` or `ResourceList`)**:
   - On upload success: call `triggerIngest`.
   - Show "Processing..." spinner on the resource item.
   - Start polling `getIngestStatus`.

3. **Status Feedback**:
   - Replace spinner with "Check/Ready" icon when `finished`.
   - Enable "Select for Chat" behavior only when ready.

## Database Update (Optional but Recommended)
- The worker should update the `resources` collection (in MongoDB) setting a `status: "ready"` field.
- This allows persistent status even if the user refreshes the page, so they don't lose the "Processing" state (which is currently tied to the ephemeral `job_id`).
- **Flow**:
  1. Worker finishes -> Updates MongoDB `Resource` doc `processingStatus = 'completed'`.
  2. Frontend -> Fetches Resource list -> Sees `processingStatus`.
  3. This removes the need to track `job_id` on the client for long periods.

## Final Recommended Workflow
1. **Test Script** (Done): Validated polling works.
2. **Backend**: Update `ingest_resource` task to write `status="completed"` to MongoDB (`library.resources` collection).
3. **Frontend**: Simply poll the *Resource List* or *Resource Details* endpoint. If `status` is not completed, show loading. No need to manage `job_ids` directly on client.
