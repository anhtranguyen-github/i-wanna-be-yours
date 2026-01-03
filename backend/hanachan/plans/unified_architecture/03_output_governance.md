# Plan 3: Output & Artifact Governance

**Status:** Drafted  
**Objective:** Standardize how the reasoning core delivers results to the user.

---

## 1. Components
- `schemas/artifact.py`: Standard schema for "Products" (Outputs).
- `agent/engine/output_handler.py`: Routes messages vs. objects.

## 2. Shared Constraints (Reference: SHARED_CONSTRAINTS.md)
- **C1: Artifact Identification**: Artifacts are Products, not Memory. They must be handled as Objects with their own lifecycle.
- **C2: Standardized Return**: All tool outputs must be wrapped in a consistent system response model.
- **C3: ID Only Exchange**: For Artifacts, only the reference ID and Title are sent to the UI; full data is handled by the ArtifactService.

## 3. Implementation Steps
1. **Unified Schema**: Define exactly what a "Product" (Artifact) looks like.
2. **Tool Output Wrap**: Update `study_tools.py` to return the new Artifact schema instead of raw JSON strings.
3. **Response Router**: Build dynamic logic to sort LLM reasoning into `Text Message` vs `UI Artifact`.

## 4. Success Criteria
- Success/Failure of artifact creation is system-reported, not LLM-hallucinated.
- Artifacts are correctly indexed and ready for retrieval by Plan 2.
- UI receives clean, consistent objects for rendering.
