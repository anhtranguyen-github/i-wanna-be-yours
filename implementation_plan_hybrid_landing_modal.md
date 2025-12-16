# Hybrid Landing Page Modal - Migration Plan

## Executive Summary

This document outlines the migration strategy for merging the existing standalone Landing Page (`/app/page.tsx`) into a new **Hybrid Landing Modal** that appears on app load. The goal is to create a conversion-focused modal that showcases key value propositions while preserving the full landing page for SEO/marketing purposes.

**Key Decisions:**
- The modal will be a **condensed, conversion-optimized** version of the landing page
- The full landing page remains intact for SEO and direct marketing traffic
- Shared components will be extracted to avoid code duplication
- Modal will trigger on app load and close on backdrop click or CTA interaction

---

## 1. Existing Landing Page Audit

### 1.1 Section Inventory

| Section | Content Summary | Lines | Size |
|---------|-----------------|-------|------|
| **Hero** | Headline, version badge, tagline, CTAs, features grid | 79-141 | Large |
| **Email Form** | Newsletter signup | 143-145 | Small |
| **Self-Host Docker** | Code snippet for self-hosting | 147-156 | Small |
| **Right Hero Image** | Screenshot collage | 160-176 | Visual |
| **Deep Dive Header** | Section title | 183-187 | Small |
| **Feature: Text Parser** | Description + screenshot | 189-204 | Medium |
| **Feature: YouTube** | Description + screenshot | 206-221 | Medium |
| **Feature: Grammar Graph** | Description + screenshot | 223-238 | Medium |

### 1.2 Section Classification

| Section | Modal Classification | Rationale |
|---------|---------------------|-----------|
| **Hero Headline** | ✅ MUST be inside modal | Core value proposition |
| **Hero Tagline** | ✅ MUST be inside modal | Explains product |
| **Primary CTA (Get Started)** | ✅ MUST be inside modal | Conversion driver |
| **Features Grid (6 items)** | ⚠️ COMPRESS to 3-4 icons | Too dense for modal |
| **Version Badge** | ❌ REMOVE from modal | Not conversion-focused |
| **Email Form** | ❌ OPTIONAL (below fold) | Secondary conversion |
| **Docker Self-Host** | ❌ REMOVE from modal | Technical detail |
| **Hero Images** | ⚠️ SINGLE image only | Visual anchor |
| **Deep Dive Sections** | ❌ KEEP on landing only | Too long for modal |

---

## 2. Content Mapping: Landing Page → Modal

### 2.1 Section Mapping Table

| Landing Page Section | Modal Section | Treatment |
|---------------------|---------------|-----------|
| Hero Headline ("Your path to Japanese...") | Modal Headline | **Swap** to JLPT-focused: "Master the JLPT with the Ultimate Study Platform" |
| Hero Tagline | Modal Sub-headline | Compress to single line |
| Version Badge ("Alpha v0.3.8") | — | Remove |
| Features Grid (6 items) | Trust Icons Row | Compress to 4 feature icons |
| Primary CTA ("Get Started") | Primary CTA | Change to "Get Lifetime Premium Access" |
| Secondary CTA ("GitHub") | Secondary CTA | Change to "Continue to Free Version" |
| Email Form | — | Omit (or below fold) |
| Docker Block | — | Omit |
| Hero Image (Text Parser) | Single Visual | Use one screenshot |
| — | **NEW: Limited Offer Banner** | Add red banner at top |
| — | **NEW: Social Proof** | Add avatars + "10,000+ students" |
| — | **NEW: Trust Badges** | Add 5-star ratings |
| Deep Dive Features | — | Keep on landing page only |

### 2.2 Copy Changes Summary

| Element | Original Copy | Modal Copy |
|---------|--------------|------------|
| Headline | "Your path to Japanese & Korean fluency" | "Master the JLPT with the Ultimate Study Platform" |
| Sub-headline | Multiple lines + languages | "Comprehensive practice tests, vocabulary flashcards, and grammar explanations for all levels." |
| Primary CTA | "Get Started" | "Get Lifetime Premium Access" |
| Secondary CTA | "GitHub" | "Continue to Free Version" |
| Social Proof | None | "Join 10,000+ students acing their JLPT exams daily" |

---

## 3. Component Architecture Proposal

### 3.1 Component Tree

```
src/
├── components/
│   ├── landing/
│   │   ├── LandingHero.tsx           # Full landing hero (existing)
│   │   ├── LandingFeatureCard.tsx    # Deep dive feature cards
│   │   ├── LandingEmailForm.tsx      # Newsletter form
│   │   └── LandingDockerBlock.tsx    # Self-host code block
│   │
│   ├── shared/
│   │   ├── FeatureIconGrid.tsx       # ✅ SHARED: Feature icons (configurable count)
│   │   ├── SocialProofRow.tsx        # ✅ SHARED: Avatars + student count
│   │   ├── TrustBadges.tsx           # ✅ SHARED: Star ratings
│   │   └── CTAButton.tsx             # ✅ SHARED: Primary/Secondary CTA
│   │
│   └── modal/
│       ├── HybridLandingModal.tsx    # Modal container + logic
│       ├── ModalOfferBanner.tsx      # Red "Limited Time" banner
│       ├── ModalHero.tsx             # Condensed hero + CTA
│       ├── ModalSocialProof.tsx      # Wrapper using SocialProofRow
│       └── ModalTrustBadges.tsx      # Wrapper using TrustBadges
│
├── app/
│   ├── page.tsx                      # Landing page (keep existing)
│   └── layout.tsx                    # Injects HybridLandingModal
```

### 3.2 Component Responsibilities

| Component | Used By | Responsibility |
|-----------|---------|----------------|
| `FeatureIconGrid` | Landing + Modal | Displays feature icons (configurable: 6 for landing, 4 for modal) |
| `SocialProofRow` | Modal only | Avatars + student count text |
| `TrustBadges` | Modal only | 5-star badges from stores |
| `CTAButton` | Landing + Modal | Primary/Secondary button with variants |
| `HybridLandingModal` | App Shell | Modal container, backdrop, close logic |
| `ModalHero` | Modal | Condensed headline + sub-headline |
| `ModalOfferBanner` | Modal | Red "Limited Time Offer" strip |

### 3.3 Shared vs Modal-Only

| Type | Components |
|------|------------|
| **Shared** | `FeatureIconGrid`, `CTAButton` |
| **Modal-Only** | `HybridLandingModal`, `ModalOfferBanner`, `SocialProofRow`, `TrustBadges`, `ModalHero` |
| **Landing-Only** | `LandingHero`, `LandingFeatureCard`, `LandingEmailForm`, `LandingDockerBlock` |

---

## 4. Layout & UX Strategy

### 4.1 Modal Dimensions & Scroll

```
┌─────────────────────────────────────────────────────────────┐
│ ██████████████████  BACKDROP (dark blur)  ███████████████████│
│ ██                                                        ██│
│ ██  ┌────────────────────────────────────────────────┐   ██│
│ ██  │ 🔴 LIMITED TIME OFFER - 50% OFF               │   ██│
│ ██  ├────────────────────────────────────────────────┤   ██│
│ ██  │                                                │   ██│
│ ██  │      Master the JLPT with the Ultimate         │   ██│ ← ABOVE FOLD
│ ██  │           Study Platform                       │   ██│
│ ██  │                                                │   ██│
│ ██  │    Comprehensive practice tests...             │   ██│
│ ██  │                                                │   ██│
│ ██  │    👥👥👥 Join 10,000+ students...            │   ██│
│ ██  │                                                │   ██│
│ ██  │    ⭐⭐⭐ Trust Badges                         │   ██│
│ ██  │                                                │   ██│
│ ██  │  ┌─────────────────────────────────────────┐  │   ██│
│ ██  │  │    [Get Lifetime Premium Access]        │  │   ██│ ← PRIMARY CTA
│ ██  │  └─────────────────────────────────────────┘  │   ██│
│ ██  │                                                │   ██│
│ ██  │        Continue to Free Version →              │   ██│ ← SECONDARY
│ ██  │                                                │   ██│
│ ██  │ ─────────────────────────────────────────────── │   ██│
│ ██  │                                                │   ██│ ← SCROLL ZONE
│ ██  │    📖 📝 🎮 📚  Feature Icons                  │   ██│   (optional)
│ ██  │                                                │   ██│
│ ██  └────────────────────────────────────────────────┘   ██│
│ ██                                                        ██│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Above-Fold Priority

| Priority | Content | Rationale |
|----------|---------|-----------|
| 1 | Offer Banner | Urgency + attention |
| 2 | Headline + Sub-headline | Value proposition |
| 3 | Social Proof | Trust building |
| 4 | Trust Badges | Reinforcement |
| 5 | Primary CTA | Conversion |
| 6 | Secondary CTA | Exit path |

### 4.3 CTA Strategy

| CTA | Behavior |
|-----|----------|
| **Primary: "Get Lifetime Premium Access"** | Navigate to `/pricing` or `/checkout` |
| **Secondary: "Continue to Free Version"** | Close modal, reveal app |
| **Backdrop Click** | Close modal, reveal app |
| **ESC Key** | Close modal |

### 4.4 Modal Will NOT Feel Overwhelming Because:

1. **Single clear headline** (not multiple taglines)
2. **Compressed features** (4 icons vs 6 cards)
3. **Visual hierarchy** (banner → headline → CTA flow)
4. **Generous whitespace** inside modal
5. **Clear exit path** (secondary CTA + backdrop click)
6. **No email form** (reduces cognitive load)

---

## 5. Behavioral Integration Plan

### 5.1 Modal Trigger Rules

| Trigger | Behavior |
|---------|----------|
| **App load/refresh** | Show modal immediately |
| **Local storage** | NOT used (modal always shows) |
| **URL `/`** | Normal landing page (no modal) |
| **URL `/chat`, `/tools`, etc.** | Modal appears on first load |

### 5.2 Modal Visibility Logic

```typescript
// In AppShell or Layout
const [showModal, setShowModal] = useState(true);

// On close
const handleClose = () => setShowModal(false);
```

### 5.3 Interaction Flow

```
User visits app
       │
       ▼
┌──────────────────┐
│   Modal Shows    │ (immediately, no delay)
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[Primary]  [Secondary / Backdrop]
    │              │
    ▼              ▼
Navigate to    Close modal
/pricing       Show app
```

### 5.4 Routing Considerations

| Route | Modal Behavior |
|-------|----------------|
| `/` (landing page) | **NO modal** - user is already on marketing page |
| `/chat`, `/tools`, etc. | **Show modal** on load |
| `/login`, `/pricing` | **NO modal** - user is in conversion flow |

**Implementation:**

```typescript
// Check if we should show modal
const pathname = usePathname();
const shouldShowModal = !['/','login', '/pricing', '/checkout'].some(p => pathname?.startsWith(p));
```

---

## 6. Migration Steps

### Phase 1: Extract Shared Components (Est: 1 hour)

1. **Create `/components/shared/` folder**
2. **Extract `FeatureIconGrid.tsx`**
   - Accept `items` prop
   - Accept `maxItems` prop (default: all)
   - Accept `layout` prop: 'grid' | 'row'
3. **Extract `CTAButton.tsx`**
   - Variants: primary, secondary
   - Accept `href` and `onClick`
4. **Test landing page still works**

### Phase 2: Create Modal Components (Est: 1.5 hours)

1. **Create `/components/modal/` folder**
2. **Create `HybridLandingModal.tsx`**
   - Backdrop with blur + click-to-close
   - Internal scroll container
   - Z-index: 9999
3. **Create `ModalOfferBanner.tsx`**
   - Red background, white text
   - "LIMITED TIME OFFER" messaging
4. **Create `ModalHero.tsx`**
   - JLPT-focused headline
   - Condensed sub-headline
5. **Create `SocialProofRow.tsx`**
   - Avatar images (can use placeholders)
   - "10,000+ students" text
6. **Create `TrustBadges.tsx`**
   - Star ratings
   - Store badges

### Phase 3: Integrate Modal into App (Est: 30 min)

1. **Update `AppShell.tsx`** (or create `ModalProvider.tsx`)
2. **Add modal visibility state**
3. **Implement route-based logic** (don't show on `/`)
4. **Test modal appears on `/chat`, `/tools`, etc.**
5. **Test close behavior**

### Phase 4: Polish & Verify (Est: 30 min)

1. **Verify landing page SEO unchanged**
   - Same metadata
   - Same content
   - Same URLs
2. **Test responsive behavior**
   - Mobile: Modal fills 95% width
   - Desktop: Modal at 1000px max-width
3. **Test all close methods**
   - Backdrop click
   - Secondary CTA
   - ESC key
4. **Build verification**

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Modal annoys returning users | High | Consider adding "Don't show again" option in Phase 2 |
| SEO impact on landing page | High | Keep landing page completely separate, verify metadata |
| Modal blocks app access | Medium | Multiple clear exit paths (backdrop + CTA) |
| Component duplication | Low | Extract shared components first |
| Build failures | Low | Test after each phase |

---

## 8. Success Criteria

- [ ] Modal appears on app load (non-landing routes)
- [ ] Modal closes on backdrop click
- [ ] Modal closes on "Continue to Free Version"
- [ ] Primary CTA navigates to pricing/conversion page
- [ ] Landing page unchanged and functional
- [ ] Build passes
- [ ] Mobile responsive
- [ ] No local storage dependency (always shows on refresh)

---

## 9. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `components/shared/FeatureIconGrid.tsx` | Shared feature display |
| `components/shared/CTAButton.tsx` | Shared CTA buttons |
| `components/modal/HybridLandingModal.tsx` | Modal container |
| `components/modal/ModalOfferBanner.tsx` | Red offer banner |
| `components/modal/ModalHero.tsx` | Condensed hero |
| `components/modal/SocialProofRow.tsx` | Avatar + text |
| `components/modal/TrustBadges.tsx` | Store ratings |
| `components/modal/index.ts` | Exports |

### Modified Files

| File | Change |
|------|--------|
| `components/sidebar/AppShell.tsx` | Add modal provider/state |
| `app/page.tsx` | Extract features array to shared data |

### Deleted Files

None - landing page remains intact.

---

## 10. Estimated Timeline

| Phase | Time |
|-------|------|
| Phase 1: Extract Shared Components | 1 hour |
| Phase 2: Create Modal Components | 1.5 hours |
| Phase 3: Integrate Modal | 30 min |
| Phase 4: Polish & Verify | 30 min |
| **Total** | **~3.5 hours** |

---

## Appendix: Visual Reference

### Landing Page Sections (Current)

```
┌─────────────────────────────────────────────────────────────┐
│  🌸 Version Badge                                           │
│                                                             │
│  YOUR PATH TO JAPANESE & KOREAN FLUENCY                     │
│  日本語理解への道 / 한국어 이해를 위한 길입니다                  │
│                                                             │
│  Prepare for JLPT/TOPIK with hanabira.org...                │
│                                                             │
│  [Get Started]  [GitHub]                                    │
│                                                             │
│  ✨ Key Features:                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │ YT     │ │ Parser │ │ Grammar│                           │
│  └────────┘ └────────┘ └────────┘                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │ SRS    │ │ Mining │ │ Kanji  │                           │
│  └────────┘ └────────┘ └────────┘                           │
│                                                             │
│  📧 Newsletter Form                                         │
│                                                             │
│  🐳 Docker Self-Host Block                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DEEP DIVE INTO LEARNING                                    │
│                                                             │
│  [Text Parser Feature Card + Image]                         │
│  [YouTube Feature Card + Image]                             │
│  [Grammar Graph Feature Card + Image]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modal Layout (Target)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 JLPT N1-N5 FULL ACCESS - 50% OFF - THIS WEEK ONLY        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│            MASTER THE JLPT WITH THE                         │
│           ULTIMATE STUDY PLATFORM                           │
│                                                             │
│      Comprehensive practice tests, vocabulary               │
│      flashcards, and grammar explanations.                  │
│                                                             │
│      👤👤👤👤👤 Join 10,000+ students...                   │
│                                                             │
│      ⭐⭐⭐⭐⭐ App Store  |  Play Store  |  Community       │
│                                                             │
│      ┌─────────────────────────────────────────┐            │
│      │      GET LIFETIME PREMIUM ACCESS        │            │
│      └─────────────────────────────────────────┘            │
│                                                             │
│              Continue to Free Version →                     │
│                                                             │
│─────────────────────────────────────────────────────────────│
│                                                             │
│      📖 📝 🎮 📚  (Feature Icons Row)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Status:** Ready for Implementation  
**Author:** Code Agent  
**Date:** December 16, 2025
