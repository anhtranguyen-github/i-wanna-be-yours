---
title: Implementation Plan: Semantic Vector Knowledge Graph
description: Strategic plan to integrate vector embeddings with the Knowledge Graph (Neo4j) for fuzzy entity resolution and similarity-based graph retrieval.
---

## 1. Objective
Enhance the current Knowledge Graph from a "literal" triple store to a "semantic" store. This allows Hanachan to:
- Resolve similar concepts (e.g., "Software Engineer" vs "Coder") into the same node.
- Perform similarity-based search across the graph nodes to find relevant context even without exact keyword matches.
- **Multimodal Integration**: Support semantic search across text and images within resources (like PDFs with diagrams or standalone photos).
- Improve Graph-RAG (Retrieval Augmented Generation) quality.

## 2. Core Components

### A. Vector-Indexed Nodes
Every node in Neo4j will store its own embedding. 
- **Field**: `embedding: float[]`
- **Constraint**: Each node label (Topic, Preference, Goal) will have a dedicated vector index.

### B. Multimodal Chunking (New)
For resources like `2403.15466v1.pdf` (which contains figures) and standalone images like `raf,...u1.jpg`:
- **Image Extraction**: Identify and extract images/diagrams from PDFs.
- **Visual Description (VLM)**: Use a Vision LLM (e.g., GPT-4o or LLaVA) to generate textual descriptions and OCR for every image chunk.
- **Multimodal Vector Space**: Store these descriptions as `type: image_chunk` in the Vector DB, allowing text-based semantic search to find visual content.

### C. Entity Resolution Layer (Deduplication)
Before adding a new node (e.g., "Japanese History"), the system will:
1.  Embed the incoming label.
2.  Search existing graph nodes for similarity > 0.9.
3.  If a match is found, reuse that node ID instead of creating a new one.

## 3. Implementation Phases

### Phase 1: Neo4j Vector Setup
1.  **Configure Indexes**: Create vector indexes in Neo4j for each node type (User, Topic, Preference, etc.).
    ```cypher
    CREATE VECTOR INDEX topic_embeddings IF NOT EXISTS
    FOR (n:Topic) ON (n.embedding)
    OPTIONS {indexConfig: {
      `vector.dimensions`: 1536,
      `vector.similarity_function`: 'cosine'
    }};
    ```
2.  **OpenAI Integration**: Use the existing `ModelFactory` to generate embeddings for node IDs/labels.

### Phase 2: The "Semantic Merge" logic
Update `backend/hanachan/memory/semantic.py`:
1.  Modify `add_relationships` to first check for semantically similar nodes.
2.  If the query `MATCH (n) WHERE similarity(n.embedding, $new_emb) > 0.95` returns a node, use its `id` as the source/target.
3.  Inject the `embedding` property into every `MERGE` operation.

### Phase 3: Similarity-Based Retrieval
Update `SemanticMemory.retrieve`:
1.  **Old Logic**: Fetch everything linked to `(u:User)`.
2.  **New Logic (Hybrid)**:
    - Perform a vector search on nodes linked to the user to find the "Top K" most relevant nodes to the current *query*.
    - Traverse 1-2 hops from those specific nodes to get deep context.
    - Result: Highly relevant graph snippets instead of a random dump of facts.

### Phase 4: Migration Script
1.  Create a utility to iterate through all existing Neo4j nodes.
2.  Generate embeddings for their `id` labels.
3.  Store them back into the graph and rebuild indexes.

### Phase 5: Multimodal Resource Ingestion
1.  **PDF-to-Image Processing**: Update `ResourceProcessor` to detect and extract images from PDF pages using `PyMuPDF` or `pdf2image`.
2.  **Visual Embedding Pipeline**:
    - **A. Textual Proxy**: Generate 1-2 sentence summaries of images using a VLM.
    - **B. Native Multimodal (Future)**: Use `clip-vit-base-patch32` or similar for direct image-to-vector embedding.
3.  **Graph Linking**: Link `image_chunk` nodes to the main `Document` node in Neo4j, allowing the agent to "see" that a specific figure supports a specific text claim.

### Phase 6: Cross-Modal Semantic Search
1.  **Query Handling**: When a user asks "Show me the diagram of the architecture," the semantic search should return the visual descriptions of the relevant figures.
2.  **Agent Instruction**: Update the system prompt to handle image metadata, allowing it to describe retrieved images to the user.

## 4. Architectural Diagram
```mermaid
graph LR
    A[New Info: Coder] --> B[Embed: 0.12..]
    B --> C{Search KG similarity > 0.9}
    C -- Match: Developer -- > D[Link to existing Developer node]
    C -- No Match -- > E[Create new Coder node with embedding]
    
    F[Query: Job skills] --> G[Vector Search KG]
    G --> H[Return Developer/Coder context]
```

## 5. Next Steps
1.  Update `requirements.txt` to ensure `neo4j` driver includes vector support (standard in recent versions).
2.  Implement `services/embedding_service.py` wrapper for consistent use.
3.  Refactor `SemanticMemory` to include embedding logic.
