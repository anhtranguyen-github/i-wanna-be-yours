
from typing import Any, AsyncIterator, Dict, Optional, Sequence, Tuple
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
import pickle
import logging

logger = logging.getLogger(__name__)

class AsyncMongoDBSaver(BaseCheckpointSaver):
    """A checkpoint saver that stores checkpoints in a MongoDB database asynchronously."""

    def __init__(self, db: AsyncDatabase):
        super().__init__()
        self.db = db
        self.checkpoints = db["checkpoints"]
        self.writes = db["checkpoint_writes"]

    async def aget_tuple(self, config: Dict[str, Any]) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        
        query = {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns}
        if "checkpoint_id" in config["configurable"]:
            query["checkpoint_id"] = config["configurable"]["checkpoint_id"]
        
        # Find latest if no checkpoint_id, or specific one
        result = await self.checkpoints.find_one(
            query, 
            sort=[("checkpoint_id", -1)]
        )
        
        if not result:
            return None

        checkpoint = pickle.loads(result["checkpoint"])
        metadata = pickle.loads(result["metadata"])
        parent_config = result.get("parent_config")
        if parent_config:
            parent_config = pickle.loads(parent_config)

        return CheckpointTuple(
            config=config,
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
        )

    def list(
        self,
        config: Optional[Dict[str, Any]],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        # Sync list not implemented for async saver usually, but base class has it as Generator
        # We might need to implement alist if base supports it or just skip for now and rely on aget_tuple
        raise NotImplementedError("Use alist instead")

    async def alist(
        self,
        config: Optional[Dict[str, Any]],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        query = {}
        if config:
            query["thread_id"] = config["configurable"]["thread_id"]
            if "checkpoint_ns" in config["configurable"]:
                 query["checkpoint_ns"] = config["configurable"]["checkpoint_ns"]
        
        if filter:
            for k, v in filter.items():
                query[f"metadata.{k}"] = v
                
        cursor = self.checkpoints.find(query).sort("checkpoint_id", -1)
        if limit:
            cursor = cursor.limit(limit)
            
        async for doc in cursor:
            yield CheckpointTuple(
                config={
                    "configurable": {
                        "thread_id": doc["thread_id"],
                        "checkpoint_ns": doc["checkpoint_ns"],
                        "checkpoint_id": doc["checkpoint_id"],
                    }
                },
                checkpoint=pickle.loads(doc["checkpoint"]),
                metadata=pickle.loads(doc["metadata"]),
                parent_config=pickle.loads(doc["parent_config"]) if doc.get("parent_config") else None,
            )

    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> Dict[str, Any]:
        raise NotImplementedError("Use aput instead")

    async def aput(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> Dict[str, Any]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        
        doc = {
            "thread_id": thread_id,
            "checkpoint_ns": checkpoint_ns,
            "checkpoint_id": checkpoint_id,
            "checkpoint": pickle.dumps(checkpoint),
            "metadata": pickle.dumps(metadata),
            "parent_config": pickle.dumps(config) # approximating parent tracking
        }
        
        await self.checkpoints.update_one(
            {"thread_id": thread_id, "checkpoint_id": checkpoint_id, "checkpoint_ns": checkpoint_ns},
            {"$set": doc},
            upsert=True
        )
        
        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }
        
    # Helper to get easy connection
    @classmethod
    async def from_conn_string(cls, conn_string: str, db_name: str = "hanachan_db"):
        client = AsyncMongoClient(conn_string)
        db = client[db_name]
        return cls(db)
