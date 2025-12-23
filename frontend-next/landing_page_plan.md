# Implementation Plan: Premium SaaS Landing Page for Hanabira

## 1. Visual Strategy & Brand Identity
*   **Theme**: Modern "Premium Matcha/Light" aesthetic.
*   **Colors**: Matcha Green (`primary`), Slate/Navy (`slate-900`), and Cream/Rice Paper (`F8FAFC`).
*   **Typography**: Use `font-black` and `font-display` (Fredoka) for impact, with wide tracking on headers.
*   **Visual Elements**: 
    *   Glassmorphism (blur backgrounds).
    *   Claymorphism (soft rounded shadows).
    *   Entrance animations (fade-in, slide-up).

## 2. Core Components Redesign
### A. `Navbar.tsx`
*   Change logo to "Hanabira" with a Matcha petal icon.
*   Update to glassmorphism style.
*   Thematic navigation: "Strategic Center" (Dashboard), "Linguistic Lab" (Tools), "Resource Library".

### B. `Hero.tsx`
*   **Headline**: "Master Japanese with Strategic Intelligence."
*   **Value Proposition**: Move away from "Generic Tutor" to "Linguistic Command Center".
*   **Visual**: Generate a high-fidelity mockup showing the Dashboard + AI Parser.
*   **CTA**: "Initiate Strategy" and "Explore Lab".

### C. `FeatureGrid.tsx` (New)
*   A Bento-Grid layout showcasing:
    1.  **Semantic Intelligence**: The Text Parser and Word Details.
    2.  **Strategic Management**: OKRs, SMART goals, and PACT daily habits.
    3.  **Visual Grammar**: The Grammar Graph relationships.
    4.  **Content Immersion**: reading stories and podcasts.

### D. `StrategicLoop.tsx` (New)
*   A visual section explaining the learning cycle:
    1.  **Define** (OKR/SMART).
    2.  **Commit** (PACT).
    3.  **Analyze** (Linguistic Tools).
    4.  **Retain** (Review System).

### E. `ToolKitShowcase.tsx` (New)
*   A premium scrolling marquee of the tool icons: Parser, Graph, Translate, Kanji, Vocab.

## 3. Implementation Workflow
1.  **Prepare Design Tokens**: Verify `globals.css` reflects the Matcha theme.
2.  **Build New Sections**: Create `FeatureGrid`, `StrategicLoop`, and `ToolKitShowcase`.
3.  **Refresh Hero & Navbar**: Apply the new premium styling and copy.
4.  **Assemble Landing Page**: Update `src/app/page.tsx` with the new sections.
5.  **Refine Animations**: Add subtle micro-interactions to make the page "feel" alive.

## 4. Copywriting Focus
*   Keywords: "Intelligence", "Command", "Strategic", "System", "Acquisition", "Mastery".
*   Tone: Professional, ambitious, and precise.
