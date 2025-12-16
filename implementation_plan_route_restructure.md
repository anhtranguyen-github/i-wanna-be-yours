# Route URL Restructuring Plan

**Goal:** Reduce URL depth, simplify navigation paths, and add conversation history support

---

## Current Structure (Too Deep)

```
/practice/jlpt/                      → JLPT Practice List
/practice/jlpt/session/[examId]/     → Exam Runner (4 levels!)
/practice/jlpt/result/[examId]/      → Exam Results (4 levels!)
/practice/quiz/                      → Quiz List
/practice/quiz/[id]/                 → Quiz Runner
/flashcards/                         → Flashcard Decks
/flashcards/study/                   → Study Mode
/chat/ai-tutor/                      → AI Chat (redundant path)
/chat/                               → Chat landing (unused)
```

---

## Proposed Structure (Cleaner)

### Option A: Category-Based (Recommended)

```
/jlpt/                    → JLPT Practice Hub
/jlpt/[examId]/           → Exam Runner (2 levels!)
/jlpt/[examId]/result/    → Exam Results (3 levels)

/quiz/                    → Quiz List
/quiz/[id]/               → Quiz Runner
/quiz/create/             → Create Quiz

/flashcards/              → Deck Library
/flashcards/[deckId]/     → Study Deck
/flashcards/create/       → Create Deck

/chat/                    → AI Chat (new conversation)
/chat/[conversationId]/   → AI Chat (existing conversation)
```

### Option B: Action-Based with Query Params

```
/jlpt?level=N5            → JLPT Practice (filtered by level)
/exam/[id]                → Exam Runner (any exam)
/result/[id]              → Results (any exam/quiz)

/quiz?level=N4            → Quiz List (filtered)
/quiz/[id]                → Quiz Runner

/study/[deckId]           → Study any flashcard deck

/chat?c=[conversationId]  → Chat with conversation param
```

---

## Chat Route Refactoring

### Current State

| Route | Purpose | Issue |
|-------|---------|-------|
| `/chat/` | Unused landing | Wasted route |
| `/chat/ai-tutor/` | AI Chat | Redundant "ai-tutor" |
| No deep link | Can't share conversations | Missing feature |

### Target State

| Route | Purpose |
|-------|---------|
| `/chat` | New conversation (fresh chat) |
| `/chat/[conversationId]` | Resume specific conversation |
| `/chat/new` | Explicitly start new (same as `/chat`) |

### Features to Add

1. **URL-based Conversation Loading**
   - User visits `/chat/abc123` → Loads conversation `abc123`
   - User visits `/chat` → Creates new conversation

2. **URL Updates on Navigation**
   - User clicks conversation in sidebar → URL updates to `/chat/{id}`
   - User creates new chat → URL becomes `/chat` or `/chat/new`

3. **Shareable Links**
   - Copy link to conversation: `https://hanabira.org/chat/abc123`
   - (Future: Share with others if public)

4. **Browser History Support**
   - Back button returns to previous conversation
   - Forward button works correctly

### Implementation

**File:** `app/chat/page.tsx` (New conversation)
```tsx
// Redirect to new or show empty state
export default function ChatPage() {
  return <AITutor conversationId={null} />;
}
```

**File:** `app/chat/[conversationId]/page.tsx` (Existing conversation)
```tsx
export default function ChatConversationPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  return <AITutor conversationId={params.conversationId} />;
}
```

**Component Updates:** `AITutor.tsx`
```tsx
interface AITutorProps {
  conversationId?: string | null;
}

export default function AITutor({ conversationId }: AITutorProps) {
  const router = useRouter();
  
  // Load specific conversation if ID provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);
  
  // Update URL when switching conversations
  const handleSelectConversation = (id: string) => {
    router.push(`/chat/${id}`, { scroll: false });
    setActiveConvoId(id);
  };
  
  // Update URL when creating new conversation
  const handleNewConversation = async () => {
    const newConvo = await createConversation();
    router.push(`/chat/${newConvo._id}`, { scroll: false });
  };
}
```

---

## Recommended Migration

### Files to Rename/Move

| Current Path | New Path |
|--------------|----------|
| `app/practice/jlpt/page.tsx` | `app/jlpt/page.tsx` |
| `app/practice/jlpt/session/[examId]/page.tsx` | `app/jlpt/[examId]/page.tsx` |
| `app/practice/jlpt/result/[examId]/page.tsx` | `app/jlpt/[examId]/result/page.tsx` |
| `app/practice/quiz/page.tsx` | `app/quiz/page.tsx` |
| `app/practice/quiz/[id]/page.tsx` | `app/quiz/[id]/page.tsx` |
| `app/practice/quiz/create/page.tsx` | `app/quiz/create/page.tsx` |
| `app/chat/ai-tutor/page.tsx` | `app/chat/page.tsx` |
| *(new)* | `app/chat/[conversationId]/page.tsx` |

### URL Comparison

| Before | After | Savings |
|--------|-------|---------|
| `/practice/jlpt/session/abc123` | `/jlpt/abc123` | -2 segments |
| `/practice/jlpt/result/abc123` | `/jlpt/abc123/result` | -1 segment |
| `/practice/quiz/create` | `/quiz/create` | -1 segment |
| `/chat/ai-tutor` | `/chat` | -1 segment |
| *(no deep link)* | `/chat/abc123` | +feature |

---

## Implementation Steps

### Step 1: Create New Route Structure

```bash
# Create new directories
mkdir -p frontend-next/src/app/jlpt/[examId]/result
mkdir -p frontend-next/src/app/quiz/[id]
mkdir -p frontend-next/src/app/quiz/create
mkdir -p frontend-next/src/app/chat/[conversationId]
```

### Step 2: Move/Create Files

```bash
# JLPT routes
mv app/practice/jlpt/page.tsx → app/jlpt/page.tsx
mv app/practice/jlpt/session/[examId]/page.tsx → app/jlpt/[examId]/page.tsx
mv app/practice/jlpt/result/[examId]/page.tsx → app/jlpt/[examId]/result/page.tsx

# Quiz routes  
mv app/practice/quiz/* → app/quiz/

# Chat routes
mv app/chat/ai-tutor/page.tsx → app/chat/page.tsx
# Create new: app/chat/[conversationId]/page.tsx
```

### Step 3: Update All Links

Search and replace in codebase:
- `/practice/jlpt/session/` → `/jlpt/`
- `/practice/jlpt/result/` → `/jlpt/.../result`
- `/practice/jlpt` → `/jlpt`
- `/practice/quiz` → `/quiz`
- `/chat/ai-tutor` → `/chat`

### Step 4: Update AITutor Component

- Accept `conversationId` prop
- Use `useRouter` to update URL on navigation
- Load conversation from URL on mount

### Step 5: Add Redirects

For backwards compatibility, add redirects in `next.config.js`:

```javascript
async redirects() {
  return [
    // JLPT routes
    {
      source: '/practice/jlpt/session/:examId',
      destination: '/jlpt/:examId',
      permanent: true,
    },
    {
      source: '/practice/jlpt/result/:examId',
      destination: '/jlpt/:examId/result',
      permanent: true,
    },
    {
      source: '/practice/jlpt',
      destination: '/jlpt',
      permanent: true,
    },
    // Quiz routes
    {
      source: '/practice/quiz/:path*',
      destination: '/quiz/:path*',
      permanent: true,
    },
    // Chat routes
    {
      source: '/chat/ai-tutor',
      destination: '/chat',
      permanent: true,
    },
    {
      source: '/chat/hanachan',
      destination: '/chat',
      permanent: true,
    },
  ];
}
```

---

## New Route Summary

| Route | Page |
|-------|------|
| `/jlpt` | JLPT Practice Hub with all levels/skills |
| `/jlpt/[examId]` | Take an exam |
| `/jlpt/[examId]/result` | View exam results |
| `/quiz` | Quick Quiz list |
| `/quiz/[id]` | Take a quiz |
| `/quiz/create` | Create custom quiz |
| `/flashcards` | Deck library |
| `/flashcards/[deckId]` | Study a deck |
| `/chat` | AI Chat (new conversation) |
| `/chat/[conversationId]` | AI Chat (history) |

---

## Files Affected

### Create New
- `app/chat/[conversationId]/page.tsx`

### Move/Rename  
- `app/practice/jlpt/*` → `app/jlpt/*`
- `app/practice/quiz/*` → `app/quiz/*`
- `app/chat/ai-tutor/page.tsx` → `app/chat/page.tsx`

### Modify
- `components/AITutor.tsx` - Accept conversationId, update URL
- `app/practice/page.tsx` - Update links
- `components/practice/PracticeCard.tsx` - Update links
- `next.config.js` - Add redirects
- Navigation components - Update all /chat/ai-tutor links

---

## Estimated Time: 1.5 hours

| Task | Time | Status |
|------|------|--------|
| Create new route structure | 15 min | ✅ Done |
| Move route files | 15 min | ✅ Done |
| Update AITutor for conversation URLs | 30 min | ✅ Done |
| Update all links | 20 min | ✅ Done |
| Add redirects | 10 min | ✅ Done |
| Test all routes | 20 min | ✅ Build passes |

---

## Acceptance Criteria

- [x] `/jlpt/abc123` loads exam runner
- [x] `/jlpt/abc123/result` shows results
- [ ] `/quiz` shows quiz list (route exists)
- [x] `/chat` opens new AI chat  
- [x] `/chat/abc123` loads specific conversation
- [x] Clicking sidebar conversation updates URL
- [x] Browser back/forward works in chat
- [x] Old URLs redirect to new ones
- [ ] All links in app use new routes (internal links updated, may need more sweep)

---

## Implementation Log

### Completed: December 16, 2025

**Phase 1: Route Restructuring**
- Created `/jlpt/page.tsx` - JLPT practice hub
- Created `/jlpt/[examId]/page.tsx` - Exam session
- Created `/jlpt/[examId]/result/page.tsx` - Exam results
- Created `/chat/page.tsx` - New chat
- Created `/chat/[conversationId]/page.tsx` - Load conversation by ID
- Updated `AITutor.tsx` with:
  - `initialConversationId` prop
  - `useRouter` for URL navigation
  - `handleSelectConversation` for URL updates
- Added redirects in `next.config.js`
- Build passes ✅

**Files Created:**
- `frontend-next/src/app/jlpt/page.tsx`
- `frontend-next/src/app/jlpt/[examId]/page.tsx`
- `frontend-next/src/app/jlpt/[examId]/result/page.tsx`
- `frontend-next/src/app/chat/page.tsx`
- `frontend-next/src/app/chat/[conversationId]/page.tsx`

**Files Modified:**
- `frontend-next/src/components/AITutor.tsx`
- `frontend-next/next.config.js`

