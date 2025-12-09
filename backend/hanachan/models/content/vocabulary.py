from database.database import db

class VocabularySet(db.Model):
    __tablename__ = 'vocabulary_sets'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=True)
    
    # Relationship to actual items
    items = db.relationship('VocabularyItem', backref='vocabulary_set', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'items': [i.to_dict() for i in self.items]
        }

class VocabularyItem(db.Model):
    __tablename__ = 'vocabulary_items'
    
    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey('vocabulary_sets.id'), nullable=False)
    word = db.Column(db.String(255), nullable=False)
    definition = db.Column(db.Text, nullable=True)
    example = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'word': self.word,
            'definition': self.definition,
            'example': self.example
        }
