import os
import sys
from services.artifact_service import ArtifactService

def test_mongo_persistence():
    print("Testing MongoDB Persistence via ArtifactService...")
    try:
        # Create a test artifact
        art = ArtifactService.create_artifact(
            user_id="test-user",
            artifact_type="flashcard_deck",
            title="Mongo Connection Test",
            data={"test": "connection"},
            description="Testing if Mongo is up and working with Ghost ID prevention"
        )
        
        art_id = art["_id"]
        print(f"✅ Created Artifact: {art_id}")
        
        # Retrieval check
        retrieved = ArtifactService.get_artifact(str(art_id))
        if retrieved:
            print(f"✅ Retrieved Artifact from DB: {retrieved['title']}")
            return True
        else:
            print("❌ Failed to retrieve artifact.")
            return False
            
    except Exception as e:
        print(f"❌ Mongo Test Failed: {e}")
        return False

if __name__ == "__main__":
    success = test_mongo_persistence()
    if success:
        print("🎉 MONGODB IS LIVE AND ACCESSIBLE")
    else:
        sys.exit(1)
