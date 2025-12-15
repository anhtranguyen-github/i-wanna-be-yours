# UI Transformation: Nested to Flat

This document outlines the refactoring of the "Essential Verbs" flashcard component. The goal is to eliminate the "inner box" pattern and consolidate redundant metadata.

---

## 1. The "Old" Structure (Source)
*Based on the nested card design found in `image_c69f49.png`*

### Outer Container
* **Icon:** Book (Green)
* **Header Tags:** `[VERBS]`, `[ESSENTIAL]`, `[BEGINNER]`
* **Main Title:** "Essential Verbs Vol. 1"
* **Main Description:** "Core 600 Essential Japanese Verbs for everyday use."

### Inner Container (The Nested Box)
* **Inner Icon:** Book (Gray - *Duplicate*)
* **Inner Title:** "essential 600 verbs" (*Redundant*)
* **Subtitle ID:** "verbs-1"
* **Inner Description:** "Essential Japanese vocabulary." (*Vague*)
* **Inner Tags:** `[Vocabulary]`, `[Essential]` (*Duplicate*)
* **Primary Action:** [Open Flashcard] (Green Button)
* **Secondary Actions:** "View Details", "Edit Settings"

---

## 2. Transformation Logic (Migration Map)

| Source Field | Action | Destination / New Field |
| :--- | :--- | :--- |
| **Outer Title** | ✅ **Keep** | **Main Title** ("Essential Verbs Vol. 1") |
| **Inner Title** | 🗑️ **Delete** | *Information is redundant with Outer Title & Description.* |
| **Outer Desc** | ✅ **Keep** | **Description** ("Core 600 Essential...") |
| **Inner Desc** | 🗑️ **Delete** | *Less specific than Outer Description.* |
| **Subtitle ID** | 🔄 **Move** | **Tag** (Convert "verbs-1" to `[ID: verbs-1]` or hide) |
| **All Tags** | 🔀 **Merge** | **Tag Row** (Combine Unique: `Verbs`, `Essential`, `Beginner`, `Vocabulary`) |
| **Inner Icon** | 🗑️ **Delete** | *Visual noise.* |
| **Primary Btn** | 🔼 **Promote** | **Full Width Button** (Moves to bottom of main card) |
| **Links** | 🔽 **Demote** | **Footer Links** (Placed below primary button) |

---

## 3. The "New" Structure (Target)
*A single, flat layer containing only unique, high-value information.*

### Component: Flashcard Deck (Flat)

**Header Section**
* **Icon:** Book (Green)
* **Title:** Essential Verbs Vol. 1
* **Status Badge:** `[Beginner]`

**Body Section**
* **Description:** Core 600 Essential Japanese Verbs for everyday use.
* **Metadata/Tags:**
    * `[Vocabulary]`
    * `[Verbs]`
    * `[Essential]`
    * `[600 words]` *(Extracted from text)*

**Action Section**
* **Primary Button:** [ **OPEN FLASHCARD** ] (Green, Full Width)
* **Secondary Actions:** View Details · Edit Settings

+----------------------------------------------------------------------------+
|                                                                            |
|   [📖 Icon]   **Essential Verbs Vol. 1** [Beginner] [Essential]|  <-- Header w/ primary tags
|                                                                            |
|   Core 600 Essential Japanese Verbs for everyday use.                      |  <-- Single, clear description
|                                                                            |
|   ----------------------------------------------------------------------   |
|                                                                            |
|   *Tags:* [🇯🇵 Vocabulary]  [Verbs]  [600 Items]  [Vol. 1]                  |  <-- Consolidated Metadata
|                                                                            |
|   +--------------------------------------------------------------------+   |
|   |                       🟢 OPEN FLASHCARD 🟢                         |   |  <-- Prominent Primary Action
|   +--------------------------------------------------------------------+   |
|                                                                            |
|                 View Details    ·    Edit Settings                         |  <-- Subtle Secondary Actions
|                                                                            |
+----------------------------------------------------------------------------+