class McpService:
    @staticmethod
    def get_status():
        # In a real application, you might get status from a database or other service
        status = {
            "service": "mcp",
            "status": "running",
            "version": "1.0.0"
        }
        return status
