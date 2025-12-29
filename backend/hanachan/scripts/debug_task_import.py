
import sys
import os
sys.path.append(os.getcwd())

try:
    from tasks.memory import process_interaction
    print("✅ Successfully imported process_interaction")
    # Try to call it with dummy data (it will fail on DB but should print DEBUG)
    process_interaction("test", "test", "test")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
