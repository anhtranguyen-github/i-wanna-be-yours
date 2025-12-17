# Authentication & Feature Access Policy

## Overview

hanachan.org follows a **guest-friendly access model** where:

- **All UI and navigation is visible to guests** - No features are hidden behind login
- **Authentication is required at action time** - Only when users try to save/personalize
- **Login prompts double as conversion opportunities** - Show value proposition

## Feature Access Matrix

| Feature | Guest Can View | Auth Required For |
|---------|----------------|-------------------|
| **Dashboard** | ✅ View with demo data | Personalized progress |
| **Study Plan** | ✅ Browse all templates | Create/save plans |
| **Study Plan Settings** | ❌ (requires existing plan) | All actions |
| **Study Plan Milestones** | ❌ (requires existing plan) | All actions |
| **Flashcards** | ✅ Browse all decks | Save progress, create decks |
| **Quiz List** | ✅ Browse all quizzes | - |
| **Quiz Creator** | ✅ Full UI access | Save quiz |
| **Take Quiz** | ✅ Full access | Save score to history |
| **Chat (AI Tutor)** | ✅ Limited messages | Full conversations, history |
| **Library Podcasts** | ✅ Browse all content | Add personal videos |
| **Library Reading** | ✅ Full access | - |
| **Library Mnemonics** | ✅ Full access | - |
| **Tools** | ✅ Full access | - |
| **Knowledge Base** | ✅ Full access | - |
| **JLPT Exams** | ✅ Full access | Save results |

## Implementation Patterns

### 1. AuthPromptModal Component

Located at: `src/components/auth/AuthPromptModal.tsx`

Usage:
```tsx
import { useAuthPrompt } from '@/components/auth/AuthPromptModal';

function MyComponent() {
    const { user } = useUser();
    const { showAuthPrompt, AuthPrompt } = useAuthPrompt();
    const isGuest = !user;
    
    const handleAction = () => {
        if (isGuest) {
            showAuthPrompt('Feature Name', 'Describe what user gains by signing up');
            return;
        }
        // Proceed with action
    };
    
    return (
        <>
            <AuthPrompt />
            <button onClick={handleAction}>Do Action</button>
        </>
    );
}
```

### 2. Guest Banner Pattern

For pages with demo data, show a non-intrusive banner:

```tsx
{isGuest && (
    <div className="mb-6 p-4 bg-gradient-to-r from-brand-green to-brand-blue rounded-2xl text-white">
        <p className="font-bold">👋 You're viewing demo data</p>
        <p>Create a free account to track your real progress.</p>
        <a href="/login" className="btn-white">Sign Up Free</a>
    </div>
)}
```

### 3. Auth-Required Subpages Pattern

For pages that **require** an existing user context (e.g., managing a plan):

```tsx
useEffect(() => {
    if (!userLoading && !user) {
        router.push('/login?redirect=/study-plan/settings');
        return;
    }
    // ... load user data
}, [user, userLoading]);
```

## UX Principles

1. **No dead ends** - Guests can always navigate and browse
2. **No blank screens** - Show demo/sample data when real data isn't available
3. **Clear value communication** - Explain benefits of creating an account
4. **Non-intrusive prompts** - Modal appears only on action attempt
5. **Smooth flow** - After signup, redirect back to intended action

## Pages Updated

### ✅ Full Guest Access (with demo data/banners)
- `/dashboard` - Shows demo data for guests with signup banner
- `/study-plan` - Always shows "View My Plans" (prompts auth if clicked without account)
- `/library/podcasts` - Shows all content, prompts auth on "Add Video"
- `/quiz/create` - Full UI access, prompts auth on save
- `/practice/quiz/create` - Full UI access, prompts auth on save

### ✅ Full Guest Access (no auth needed)
- `/library/reading` - Read-only content
- `/library/mnemonics` - Read-only content
- `/knowledge-base/*` - Read-only reference
- `/tools/*` - Utility tools
- `/flashcards` - Browse decks (auth for progress tracking)
- `/quiz` - Browse and take quizzes (auth for history)
- `/jlpt` - Take practice exams (auth for history)

### ⚠️ Auth Required (managing personal data)
- `/study-plan/settings` - Requires existing plan
- `/study-plan/milestones/*` - Requires existing plan
- `/study-plan/assessments` - Requires existing plan
- `/study-plan/dashboard` - Shows user's plans (redirects if no plans)

## Components Created

1. `src/components/auth/AuthPromptModal.tsx` - Reusable auth prompt modal with value proposition
