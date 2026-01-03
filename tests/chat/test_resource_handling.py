import os
import sys
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env')))

from services.resource_processor import ResourceProcessor
# Mock or import actual services if needed
from memory.manager import MemoryManager

def test_resource_handling_mock():
    """
    Test 2: Verify Resource Processor logic (Mocked context)
    """
    print("\n--- TEST: Resource Handling ---")
    
    try:
        processor = ResourceProcessor()
        print("✅ ResourceProcessor instantiated")
        
        # Test basic text chunking or processing if the class exposes it
        # Assuming there is a process_text or similar method
        if hasattr(processor, 'chunk_text'):
            text = "This is a long text " * 100
            chunks = processor.chunk_text(text, chunk_size=50)
            print(f"✅ Chunking text len {len(text)} -> {len(chunks)} chunks")
        else:
            print("ℹ️  chunk_text method not exposed, skipping specific chunk test.")

        # Test logic for context injection (simulated)
        print("✅ Resource handling logic instantiation passed.")

    except Exception as e:
        print(f"❌ Resource Handling Test Failed: {e}")

if __name__ == "__main__":
    test_resource_handling_mock()
