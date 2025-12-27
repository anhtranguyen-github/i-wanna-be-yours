# Plan: Quoot Deck Detail Implementation

## Objective
Transform the Quoot user journey by introducing a high-fidelity "Deck Detail" page that acts as a lobby before entering the game. This page will provide social context, stats, and item previews.

## Aesthetics & Design
- **Theme**: "High-Octane Arcade" - Vibrant colors, glassmorphism, pulse animations, and bold typography.
- **Guest Experience**: Limited stats view, prompt to login for leaderboard participation, "Try Demo" button.
- **User Experience**: Full historical records, personal high scores, "Edit" access for creators, and shareable link generation.

## Route Structure
- **New Path**: `/quoot/details/[deckId]/page.tsx`
- **Updated Hub**: `/quoot/page.tsx` will now link to the new details route instead of the session directly.
- **Session**: `/quoot/[deckId]/page.tsx` (Remains the game session).

## Feature Set
1. **Dynamic Header**: Display deck title, difficulty rating, and primary tags with holographic effects.
2. **Stats Grid**:
    - Global High Score & Player.
    - Personal Best (if logged in).
    - Play Count & Popularity.
3. **Item Browser**: Scrollable list of questions included in the deck with "Reveal" hover effects.
4. **Action Command Center**:
    - **PLAY NOW**: Large, primary action.
    - **SHARE**: Copy deck ID with success toast.
    - **EDIT**: Visible only to deck owner.
5. **Activity Feed**: Micro-list of recent players and their scores.

## Checklist
- [ ] **Phase 1: Route & Data Architecture**
    - [ ] Create folder `/src/app/quoot/details/[deckId]`.
    - [ ] Implement `quootService.getDeckById` (if not already existing with full detail).
    - [ ] Standardize `QuootDetail` type.
- [ ] **Phase 2: Core Layout & Aesthetics**
    - [ ] Implementation of the Arcade-themed container.
    - [ ] Responsive grid for Stats and Info.
- [ ] **Phase 3: Interactive Components**
    - [ ] "Reveal" browser for Quoot items.
    - [ ] Share ID button with clipboard logic.
    - [ ] Activity/Record list component.
- [ ] **Phase 4: Guest/User Logic**
    - [ ] Implement `useUser` context checks for conditional feature rendering.
    - [ ] Add "Login to save progress" call-to-action for guests.
- [ ] **Phase 5: Verification**
    - [ ] Test navigation flow from `/quoot` -> Details -> Session.
    - [ ] Verify owner-only edit visibility.
    - [ ] Build and performance audit.
