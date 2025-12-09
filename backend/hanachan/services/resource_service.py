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
