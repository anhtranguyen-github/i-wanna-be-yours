Hanachan Chat Screen UI Specification

6 States + Responsive Design

1. Document Purpose

This document defines the Chat Screen UI for Hanachan.
It is written for code agents and frontend engineers.

It covers:

Layout model

Sidebar states

6 supported layout states

Responsive behavior (desktop, tablet, mobile)

State management rules

2. Global Layout Model

The chat screen is composed of three horizontal regions:

Left Sidebar (chat navigation)

Main Chat Area (always visible)

Right Sidebar (session context / knowledge)

The main chat area must never be hidden.

3. Sidebar State Definitions
3.1 Left Sidebar (Chat Navigation)

States:

Collapsed

Expanded

Collapsed:

Width: ~56px

Icons only

Tooltip on hover

Expanded:

Width: 260–300px

Full navigation UI

Purpose:

Navigate chats

Access folders

Entry point to tools, games, knowledge

3.2 Right Sidebar (Session / Knowledge)

States:

Collapsed

Minimized

Expanded

Collapsed:

Width: ~40px

Toggle icon only

Minimized:

Width: 260–300px

Session summary tools

Expanded:

Width: 400–460px

Full knowledge explorer

Purpose:

Session artifacts

Grammar references

Writing systems

Knowledge graphs

4. Supported Chat Screen States (6)
State 1 — Collapsed + Collapsed

Left Sidebar: Collapsed
Right Sidebar: Collapsed

Intent:

Maximum focus on chat

Default entry state

Behavior:

Left shows icons only

Right shows toggle only

Main chat centered

Welcome card visible when no active chat

State 2 — Collapsed + Minimized

Left Sidebar: Collapsed
Right Sidebar: Minimized

Intent:

Chat-first with light session context

Right Sidebar Content:

Title: Session Artifacts

Primary action: List Artifacts

Flat list only

Scrollable

State 3 — Collapsed + Expanded

Left Sidebar: Collapsed
Right Sidebar: Expanded

Intent:

Reference-heavy learning mode

Right Sidebar Content:

Knowledge explorer

Trees or mind maps

Writing systems or grammar graphs

Independent scrolling

State 4 — Expanded + Collapsed

Left Sidebar: Expanded
Right Sidebar: Collapsed

Intent:

Chat management and navigation

Left Sidebar Content:

New Chat button

Search chats input

Folder list

Chat list

Behavior:

Selecting a chat updates the main chat area

Sidebar scroll independent

State 5 — Expanded + Minimized

Left Sidebar: Expanded
Right Sidebar: Minimized

Intent:

Power user mode

Balanced density

Notes:

Recommended desktop default

Most productive state

State 6 — Expanded + Expanded

Left Sidebar: Expanded
Right Sidebar: Expanded

Intent:

Deep learning and exploration

Right Sidebar Example:

Japanese Writing Systems

Hiragana

Katakana

Kanji

Behavior:

Clicking nodes influences chat context

No blocking or modal behavior

5. Shared UI Rules
Transitions

Sidebar width transition: 200–300ms ease

No layout jumps

Main chat resizes smoothly

Scrolling

Each column scrolls independently

Body scroll disabled

No nested scroll traps

Width Rules

Sidebar width is state-based

Content never resizes sidebar

Overflow handled by scrolling

6. Responsive Design
Desktop (≥1280px)

All 6 states allowed

Default:

Left Expanded

Right Minimized

Hover tooltips enabled

Tablet (768px–1279px)

Rules:

Only one sidebar can be Expanded at a time

Expanding right collapses left automatically

Minimized right sidebar allowed

Recommended default:

Expanded + Minimized

Mobile (≤767px)

Rules:

Single-column focus

Sidebars become overlay panels

Only one sidebar open at a time

Behavior:

Main chat always visible

Sidebars slide over content

Tap outside to close

7. State Management (For Code Agent)

State variables:

leftSidebarState: collapsed | expanded

rightSidebarState: collapsed | minimized | expanded

viewport: desktop | tablet | mobile

Rules:

Mobile: only one sidebar open

Tablet: expanded + expanded not allowed

Desktop: all states allowed

Persist:

Last valid layout per user

Viewport change resolves invalid states automatically

8. Explicit Non-Goals

No login gating

No modal-based navigation

No content-driven resizing

No auto-expansion of sidebars

9. Recommended Implementation Order

Collapsed + Collapsed

Expanded + Collapsed

Collapsed + Minimized

Expanded + Minimized

Collapsed + Expanded

Expanded + Expanded