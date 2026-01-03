from models.resource import Resource
from database.database import db

class ResourceRepository:
    def get_by_id(self, resource_id):
        return Resource.query.get(resource_id)
    
    def get_by_user_id(self, user_id, page=1, limit=20):
        return Resource.query.filter_by(user_id=str(user_id)) \
                       .order_by(Resource.created_at.desc()) \
                       .offset((page - 1) * limit) \
                       .limit(limit).all()
    
    def count_by_user_id(self, user_id):
        return Resource.query.filter_by(user_id=str(user_id)).count()
    
    def save(self, resource):
        db.session.add(resource)
        db.session.commit()
        return resource
    
    def update_status(self, resource_id, status, metadata=None):
        resource = Resource.query.get(resource_id)
        if resource:
            resource.ingestion_status = status
            if metadata:
                resource.metadata_ = metadata
            db.session.commit()
            return True
        return False
    
    def delete(self, resource):
        db.session.delete(resource)
        db.session.commit()
        return True
