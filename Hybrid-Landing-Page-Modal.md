Subject: Implement a Hybrid Landing Page Modal for JLPT Exam Prep SaaS

Context: I want to build a promotional "Hybrid Landing Modal" that appears immediately when a user visits or refreshes the app, without requiring a login. This modal functions as a mini-landing page to drive conversions for a premium JLPT exam prep package.

Core Requirements:

Behavior: - The modal must trigger automatically on page load/refresh.

It should NOT be stored in local storage (it should reappear every time the page is refreshed).

Click-outside-to-close: If the user clicks on the backdrop (outside the modal content), the modal must close to reveal the main app interface.

Visual Design (Hybrid Style):

Dimensions: The modal should be large, covering about 80-90% of the screen width and height (max-width around 1000px-1200px), but not 100% so that the app's dark background is still visible at the edges.

Backdrop: A dark, semi-transparent overlay (e.g., rgba(0,0,0,0.7)) that blurs the main app behind it.

Internal Scroll: If the content is long, the modal itself should be scrollable internally.

Modal Content (JLPT Specific):

Top Banner: A red "Limited Time Offer" bar (e.g., "JLPT N1-N5 Full Access - 50% OFF - This Week Only").

Headline: A bold, large title: "Master the JLPT with the Ultimate Study Platform."

Sub-headline: "Comprehensive practice tests, vocabulary flashcards, and grammar explanations for all levels."

Social Proof Section: - Display a row of user avatars.

Text: "Join 10,000+ students acing their JLPT exams daily."

Trust Badges: 5-star ratings from "App Store," "Play Store," and "JLPT Success Community."

Primary CTA: A prominent "Get Lifetime Premium Access" button.

Secondary CTA: A "Continue to Free Version" text link (this should also close the modal).

Technical Implementation:

Use [Insert your Framework: React/Vue/HTML/Next.js].

Ensure the modal has a high z-index.

Implement the click-outside logic using a ref or event listener on the backdrop.

Keep the design clean, professional, and high-conversion oriented.