from repositories.resource_repository import ResourceRepository
from models.resource import Resource

class ResourceService:
    def __init__(self, resource_repo: ResourceRepository = None):
        self.resource_repo = resource_repo or ResourceRepository()

    def create_resource(self, data: dict) -> dict:
        new_resource = Resource(
            title=data.get('title'),
            type=data.get('type'),
            content=data.get('content')
        )
        saved_resource = self.resource_repo.save(new_resource)
        return saved_resource.to_dict()

    def get_resource(self, resource_id: int) -> dict:
        resource = self.resource_repo.get_by_id(resource_id)
        if resource:
            return resource.to_dict()
        return None

    def list_resources(self) -> list:
        resources = self.resource_repo.get_all()
        return [r.to_dict() for r in resources]

    def delete_resource(self, resource_id: int) -> bool:
        return self.resource_repo.delete(resource_id)

    def search_resources(self, query: str) -> list:
        # MVP: Get all and filter in memory if repo doesn't support search
        # Ideally: self.resource_repo.search(query)
        # Let's assume we filter here for safety ensuring no crash
        all_resources = self.resource_repo.get_all()
        if not query:
            return [r.to_dict() for r in all_resources]
        
        query_lower = query.lower()
        return [
            r.to_dict() for r in all_resources 
            if query_lower in r.title.lower() or (r.content and query_lower in r.content.lower())
        ]

    def get_resource_summary(self, resource_id: int) -> dict:
        resource = self.resource_repo.get_by_id(resource_id)
        if not resource:
            return None
        
        # If summary exists, return it
        if resource.summary:
            return {"id": resource.id, "summary": resource.summary}
        
        # Fallback: Generate simple truncation
        content_preview = (resource.content[:200] + "...") if resource.content else "No content available."
        return {"id": resource.id, "summary": content_preview}

