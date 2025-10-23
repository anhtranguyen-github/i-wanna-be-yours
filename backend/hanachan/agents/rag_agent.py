from agents.graph import app
# --- 3.3. RUN DEMONSTRATION ---

# Example 1: Complex Query triggering rewrite/iteration (PRECISE mode)
print("\n" + "#"*50)
print("RUNNING PRECISE MODE (Iterative Search Test)")
print("#"*50)

initial_state_complex = {
    "question": "What is the function of the largest thing in the solar system, and how does it relate to non-light-producing spheres?",
    "rewritten_query": "",
    "documents": [],
    "retrieval_attempts": 0,
    "mode": "PRECISE",
    "final_answer": ""
}

final_state_complex = app.invoke(initial_state_complex)

print("\n" + "="*50)
print(f"FINAL ANSWER ({final_state_complex['mode']} Mode):")
print(final_state_complex['final_answer'])
print("="*50)