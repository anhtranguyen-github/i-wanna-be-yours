import pytest
import time
from backend.hanachan.schemas.signal import Signal, SignalPriority
from backend.hanachan.services.policy_engine import SignalPolicyEngine

@pytest.fixture
def policy_engine():
    return SignalPolicyEngine(dedup_window_seconds=1)

def test_critical_signal_always_passes(policy_engine):
    sig = Signal(
        type="user.sos",
        priority=SignalPriority.CRITICAL,
        user_id="u1"
    )
    assert policy_engine.evaluate(sig) is True
    # Should not dedup critical
    assert policy_engine.evaluate(sig) is True

def test_deduplication_logic(policy_engine):
    sig = Signal(
        type="task.completed",
        priority=SignalPriority.NORMAL,
        user_id="u1"
    )
    
    # First time: Accepted
    assert policy_engine.evaluate(sig) is True
    
    # Second time immediately: Rejected (Duplicate)
    assert policy_engine.evaluate(sig) is False
    
    # Wait for window to expire
    time.sleep(1.1)
    
    # Third time: Accepted again
    assert policy_engine.evaluate(sig) is True

def test_background_signal_dropped(policy_engine):
    sig = Signal(
        type="page.view",
        priority=SignalPriority.BACKGROUND,
        user_id="u1"
    )
    assert policy_engine.evaluate(sig) is False

def test_dedup_is_per_user_and_type(policy_engine):
    sig1 = Signal(type="A", priority=SignalPriority.NORMAL, user_id="u1")
    sig2 = Signal(type="B", priority=SignalPriority.NORMAL, user_id="u1")
    sig3 = Signal(type="A", priority=SignalPriority.NORMAL, user_id="u2")
    
    assert policy_engine.evaluate(sig1) is True
    assert policy_engine.evaluate(sig2) is True
    assert policy_engine.evaluate(sig3) is True
