# Plan 1: Declarative Foundation

**Status:** Drafted  
**Objective:** Replace hardcoded capabilities and rules with a schema-driven Manifest and Policy system.

---

## 1. Components
- `config/manifest.yaml`: Define available tools, specialists, and intents.
- `config/policy.yaml`: Define identity isolation, tool permissions, and memory rules.
- `agent/engine/loader.py`: Parallel-safe loader for these schemas.

## 2. Shared Constraints (Reference: SHARED_CONSTRAINTS.md)
- **C1: Deterministic Identity**: Policy must enforce `user_id` scoping at the root level.
- **C2: Manifest Totality**: If a tool is not in the manifest, it does not exist for the agent.
- **C3: Logic Separation**: Schema defines "What" and "Who"; the code only handles the "How".

## 3. Implementation Steps
1. **Schema Definition**: Create Pydantic models for Manifest and Policy objects.
2. **Migration**: Convert current `HanachanAgent.tools` into `manifest.yaml`.
3. **Policy Engine**: Implement a `PolicyEngine` that evaluates a `ToolProposal` against `policy.yaml`.
4. **Validation Test**: Ensure a mocked LLM proposal is rejected if missing from manifest or failing identity match.

## 4. Success Criteria
- 0 hardcoded tools in `core_agent.py`.
- Policy Engine correctly rejects a simulated unauthorized call.
- Schemas are version-controlled and human-readable YAML.
