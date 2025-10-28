import os
from agents.graph import app, CustomTracer

# Explicitly disable LangSmith tracing to prevent connection errors
os.environ['LANGCHAIN_TRACING_V2'] = 'false'
# --- 3.3. RUN DEMONSTRATION ---

# Example 1: Complex Query triggering rewrite/iteration (PRECISE mode)
print("\n" + "#"*50)
print("RUNNING PRECISE MODE (Iterative Search Test)")
print("#"*50)

initial_state_complex = {
    "question": "When is the deadline for filing the new regulations?",
    "rewritten_query": "",
    "documents": [],
    "retrieval_attempts": 0,
    "mode": "PRECISE",
    "use_grader": False, # Set to True to enable the new grader node
    "final_answer": ""
}

# We need to provide a config with a thread_id for the checkpointer.
# We can also add our custom tracer to the callbacks list here.
config = {"configurable": {"thread_id": "rag-thread-1"}, "callbacks": [CustomTracer()]}
final_state_complex = app.invoke(initial_state_complex, config)

print("\n" + "="*50)
print(f"FINAL ANSWER ({final_state_complex['mode']} Mode):")
print(final_state_complex['final_answer'])
print("="*50)