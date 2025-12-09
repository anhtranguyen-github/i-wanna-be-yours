from database.database import db

class AudioContent(db.Model):
    __tablename__ = 'audio_content'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=True)
    transcript = db.Column(db.Text, nullable=True)
    url = db.Column(db.String(255), nullable=False)
    duration_seconds = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'transcript': self.transcript,
            'url': self.url,
            'duration': self.duration_seconds
        }
