from database.database import db

class Mindmap(db.Model):
    __tablename__ = 'mindmaps'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=True)
    
    # Relationship to nodes
    nodes = db.relationship('MindmapNode', backref='mindmap', cascade="all, delete-orphan")

    def to_dict(self):
        # Return only root nodes to avoid redundancy, assuming consumer parses the tree
        roots = [n for n in self.nodes if n.parent_node_id is None]
        return {
            'id': self.id,
            'title': self.title,
            'nodes': [n.to_dict() for n in roots]
        }

class MindmapNode(db.Model):
    __tablename__ = 'mindmap_nodes'
    
    id = db.Column(db.Integer, primary_key=True)
    mindmap_id = db.Column(db.Integer, db.ForeignKey('mindmaps.id'), nullable=False)
    parent_node_id = db.Column(db.Integer, db.ForeignKey('mindmap_nodes.id'), nullable=True) # Recursive
    label = db.Column(db.String(255), nullable=False)
    
    # Children
    children = db.relationship('MindmapNode', 
        backref=db.backref('parent', remote_side=[id]),
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'parentId': self.parent_node_id,
            'children': [c.to_dict() for c in self.children]
        }
