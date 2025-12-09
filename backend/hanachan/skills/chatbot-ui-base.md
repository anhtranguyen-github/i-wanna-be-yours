# Skill Card: Professional Chatbot UI (Base)

**Context:** General AI Interface Development
**Epic:** Frontend Foundation
**Priority:** Critical
**Status:** Standard

---

## 1. Core Philosophy
> "A professional AI interface must be invisible. It should feel like a premium, fluid extension of the user's thought process, not a clunky form submission tool. Aesthetics, responsiveness, and error resilience are not optional—they are the product."

## 2. Universal Visual Standards (The "Premium" Vibe)

### A. Aesthetics
* **Theme:** Default to **Dark Mode** with high-contrast text (`#FFFFFF`, `#E5E7EB`) and subtle backgrounds (`#0F1115`).
* **Materiality:** Use **Glassmorphism** (`backdrop-filter: blur`) for overlays, headers, and floating panels to maintain context.
* **Typography:** Use modern sans-serif families (Inter, SF Pro, Roboto). Code blocks must use JetBrains Mono or Fira Code.
* **Motion:** All interactions (hover, click, send) must have micro-interactions (0.2s ease). No abrupt state changes.

### B. Layout Architecture
* **Sidebar (Navigation):** Collapsible/Fixed width (260px). Holds history and user settings.
* **Stage (Chat Feed):** Central, focused area. Max-width of ~800px-1000px for readability.
* **Composer (Input):** Fixed at bottom. expands upwards. Must support multi-line input (Auto-expanding textarea).

---

## 3. Functional Essentials

### A. The Chat Loop
* **Input:** `Enter` to send, `Shift+Enter` for new line.
* **Streaming:** AI responses must stream token-by-token (or simulate it). A static spinner is unacceptable for long generations.
* **Markdown:** Full support for Headers, Lists, Code Blocks (with syntax highlighting), and Tables.
* **History:** Infinite scroll upwards or pagination.
* **Flow Control:** **Prevent Spam Creation**. 
    * **The "First Message" Rule:** Clicking "New Chat" clears the UI to a blank state but does **not** create a database entry (Session ID) until the first message is sent.
    * **Implicit Creation:** If the user is on the "Home/Landing" screen, typing in the input box and hitting Send automatically initializes a new session.

### B. Asset Handling (Base)
* **Drag & Drop:** Full-screen overlay when determining drag intent.
* **Resource Tray:** Uploaded files sit in a "Staging Area" (Tray) above the input until sent.
* **Constraints:** 
    * **Max Size:** Enforce a hard limit (e.g., 20MB) to prevent server timeouts.
    * **Quota:** Max 5-10 files per message context.
    * **Types:** Allow PDF, TXT, MD, Images. Reject executables or system files.
    * **Encoding:** All non-text files (images, PDFs) must be Base64 encoded on the client side before submission to prevent `NUL` character errors in the database.

### C. Error Resilience
* **Network Triggers:** If a message fails, show a "Retry" action. Do not delete the user's typed draft.
* **Validation:** Prevent empty sends. Warn on oversized files immediately.

---

## 4. Implementation Checklist
- [ ] **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">` (Prevent zoom on mobile inputs).
- [ ] **State Management:** Decouple `messages` array from the DOM. Render from state.
- [ ] **Sanitization:** All Markdown rendering must be sanitized to prevent XSS.
