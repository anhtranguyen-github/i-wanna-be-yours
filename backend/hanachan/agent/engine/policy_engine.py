import re
import logging
from typing import List, Dict, Any, Optional
from agent.engine.loader import ConfigLoader
from schemas.manifest_policy import ToolGuardrail, IdentityType

logger = logging.getLogger(__name__)

class PolicyEngine:
    """
    The 'Sovereign Authority' of the Hanachan system.
    Enforces the 'LLM Proposes, System Disposes' mantra.
    """

    def __init__(self):
        self.manifest = ConfigLoader.get_manifest()
        self.policy = ConfigLoader.get_policy()

    def evaluate_intent(self, intent_id: str, user_id: str, identity_type: str = "user") -> Dict[str, Any]:
        """
        Validates if a user intent is permitted.
        Prevents standard users from triggering administrative or destructive intents.
        """
        id_policy = self._get_identity_policy(identity_type)
        if not id_policy:
            return {"allowed": False, "reason": "Unknown identity"}

        # Block 'critical' or 'system' intents for non-admins
        restricted_prefixes = ["system_", "admin_", "delete_", "destroy_"]
        if any(intent_id.startswith(p) for p in restricted_prefixes):
            if identity_type != "admin":
                logger.warning(f"🛡️ [Policy] BLOCKED Intent: {intent_id} for User: {user_id}")
                return {"allowed": False, "reason": f"Intent '{intent_id}' is restricted to system administrators."}

        return {"allowed": True, "reason": "Authorized"}

    def evaluate_tool_call(self, tool_id: str, user_id: str, identity_type: str = "user") -> Dict[str, Any]:
        """
        Validates if a tool call proposal is allowed.
        Returns a dict with 'allowed' (bool) and 'reason' (str).
        """
        # 1. Identity & Isolation Check
        id_policy = self._get_identity_policy(identity_type)
        if not id_policy:
            return {"allowed": False, "reason": f"Unknown identity type: {identity_type}"}

        # 2. Check if tool is allowed for this identity
        if id_policy.tool_access != "*" and tool_id not in id_policy.tool_access:
            return {"allowed": False, "reason": f"Tool '{tool_id}' is not permitted for identity '{identity_type}'"}

        # 3. Check if tool exists in manifest
        manifest_tool = next((t for t in self.manifest.tools if t.id == tool_id), None)
        if not manifest_tool:
            return {"allowed": False, "reason": f"Tool '{tool_id}' does not exist in the system manifest"}

        # 4. Tool Guardrails (Rate limits, token limits)
        guardrail = next((g for g in self.policy.tool_guardrails if g.tool_id == tool_id), None)
        if guardrail:
            # Note: Rate limiting would require a persistence layer (Redis/Postgres)
            # For now, we focus on permission and logic.
            if guardrail.requires_approval:
                return {"allowed": False, "reason": f"Tool '{tool_id}' requires manual system approval"}

        return {"allowed": True, "reason": "Authorized"}

    def evaluate_memory_save(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Pattern-based memory governance.
        System decides what is memorable based on text content.
        """
        rules = sorted(self.policy.memory_governance.save_rules, key=lambda x: x.priority, reverse=True)
        
        for rule in rules:
            if not rule.patterns:
                continue
            
            # Combine patterns into regex
            pattern_regex = "|".join(rule.patterns)
            if re.search(pattern_regex, text, re.IGNORECASE):
                logger.info(f"✅ Memory Rule Triggered: {rule.type} (Action: {rule.action})")
                return {
                    "rule_type": rule.type,
                    "action": rule.action,
                    "priority": rule.priority
                }
        
        return None

    def _get_identity_policy(self, identity_id: str) -> Optional[IdentityType]:
        return next((t for t in self.policy.identity.types if t.id == identity_id), None)

    @property
    def max_iterations(self) -> int:
        return self.policy.global_policy.max_loop_iterations

    @property
    def enforce_isolation(self) -> bool:
        return self.policy.global_policy.enforce_isolation
