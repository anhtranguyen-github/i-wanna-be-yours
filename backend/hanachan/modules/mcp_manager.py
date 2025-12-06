import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MCP_FILE = os.path.join(DATA_DIR, "mcp_servers.json")

class McpManager:
    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
        if not os.path.exists(MCP_FILE):
            with open(MCP_FILE, 'w') as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict]:
        try:
            with open(MCP_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read MCP data: {e}")
            return []

    def _write_data(self, data: List[Dict]):
        try:
            with open(MCP_FILE, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to write MCP data: {e}")

    def list_servers(self) -> List[Dict]:
        return self._read_data()

    def create_server(self, data: Dict) -> Dict:
        servers = self._read_data()
        new_id = 1
        if servers:
            new_id = max(s['id'] for s in servers) + 1
        
        now = datetime.utcnow().isoformat()
        server = {
            "id": new_id,
            "name": data.get("name"),
            "type": data.get("type"),
            "enabled": data.get("enabled", True),
            "command": data.get("command"),
            "args": data.get("args", []),
            "env": data.get("env", {}),
            "url": data.get("url"),
            "headers": data.get("headers", {}),
            "createdAt": now,
            "updatedAt": now
        }
        servers.append(server)
        self._write_data(servers)
        return server

    def update_server(self, server_id: int, updates: Dict) -> bool:
        servers = self._read_data()
        for server in servers:
            if server['id'] == server_id:
                server.update(updates)
                server['updatedAt'] = datetime.utcnow().isoformat()
                self._write_data(servers)
                return True
        return False

    def delete_server(self, server_id: int) -> bool:
        servers = self._read_data()
        initial_len = len(servers)
        servers = [s for s in servers if s['id'] != server_id]
        if len(servers) < initial_len:
            self._write_data(servers)
            return True
        return False

    def get_server(self, server_id: int) -> Optional[Dict]:
        servers = self._read_data()
        for server in servers:
            if server['id'] == server_id:
                return server
        return None

mcp_manager = McpManager()
