# Hanachan Chat UI Technical Architecture Report

**Date**: December 23, 2025  
**Version**: 1.0  
**Purpose**: Enable external consultants to understand the current chat architecture, its design decisions, known issues, and behavior contracts that MUST be preserved during any optimization work.

---

## 1. Executive Summary

The Hanachan Chat UI is a sophisticated, real-time chat interface built with Next.js/React. It features a three-column layout with:
- **Left Sidebar**: Chat history and resource library
- **Main Area**: Conversation interface with AI streaming
- **Right Sidebar**: Artifact display and management

### Current Issues
1. **Performance Lag**: UI feels sluggish during navigation and interactions
2. **Duplicate Artifacts**: Artifacts sometimes appear duplicated in the right sidebar
3. **Stale Artifacts**: Right sidebar doesn't update until page reload

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | SSR, routing, API proxying |
| **State Management** | React Context + SWR | Local state + data fetching with caching |
| **Data Fetching** | SWR (stale-while-revalidate) | Caching, deduplication, background refresh |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Authentication** | JWT (cookies) + `authFetch` wrapper | Token management |

---

## 3. Component Architecture

### 3.1 File Structure
```
frontend-next/src/components/chat/
├── ChatLayoutContext.tsx   # Global state for sidebar states, active artifact, conversation ID
├── ChatLayoutShell.tsx     # Layout wrapper orchestrating the 3-column layout
├── ChatMainArea.tsx        # Main chat interface (messages, input, streaming)
├── ChatRightSidebar.tsx    # Artifact list and viewer
└── index.ts                # Barrel exports

frontend-next/src/components/sidebar/
└── CollapsibleSidebar.tsx  # Left sidebar with chat history + resources
```

### 3.2 Context Providers Hierarchy
```
RootLayout
└── GlobalAuthProvider          # Authentication state
    └── ChatLayoutProvider      # Sidebar states, artifact management
        └── AppShell            # Main layout container
            ├── CollapsibleSidebar (Left)
            ├── ChatMainArea (Center)
            └── ChatRightSidebar (Right)
```

---

## 4. State Management Deep Dive

### 4.1 ChatLayoutContext (`ChatLayoutContext.tsx`)

**Purpose**: Central state for layout coordination, sidebar visibility, active artifact tracking, and cross-component communication.

**Key State Variables**:
```typescript
interface ChatLayoutState {
    leftSidebar: 'collapsed' | 'expanded';
    rightSidebar: 'collapsed' | 'minimized' | 'expanded';
    viewport: Viewport;
    activeArtifact: Artifact | null;      // Currently viewed artifact
    effectiveConversationId: string | null; // Synced conversation ID
}
```

**CRITICAL DESIGN DECISION - Conversation ID Tracking**:
```typescript
// Line 131: Effective conversation ID tracks the "active" conversation
const [effectiveConversationId, setEffectiveConversationId] = useState<string | null>(
    conversationIdFromParams || null
);
```

**Why**: When user sends first message in a new chat (`/chat`), backend returns a `conversationId`. We use `window.history.replaceState()` to update URL to `/chat/{id}` WITHOUT triggering a full page navigation. This prevents message reload and maintains UX continuity.

**BEHAVIOR CONTRACT #1**: First message in new chat must NOT trigger full page reload.

---

### 4.2 SessionStorage Bridge (`ChatLayoutContext.tsx`, Lines 160-190)

**Purpose**: Persist sidebar state across shallow URL updates.

**Implementation**:
```typescript
// Save to sessionStorage before navigation
sessionStorage.setItem('hanachan:rightSidebar', 'expanded');
sessionStorage.setItem('hanachan:activeArtifact', JSON.stringify(artifact));

// Restore on mount
const savedSidebar = sessionStorage.getItem('hanachan:rightSidebar');
const savedArtifact = sessionStorage.getItem('hanachan:activeArtifact');
```

**Why**: When URL changes from `/chat` to `/chat/{id}` via `replaceState()`, the ChatLayoutContext needs to persist artifact state. Without this, the right sidebar would reset.

**BEHAVIOR CONTRACT #2**: Active artifact and sidebar state must persist across shallow URL updates.

---

### 4.3 SWR Cache Keys

**Chat History** (CollapsibleSidebar.tsx, Line 59-62):
```typescript
const { data: chats } = useSWR(
    isOnChat && user ? ['/h-api/conversations', user.id] : null,
    () => aiTutorService.getConversations()
);
```

**Resources** (CollapsibleSidebar.tsx, Line 75-78):
```typescript
const { data: serverResponse } = useSWR(
    isOnChat && user ? ['/f-api/v1/resources', user.id] : null,
    () => resourceService.list({ userId: String(user?.id) })
);
```

**Artifacts** (ChatRightSidebar.tsx, Line 35-38):
```typescript
const { data: artifacts } = useSWR<Artifact[]>(
    effectiveConversationId && user ? ['artifacts', effectiveConversationId, user.id] : null,
    () => artifactService.listByConversation(effectiveConversationId!, user?.id?.toString())
);
```

**Cache Invalidation Strategy** (ChatMainArea.tsx, Lines 492-527):
```typescript
// After AI responds, invalidate all relevant caches
mutate(['/f-api/v1/resources', user.id]);           // Resources sidebar
mutate(['/h-api/conversations', user.id]);          // Chat history
mutate(['artifacts', convoIdToMutate.toString()]);  // Artifacts list
```

**BEHAVIOR CONTRACT #3**: After each message:
- Chat history list must update to show new conversation
- Resources list must update if AI created resources
- Artifacts list must update if AI created artifacts

---

## 5. Data Flow Diagrams

### 5.1 New Chat Flow (First Message)

```
User sends message in /chat (no conversationId)
    │
    ├─1─> ChatMainArea.handleSend()
    │       ├── Generate temporary sessionId
    │       └── Call aiTutorService.streamChat()
    │
    ├─2─> Backend creates conversation, returns conversationId
    │
    ├─3─> window.history.replaceState('/chat/{id}')  // NO page reload
    │
    ├─4─> setLocalConversationId(id)                 // Update local state
    │       └── setEffectiveConversationId(id)       // Update context
    │
    └─5─> mutate(['/h-api/conversations'])           // Refresh sidebar
            mutate(['artifacts', id])                 // Refresh artifacts
```

### 5.2 Artifact Creation Flow

```
AI Response includes artifacts
    │
    ├─1─> aiTutorService.streamChat() returns { artifacts: [...] }
    │
    ├─2─> ChatMainArea appends message with artifacts to local state
    │       └── Message.artifacts = [...artifacts]
    │
    ├─3─> mutate(['artifacts', conversationId])  // Trigger refetch
    │
    └─4─> ChatRightSidebar receives new data via SWR subscription
```

---

## 6. Known Issues & Root Cause Analysis

### 6.1 Issue: Duplicate Artifacts

**Symptom**: Same artifact appears multiple times in `ChatRightSidebar`.

**Suspected Causes**:
1. Backend may return same artifact with different IDs across requests
2. SWR cache may not properly deduplicate on key change
3. `streamChat()` artifacts may be appended to message state AND fetched separately

**Investigation Points**:
- Check backend: `GET /artifacts?conversationId={id}` response
- Check `mapArtifact()` for ID generation: Uses `r.id || r.artifactId || uuidv4()`—if backend returns inconsistent IDs, duplicates occur
- Check if artifacts from `streamChat()` response AND from SWR fetch are both rendered

**Code Location**: `aiTutorService.ts` Line 31-40, `ChatRightSidebar.tsx` Line 35-38

### 6.2 Issue: Artifacts Require Page Reload

**Symptom**: New artifacts from AI don't appear in right sidebar until page reload.

**Suspected Causes**:
1. SWR cache key may not match after URL update
2. `effectiveConversationId` may not update in time
3. `mutate()` call may use wrong key

**Investigation Points**:
- Add console logs to verify `effectiveConversationId` in context
- Verify SWR key: `['artifacts', effectiveConversationId, user.id]` must match `mutate()` key
- Check if `mutate()` is called BEFORE `setEffectiveConversationId` updates

**Code Location**: `ChatMainArea.tsx` Lines 498-501, `ChatRightSidebar.tsx` Lines 35-38

### 6.3 Issue: General UI Lag

**Symptom**: Slow transitions, delayed state updates, sluggish scrolling.

**Suspected Causes**:
1. **Too many re-renders**: Context value changes trigger full tree re-renders
2. **Large DOM**: Message history may accumulate without virtualization
3. **CSS transitions**: Sidebar animations (300ms+) compound
4. **SWR over-fetching**: Multiple components subscribe to same keys
5. **No memoization**: Components re-render on every parent update

**Investigation Points**:
- Use React DevTools Profiler to identify re-render counts
- Check if `ChatLayoutContext` value object is recreated on every render
- Message list is NOT virtualized—performance degrades with history
- Multiple `useEffect` hooks in `ChatMainArea` may fire unnecessarily

---

## 7. Optimization Recommendations (Preserving Behavior)

### 7.1 Context Optimization

**Problem**: `ChatLayoutContext.Provider` value object is recreated on every render.

**Solution**: Memoize context value:
```typescript
const contextValue = useMemo(() => ({
    leftSidebar, rightSidebar, viewport, activeArtifact, effectiveConversationId,
    setLeftSidebar, setRightSidebar, toggleLeftSidebar, ...
}), [leftSidebar, rightSidebar, viewport, activeArtifact, effectiveConversationId]);

return <ChatLayoutContext.Provider value={contextValue}>{children}</ChatLayoutContext.Provider>;
```

**MUST PRESERVE**: All callback functions must remain stable (use `useCallback`).

### 7.2 Message Virtualization

**Problem**: Rendering 100+ messages in DOM causes lag.

**Solution**: Use `react-window` or `@tanstack/react-virtual`:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList height={containerHeight} itemCount={messages.length} itemSize={80}>
    {({ index, style }) => <MessageBubble style={style} message={messages[index]} />}
</FixedSizeList>
```

**MUST PRESERVE**: Auto-scroll to bottom on new message, smooth scroll behavior.

### 7.3 SWR Configuration Tuning

**Problem**: Multiple subscriptions may trigger redundant fetches.

**Solution**: Configure SWR globally:
```typescript
<SWRConfig value={{
    dedupingInterval: 5000,        // Dedupe requests within 5s
    focusThrottleInterval: 10000,  // Throttle refetch on focus
    revalidateOnFocus: false,      // Disable aggressive refetch
}}>
```

**MUST PRESERVE**: Immediate refresh after sending message (`mutate()`).

### 7.4 Component Memoization

**Problem**: Child components re-render when parent updates unrelated state.

**Solution**:
```typescript
const MessageBubble = React.memo(function MessageBubble({ message, onOpenArtifact }) {
    // ... component logic
});
```

---

## 8. Behavior Contracts Summary

| Contract | Description | Location |
|----------|-------------|----------|
| BC-1 | First message must NOT trigger full page reload | ChatMainArea:505-520 |
| BC-2 | Artifact/sidebar state persists across shallow URL updates | ChatLayoutContext:160-190 |
| BC-3 | Sidebar lists refresh after message (history, resources, artifacts) | ChatMainArea:492-527 |
| BC-4 | Chat history deduplication (no duplicate entries) | CollapsibleSidebar:65-67 |
| BC-5 | Guest users see empty lists, not errors | All SWR keys include `user` guard |
| BC-6 | Active artifact opens right sidebar in expanded mode | ChatLayoutContext:239-250 |
| BC-7 | New chat navigation clears messages and state | ChatLayoutContext:232-238 |

---

## 9. Testing Checklist

Before accepting any optimization PR, verify:

- [ ] New chat: First message updates URL without page reload
- [ ] New chat: Left sidebar shows new conversation immediately
- [ ] New chat: Message history persists after URL update
- [ ] Artifact: AI-generated artifact appears in right sidebar without reload
- [ ] Artifact: Clicking artifact in message opens right sidebar
- [ ] Artifact: No duplicate artifacts in list
- [ ] Resources: Uploaded file appears in left sidebar
- [ ] Resources: Drag-and-drop attach works
- [ ] Guest: No console errors, graceful empty states
- [ ] Performance: Smooth scrolling with 50+ messages

---

## 10. Appendix: Key Files Reference

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `ChatLayoutContext.tsx` | Central state management | 160-190 (sessionStorage), 232-238 (reset) |
| `ChatMainArea.tsx` | Chat logic, streaming | 411-541 (handleSend), 505-520 (URL update) |
| `ChatRightSidebar.tsx` | Artifact display | 35-38 (SWR fetch), 85-108 (list render) |
| `CollapsibleSidebar.tsx` | Left sidebar | 59-67 (chat history), 75-85 (resources) |
| `aiTutorService.ts` | API client | 220-257 (streamChat), 31-40 (artifact mapping) |

---

**End of Report**

*This document should be provided to consultants along with access to the codebase. Any proposed changes must demonstrate preservation of the behavior contracts listed in Section 8.*
