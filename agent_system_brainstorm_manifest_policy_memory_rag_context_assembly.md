# Agent System Brainstorm

> **Purpose:** This document consolidates everything we brainstormed into a **clear, actionable reference** for an **AI agent coder**.  
> It explains *what exists*, *why it exists*, and *how pieces coordinate* — without tying to a specific framework.

---

## 1. Big Picture Mental Model

An agent system is **not** one LLM loop.

It is a **governed reasoning system**:

```
Intent → Context Assembly → Reasoning → Action Proposal → Policy Check → Execution → Memory Update
```

Key idea:
- **LLM reasons**
- **System decides what is allowed**

---

## 2. Manifest vs Policy (Critical Distinction)

### 2.1 Tool Manifest (WHAT EXISTS)

**Definition:**
A declarative catalog of *capabilities* an agent may use.

Tool Manifest answers:
- What tools exist?
- What do they do?
- What inputs/outputs do they have?
- What side effects do they cause?

Think of it as:
> *API documentation for agents*

**Characteristics:**
- Static or slowly changing
- No user-specific logic
- No permission decisions
- Used by planner & validator

---

### 2.2 Policy (WHAT IS ALLOWED)

**Definition:**
Rules that decide **whether** something may be done *now*, *by whom*, *under which conditions*.

Policy answers:
- Can this agent call this tool?
- Can it read/write this memory?
- Is rate limit exceeded?
- Is data sensitivity acceptable?

Think of it as:
> *Runtime law enforcement*

**Characteristics:**
- Dynamic
- User- and context-dependent
- Enforced at execution time

---

### 2.3 One-Liner Analogy

| Concept | Analogy |
|------|-------|
| Manifest | Restaurant menu |
| Policy | Health inspection + age check |

---

## 3. Guard Layer & Policy Engine (Where They Live)

**They do NOT live inside the LLM.**

They sit **between reasoning and execution**:

```
LLM → (Action Proposal) → Policy Engine → Tool Executor
```

Responsibilities:
- Validate tool arguments
- Enforce permissions
- Enforce rate limits
- Prevent unsafe side effects
- Log decisions (auditability)

**Golden rule:**
> Never let the LLM execute tools directly.

---

## 4. Memory Types & Their Roles

### 4.1 Short-Term Memory (STM)

- Current conversation
- Recent tool outputs
- Temporary reasoning context

Scope: *per turn / per task*

---

### 4.2 Long-Term Memory (LTM)

Split by purpose:

#### Episodic Memory
- What happened
- Past interactions
- User behavior traces

#### Semantic Memory
- Stable facts
- Knowledge graph
- Learned preferences

#### Resource / Artifact Memory
- Documents
- Files
- External references

**Key rule:**
> LTM is never dumped raw into prompts.

---

## 5. RAG vs Memory (Do Not Confuse Them)

| Aspect | RAG | Memory |
|----|----|----|
| Purpose | External knowledge | Agent experience |
| Mutability | Read-only | Read/write |
| Ownership | System / corpus | User / agent |
| Lifetime | Static | Grows over time |

RAG answers:
> *"What does the world know?"*

Memory answers:
> *"What do I know from experience?"*

---

## 6. Dynamic Context Assembly Phase (Core Innovation)

**This is the heart of a modern agent.**

Instead of a giant prompt, the system:

1. Interprets user intent
2. Decides what context is needed
3. Queries STM / LTM / RAG selectively
4. Summarizes & compresses
5. Assembles a minimal, focused prompt

```
User Intent
   ↓
Context Planner
   ↓
Memory + RAG Queries (policy-gated)
   ↓
Summarization / Compression
   ↓
LLM Prompt
```

Benefits:
- Lower token cost
- Less hallucination
- Higher reasoning quality

---

## 7. Auto Loop (Controlled, Not Free-Running)

**The LLM never controls looping.**

Correct pattern:

```
while system.allows:
    assemble_context()
    response = LLM()
    if response.requests_action:
        policy_check()
        execute()
    else:
        break
```

Loop constraints:
- Max iterations
- Max tool calls
- Goal convergence check

---

## 8. Does This Kill Creativity?

**No — it enhances it.**

Why:
- Creativity = reasoning
- Guardrails = authority control

We restrict:
- Actions
- Side effects
- Data access

We do NOT restrict:
- Thought
- Planning
- Analogies
- Abstraction

> Constraints sharpen intelligence.

---

## 9. Design Rules for Agent Coders

### Rule 1
Never trust the LLM with authority.

### Rule 2
Everything callable must be declared (manifest).

### Rule 3
Everything executable must pass policy.

### Rule 4
Memory is queried, not dumped.

### Rule 5
Loops are system-owned.

### Rule 6
Soft inside (LLM), hard outside (system).

---

## 10. Minimal Reference Architecture

```
User
 ↓
Intent Interpreter
 ↓
Context Assembly Engine
 ↓
LLM Reasoning
 ↓
Action Proposal
 ↓
Policy Engine
 ↓
Tool Executor
 ↓
Memory Update
```

---

## 11. Final Takeaway

An agent is:
> **A reasoning core wrapped in governance.**

Manifest defines **possibility**.  
Policy defines **permission**.  
Context assembly defines **intelligence**.

---

*This document is intentionally framework-agnostic and optimized for AI agent coders building real systems.*

