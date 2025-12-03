import logging
from typing import List

# Setup Agent Logger
agent_logger = logging.getLogger("agent_logger")
agent_logger.setLevel(logging.INFO)

# Ensure we don't add multiple handlers if reloaded
if not agent_logger.handlers:
    file_handler = logging.FileHandler("agents.log")
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    file_handler.setFormatter(formatter)
    agent_logger.addHandler(file_handler)

def log_agent_action(session_id: str, agent_name: str, prompt: str, response: str, tools: List[str] = None):
    """Helper to log agent actions in a structured way."""
    log_entry = f"Session: {session_id} | Agent: {agent_name} | Tools: {tools or []}\n"
    log_entry += f"Prompt: {prompt[:200]}...\n" # Truncate prompt for readability
    log_entry += f"Response: {response}\n"
    log_entry += "-" * 50
    agent_logger.info(log_entry)
