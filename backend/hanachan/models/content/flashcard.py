from database.database import db

class FlashcardSet(db.Model):
    __tablename__ = 'flashcard_sets'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=True)
    
    # Relationship to actual cards
    cards = db.relationship('Flashcard', backref='flashcard_set', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'cards': [c.to_dict() for c in self.cards]
        }

class Flashcard(db.Model):
    __tablename__ = 'flashcards'
    
    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey('flashcard_sets.id'), nullable=False)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            'front': self.front,
            'back': self.back
        }
