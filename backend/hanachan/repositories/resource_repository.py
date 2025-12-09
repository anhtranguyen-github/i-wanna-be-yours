from models.resource import Resource
from database.database import db

class ResourceRepository:
    def save(self, resource: Resource) -> Resource:
        db.session.add(resource)
        db.session.commit()
        return resource

    def get_by_id(self, resource_id: int) -> Resource:
        return Resource.query.get(resource_id)

    def get_all(self):
        return Resource.query.all()

    def delete(self, resource_id: int):
        resource = self.get_by_id(resource_id)
        if resource:
            db.session.delete(resource)
            db.session.commit()
            return True
        return False
