from typing import List, Dict, Any
from langchain_core.tools import BaseTool
from modules.mcp_manager import mcp_manager
import logging

logger = logging.getLogger(__name__)

async def get_mcp_tools() -> List[BaseTool]:
    """
    Fetch tools from enabled MCP servers.
    """
    servers = mcp_manager.list_servers()
    enabled_servers = [s for s in servers if s.get('enabled', True)]
    
    tools = []
    
    # Placeholder for actual MCP connection logic
    for server in enabled_servers:
        # Example:
        # if server['type'] == 'stdio':
        #   connect via stdio...
        # elif server['type'] == 'websocket':
        #   connect via ws...
        pass
        
    return tools

async def get_mcp_tools_metadata() -> Dict[str, Any]:
    return {}
