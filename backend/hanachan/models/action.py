from database.database import db

class ProposedTask(db.Model):
    __tablename__ = 'proposed_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=True)
    task_external_id = db.Column(db.String(120), nullable=True)
    title = db.Column(db.String(255), nullable=True)
    prompt = db.Column(db.Text, nullable=True)
    needs_confirmation = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'taskId': self.task_external_id,
            'title': self.title,
            'prompt': self.prompt,
            'needsConfirmation': self.needs_confirmation
        }

class Suggestion(db.Model):
    __tablename__ = 'suggestions'
    
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages.id'), nullable=True) # made nullable to avoid immediate constraint issues during migration if needed, but logic demands it.
    # response_id deprecated

    suggestion_external_id = db.Column(db.String(120), nullable=True)
    title = db.Column(db.String(255), nullable=True)
    prompt = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'suggestionId': self.suggestion_external_id,
            'title': self.title,
            'prompt': self.prompt
        }
