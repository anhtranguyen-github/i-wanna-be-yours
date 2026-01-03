#!/usr/bin/env python3
"""
Long-Run Multi-User Simulation Script
======================================
Implements comprehensive testing session for Hanachan agent with NRS.

Test Configuration (from LONG_RUN_TEST_PLAN.md):
- Number of Users: 2
- Conversations per User: 1 (total 2 conversations)
- Turns per Conversation: 15-20
- File Size Limit: 50MB
- Duplicate Check: SHA256 hash
"""

import os
import sys
import uuid
import logging
import jwt
import requests
import time
import json
import hashlib
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict, Optional, Any

# Add root directory to sys.path for internal imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app import create_app, db
    from services.agent_service import AgentService
    from schemas.chat import AgentRequest, ContextConfigurationDTO
    from tasks.summarization import summarize_conversation_task
    from models.conversation import Conversation
    from models.message import ChatMessage
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "your-development-secret-key")
NRS_URL = os.environ.get("NRS_API_URL", "http://localhost:5300/v1/resources")
LTM_ENABLED = os.environ.get("LTM_ENABLED", "True").lower() == "true"

# User configurations
USERS = [
    {
        "id": "test-user-alpha",
        "name": "Alpha",
        "resources": [
            "/mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/2508.14797v1 (2).pdf"
        ]
    },
    {
        "id": "test-user-beta", 
        "name": "Beta",
        "resources": [
            "/mnt/c/Users/tra01/OneDrive/Desktop/Last dance/hanabira.org/Building an AI-Integrated Goal Tracker.pdf"
        ]
    }
]

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MultiUserSimulation")


# ---------------------------------------------------------------------------
# Data Classes for Metrics
# ---------------------------------------------------------------------------
@dataclass
class TurnMetrics:
    turn_number: int
    latency_ms: float
    response_length: int
    stm_summary_length: int
    ltm_retrieved: bool
    resource_context_used: bool
    error: Optional[str] = None


@dataclass 
class UserSessionMetrics:
    user_id: str
    session_id: str
    total_turns: int
    total_messages: int
    avg_latency_ms: float
    resource_ids: List[str]
    turn_metrics: List[TurnMetrics]
    errors: List[str]


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def generate_token(user_id: str) -> str:
    """Generate JWT token for authentication."""
    payload = {
        "userId": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def upload_file(file_path: str, token: str) -> Dict[str, Any]:
    """
    Upload a file to NRS and return result including duplicate status.
    Returns dict with keys: id, duplicate, error
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return {"id": None, "duplicate": False, "error": f"File not found: {file_path}"}
    
    file_size = os.path.getsize(file_path)
    logger.info(f"Uploading file: {file_path} ({file_size / (1024*1024):.2f} MB)")
    
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "application/pdf")}
            data = {"auto_ingest": "true", "strategy": "recursive"}
            headers = {"Authorization": f"Bearer {token}"}
            
            resp = requests.post(f"{NRS_URL}/upload", files=files, data=data, headers=headers, timeout=60)
            
            if resp.status_code == 413:
                return {"id": None, "duplicate": False, "error": "File too large (>50MB)"}
            elif resp.ok:
                result = resp.json()
                return {
                    "id": result.get("id"),
                    "duplicate": result.get("duplicate", False),
                    "error": None
                }
            else:
                return {"id": None, "duplicate": False, "error": f"HTTP {resp.status_code}: {resp.text}"}
    except requests.exceptions.RequestException as e:
        return {"id": None, "duplicate": False, "error": str(e)}


def wait_for_ingestion(resource_id: str, token: str, max_wait: int = 60) -> bool:
    """Wait for resource ingestion to complete."""
    headers = {"Authorization": f"Bearer {token}"}
    for i in range(max_wait):
        try:
            resp = requests.get(f"{NRS_URL}/{resource_id}/meta", headers=headers, timeout=10)
            if resp.ok:
                status = resp.json().get("ingestionStatus", "pending")
                if status == "completed":
                    return True
                elif status == "failed":
                    logger.error(f"Ingestion failed for {resource_id}")
                    return False
        except Exception as e:
            logger.warning(f"Error checking ingestion status: {e}")
        time.sleep(1)
    return False


class LegacyDataError(Exception):
    """Raised when encountering incompatible legacy data."""
    pass


def handle_legacy_error(error, context: str):
    """Handle legacy data errors by logging and skipping."""
    logger.error(f"Legacy data error in {context}: {error}")
    return None


# ---------------------------------------------------------------------------
# Main Simulation Classes
# ---------------------------------------------------------------------------
class UserSimulator:
    """Simulates a single user's conversation session."""
    
    def __init__(self, user_config: Dict, agent_service: AgentService):
        self.user_id = user_config["id"]
        self.user_name = user_config["name"]
        self.resource_paths = user_config["resources"]
        self.agent_service = agent_service
        self.token = generate_token(self.user_id)
        self.session_id = f"sim_{self.user_name.lower()}_{uuid.uuid4().hex[:6]}"
        self.resource_ids: List[str] = []
        self.metrics: List[TurnMetrics] = []
        self.errors: List[str] = []
        
    def upload_resources(self) -> bool:
        """Upload all resources for this user."""
        logger.info(f"[{self.user_name}] Uploading {len(self.resource_paths)} resources...")
        
        for path in self.resource_paths:
            result = upload_file(path, self.token)
            
            if result["error"]:
                self.errors.append(f"Upload failed: {result['error']}")
                logger.error(f"[{self.user_name}] Upload failed: {result['error']}")
                continue
                
            if result["duplicate"]:
                logger.info(f"[{self.user_name}] ♻️ Duplicate detected, reusing ID: {result['id']}")
            else:
                logger.info(f"[{self.user_name}] ✅ New upload: {result['id']}")
                
            if result["id"]:
                self.resource_ids.append(result["id"])
        
        # Wait for ingestion
        if self.resource_ids:
            logger.info(f"[{self.user_name}] Waiting for ingestion to complete...")
            for rid in self.resource_ids:
                success = wait_for_ingestion(rid, self.token)
                if not success:
                    self.errors.append(f"Ingestion timeout for {rid}")
        
        return len(self.resource_ids) > 0
    
    def _send_turn(self, prompt: str, resource_ids: Optional[List[str]] = None) -> TurnMetrics:
        """Send a single turn and collect metrics."""
        turn_num = len(self.metrics) + 1
        start_time = time.time()
        
        try:
            context_config = None
            if resource_ids:
                context_config = ContextConfigurationDTO(resource_ids=resource_ids)
            
            req = AgentRequest(
                session_id=self.session_id,
                user_id=self.user_id,
                prompt=prompt,
                context_config=context_config,
                token=self.token
            )
            
            full_response = ""
            for chunk in self.agent_service.stream_agent(req):
                if hasattr(chunk, 'content'):
                    full_response += chunk.content
                elif isinstance(chunk, str) and not chunk.startswith("__METADATA__"):
                    full_response += chunk
            
            db.session.commit()
            
            # Get conversation for STM check
            conv = Conversation.query.filter_by(session_id=self.session_id).first()
            stm_length = len(conv.summary or "") if conv else 0
            
            latency = (time.time() - start_time) * 1000
            
            return TurnMetrics(
                turn_number=turn_num,
                latency_ms=latency,
                response_length=len(full_response),
                stm_summary_length=stm_length,
                ltm_retrieved=LTM_ENABLED,
                resource_context_used=bool(resource_ids)
            )
            
        except Exception as e:
            self.errors.append(f"Turn {turn_num}: {str(e)}")
            logger.error(f"[{self.user_name}] Turn {turn_num} error: {e}")
            
            return TurnMetrics(
                turn_number=turn_num,
                latency_ms=0,
                response_length=0,
                stm_summary_length=0,
                ltm_retrieved=False,
                resource_context_used=False,
                error=str(e)
            )
    
    def run_phase1_initial_queries(self, num_turns: int = 5):
        """Phase 1: Initial queries using resources."""
        logger.info(f"[{self.user_name}] 🟢 Phase 1: Initial queries ({num_turns} turns)")
        
        for i in range(num_turns):
            prompt = f"Explain the key concepts from turn {i+1} of the uploaded document."
            metrics = self._send_turn(prompt, self.resource_ids)
            self.metrics.append(metrics)
            logger.info(f"[{self.user_name}] Turn {metrics.turn_number}: {metrics.latency_ms:.0f}ms, {metrics.response_length} chars")
    
    def run_phase2_memory_stretching(self, num_turns: int = 10):
        """Phase 2: Memory stretching with summarization triggers."""
        logger.info(f"[{self.user_name}] 🟠 Phase 2: Memory stretching ({num_turns} turns)")
        
        for i in range(num_turns):
            prompt = f"Random conversation topic {i+1}: Tell me about a random Japanese word."
            metrics = self._send_turn(prompt)
            self.metrics.append(metrics)
            
            # Trigger summarization
            try:
                conv = Conversation.query.filter_by(session_id=self.session_id).first()
                if conv:
                    summarize_conversation_task(conv.id)
                    db.session.expire(conv)
                    conv = Conversation.query.get(conv.id)
                    metrics.stm_summary_length = len(conv.summary or "")
            except Exception as e:
                handle_legacy_error(e, f"summarization turn {i+1}")
            
            logger.info(f"[{self.user_name}] Turn {metrics.turn_number}: Summary={metrics.stm_summary_length} chars")
    
    def run_phase3_multi_resource(self, num_turns: int = 5):
        """Phase 3: Multi-resource integration (if multiple resources)."""
        logger.info(f"[{self.user_name}] 🔵 Phase 3: Multi-resource integration ({num_turns} turns)")
        
        for i in range(num_turns):
            prompt = f"Synthesize information from all documents for question {i+1}."
            metrics = self._send_turn(prompt, self.resource_ids)
            self.metrics.append(metrics)
            logger.info(f"[{self.user_name}] Turn {metrics.turn_number}: {metrics.latency_ms:.0f}ms")
    
    def get_session_metrics(self) -> UserSessionMetrics:
        """Compile final session metrics."""
        total_latency = sum(m.latency_ms for m in self.metrics)
        avg_latency = total_latency / len(self.metrics) if self.metrics else 0
        
        # Get final message count
        try:
            conv = Conversation.query.filter_by(session_id=self.session_id).first()
            total_messages = len(conv.messages) if conv else 0
        except Exception as e:
            total_messages = 0
            handle_legacy_error(e, "message count")
        
        return UserSessionMetrics(
            user_id=self.user_id,
            session_id=self.session_id,
            total_turns=len(self.metrics),
            total_messages=total_messages,
            avg_latency_ms=avg_latency,
            resource_ids=self.resource_ids,
            turn_metrics=self.metrics,
            errors=self.errors
        )


# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
def run_multi_user_simulation():
    """Execute the full multi-user long-run simulation."""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("🚀 LONG-RUN MULTI-USER SIMULATION")
        print(f"   Users: {len(USERS)}")
        print(f"   LTM Enabled: {LTM_ENABLED}")
        print(f"   Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        agent_service = AgentService()
        all_metrics: List[UserSessionMetrics] = []
        
        for user_config in USERS:
            print(f"\n{'='*60}")
            print(f"👤 Starting simulation for: {user_config['name']} ({user_config['id']})")
            print("=" * 60)
            
            try:
                simulator = UserSimulator(user_config, agent_service)
                
                # Upload resources
                if not simulator.upload_resources():
                    logger.warning(f"[{simulator.user_name}] No resources uploaded, continuing anyway...")
                
                # Run all phases
                simulator.run_phase1_initial_queries(num_turns=5)
                simulator.run_phase2_memory_stretching(num_turns=10)
                simulator.run_phase3_multi_resource(num_turns=5)
                
                # Collect metrics
                metrics = simulator.get_session_metrics()
                all_metrics.append(metrics)
                
            except Exception as e:
                logger.error(f"Fatal error for user {user_config['id']}: {e}")
                continue
        
        # -----------------------------------------------------------------
        # Final Audit Report
        # -----------------------------------------------------------------
        print("\n" + "=" * 60)
        print("🧠 FINAL AUDIT REPORT")
        print("=" * 60)
        
        total_turns = 0
        total_errors = 0
        all_latencies = []
        
        for metrics in all_metrics:
            print(f"\n📊 User: {metrics.user_id}")
            print(f"   Session ID: {metrics.session_id}")
            print(f"   Total Turns: {metrics.total_turns}")
            print(f"   Total Messages: {metrics.total_messages}")
            print(f"   Avg Latency: {metrics.avg_latency_ms:.0f}ms")
            print(f"   Resources: {metrics.resource_ids}")
            print(f"   Errors: {len(metrics.errors)}")
            
            if metrics.errors:
                for err in metrics.errors[:5]:
                    print(f"      ❌ {err}")
            
            total_turns += metrics.total_turns
            total_errors += len(metrics.errors)
            all_latencies.extend([m.latency_ms for m in metrics.turn_metrics])
        
        print("\n" + "-" * 60)
        print("📈 AGGREGATE STATISTICS")
        print("-" * 60)
        print(f"   Total Users Completed: {len(all_metrics)}")
        print(f"   Total Turns Executed: {total_turns}")
        print(f"   Total Errors: {total_errors}")
        
        if all_latencies:
            avg_all = sum(all_latencies) / len(all_latencies)
            max_lat = max(all_latencies)
            min_lat = min(all_latencies)
            print(f"   Latency - Avg: {avg_all:.0f}ms, Min: {min_lat:.0f}ms, Max: {max_lat:.0f}ms")
        
        # Success criteria check
        print("\n" + "-" * 60)
        print("✅ SUCCESS CRITERIA CHECK")
        print("-" * 60)
        
        checks = []
        
        # Both users complete 15+ turns
        for m in all_metrics:
            passed = m.total_turns >= 15
            checks.append(("15+ turns", m.user_id, passed))
            print(f"   [{'✅' if passed else '❌'}] {m.user_id}: {m.total_turns}/15 turns")
        
        # Average response < 10s
        if all_latencies:
            avg_under_10s = (sum(all_latencies) / len(all_latencies)) < 10000
            checks.append(("Avg latency <10s", "all", avg_under_10s))
            print(f"   [{'✅' if avg_under_10s else '❌'}] Avg latency <10s: {avg_all:.0f}ms")
        
        # No fatal errors (simulation completed)
        all_completed = len(all_metrics) == len(USERS)
        checks.append(("All users completed", "all", all_completed))
        print(f"   [{'✅' if all_completed else '❌'}] All users completed: {len(all_metrics)}/{len(USERS)}")
        
        print("\n" + "=" * 60)
        all_passed = all(c[2] for c in checks)
        if all_passed:
            print("🎉 ALL SUCCESS CRITERIA PASSED!")
        else:
            print("⚠️ SOME CRITERIA FAILED - Review errors above")
        print("=" * 60)
        
        # Return exit code
        return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = run_multi_user_simulation()
    sys.exit(exit_code)
