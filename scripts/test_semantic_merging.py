import os
import sys
import logging

# Add backend/hanachan to path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'hanachan'))

from memory.semantic import SemanticMemory
from schemas.memory import Relationship, Node

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestSemanticMerging")

def test_merging():
    # Ensure .env is loaded
    if os.path.exists("backend/hanachan/.env"):
        from dotenv import load_dotenv
        load_dotenv("backend/hanachan/.env")

    memory = SemanticMemory()
    user_id = "test-user-merging-123"

    # Define two semantically similar entities
    # 1. Software Engineer
    rel1 = Relationship(
        source=Node(id="Software Engineer", type="Topic"),
        target=Node(id="High", type="Level"),
        type="IS_AT_LEVEL"
    )

    # 2. Coder / Developer (Should resolve to Software Engineer or vice versa)
    rel2 = Relationship(
        source=Node(id="Computer Programmer", type="Topic"),
        target=Node(id="Tokyo", type="Location"),
        type="WORKS_IN"
    )

    print("\n" + "="*60)
    print("🚀 TESTING SEMANTIC MERGING (OPENAI)")
    print("="*60 + "\n")

    print("📝 Adding first relationship: Software Engineer -> High")
    memory.add_relationships([rel1], user_id)

    print("\n📝 Adding second relationship: Computer Programmer -> Tokyo")
    print("(This should ideally resolve 'Computer Programmer' to 'Software Engineer' or similar if embeddings match)")
    memory.add_relationships([rel2], user_id)

    print("\n🔍 Retrieving context for query 'What is my job?'")
    context = memory.retrieve(user_id, query="What is my job?")
    
    print(f"\n📊 Retrieved Context:\n{context}")
    
    print("\n" + "="*60)
    print("✅ Test execution complete.")
    print("Check if both facts share the same source entity in the output.")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_merging()
