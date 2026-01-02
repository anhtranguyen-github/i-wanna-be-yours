import pytest
import shutil
import os
from backend.hanachan.services.memory import MemoryService

TEST_DB_PATH = "./test_chroma_db"

@pytest.fixture
def memory_service():
    # Setup
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
    service = MemoryService(persistence_path=TEST_DB_PATH)
    yield service
    
    # Teardown
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)

def test_add_and_retrieve_episodic_memory(memory_service):
    user_id = "user_123"
    memory_text = "I studied Japanese for 30 minutes today."
    
    memory_service.add_episodic_memory(user_id=user_id, text=memory_text)
    
    # Retrieve relevant memory
    results = memory_service.retrieve_episodic_memory(user_id=user_id, query="studied Japanese", n_results=1)
    
    assert len(results) == 1
    assert results[0]["content"] == memory_text
    assert results[0]["metadata"]["user_id"] == user_id

def test_semantic_fact_storage(memory_service):
    user_id = "user_456"
    fact = "User prefers N5 vocabulary."
    
    memory_service.add_semantic_fact(user_id=user_id, fact=fact, category="preferences")
    
    results = memory_service.retrieve_semantic_facts(user_id=user_id, query="vocabulary preference")
    
    assert len(results) > 0
    # Note: Vector search is approximate/semantic, so checking exact match of content is usually fine for exact recall in small dbs
    assert any(r["fact"] == fact for r in results)

def test_memory_isolation_between_users(memory_service):
    user_a = "user_a"
    user_b = "user_b"
    
    memory_service.add_episodic_memory(user_a, "My name is Alice")
    memory_service.add_episodic_memory(user_b, "My name is Bob")
    
    # Query for User A should not find User B's memory
    results_a = memory_service.retrieve_episodic_memory(user_a, "name", n_results=5)
    
    for res in results_a:
        assert res["metadata"]["user_id"] == user_a
        assert "Bob" not in res["content"]
