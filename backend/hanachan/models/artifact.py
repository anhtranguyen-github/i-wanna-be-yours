from database.database import db
# Ensure registry presence for string-based foreign keys
import models.content.flashcard
import models.content.mindmap
import models.content.audio
import models.content.vocabulary
import models.content.quiz
import models.action

class MessageArtifact(db.Model):
    __tablename__ = 'message_artifacts'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=False)
    artifact_external_id = db.Column(db.String(120), nullable=True)
    type = db.Column(db.String(50), nullable=True) # flashcard, mindmap, audio, vocabulary, task, quiz
    
    # Content pointers (Composition approach)
    # Using string references for tables mostly solves order, but models must be registered
    flashcard_set_id = db.Column(db.Integer, db.ForeignKey('flashcard_sets.id'), nullable=True)
    mindmap_id = db.Column(db.Integer, db.ForeignKey('mindmaps.id'), nullable=True)
    audio_content_id = db.Column(db.Integer, db.ForeignKey('audio_content.id'), nullable=True)
    vocabulary_set_id = db.Column(db.Integer, db.ForeignKey('vocabulary_sets.id'), nullable=True)
    task_id = db.Column(db.Integer, db.ForeignKey('proposed_tasks.id'), nullable=True)
    quiz_set_id = db.Column(db.Integer, db.ForeignKey('quiz_sets.id'), nullable=True)

    # Legacy / Common fields
    title = db.Column(db.String(255), nullable=True)
    summary = db.Column(db.Text, nullable=True)

    # Relationships
    flashcard_set = db.relationship('FlashcardSet', backref='artifacts', uselist=False)
    mindmap = db.relationship('Mindmap', backref='artifacts', uselist=False)
    audio_content = db.relationship('AudioContent', backref='artifacts', uselist=False)
    vocabulary_set = db.relationship('VocabularySet', backref='artifacts', uselist=False)
    task = db.relationship('ProposedTask', backref='artifacts', uselist=False)
    quiz_set = db.relationship('QuizSet', backref='artifacts', uselist=False)

    citations = db.relationship('Citation', backref='artifact', cascade="all, delete-orphan")

    def to_dict(self):
        content_data = {}
        if self.flashcard_set:
            content_data['flashcards'] = self.flashcard_set.to_dict()
        if self.mindmap:
            content_data['mindmap'] = self.mindmap.to_dict()
        if self.audio_content:
            content_data['audio'] = self.audio_content.to_dict()
        if self.vocabulary_set:
            content_data['vocabulary'] = self.vocabulary_set.to_dict()
        if self.task:
            content_data['task'] = self.task.to_dict()
        if self.quiz_set:
            content_data['quiz'] = self.quiz_set.to_dict()
        
        content_data['title'] = self.title
        content_data['summary'] = self.summary

        return {
            'artifactId': self.artifact_external_id,
            'type': self.type,
            'content': content_data,
            'citations': [c.to_dict() for c in self.citations]
        }

class Citation(db.Model):
    __tablename__ = 'citations'
    
    id = db.Column(db.Integer, primary_key=True)
    artifact_id = db.Column(db.Integer, db.ForeignKey('message_artifacts.id'), nullable=False)
    citation_external_id = db.Column(db.String(120), nullable=True)
    source = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'citationId': self.citation_external_id,
            'source': self.source
        }
