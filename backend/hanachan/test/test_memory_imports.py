
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    from memory.manager import MemoryManager
    print("✅ Successfully imported MemoryManager")
except ImportError as e:
    print(f"❌ Failed to import MemoryManager: {e}")

try:
    from agent.ollama_agent import HanachanAgent
    print("✅ Successfully imported HanachanAgent")
except ImportError as e:
    print(f"❌ Failed to import HanachanAgent: {e}")

# Static check of the classes
if 'MemoryManager' in locals():
    print("MemoryManager class is defined.")

if 'HanachanAgent' in locals():
    print("HanachanAgent class is defined.")
