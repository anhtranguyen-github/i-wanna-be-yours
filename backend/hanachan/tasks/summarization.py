import logging
from app import create_app, db
from models.conversation import Conversation
from models.message import ChatMessage
from services.summarizer_service import SummarizerService

logger = logging.getLogger(__name__)

def summarize_conversation_task(conversation_id: int):
    """
    Background task to update conversation summary.
    """
    app = create_app()
    with app.app_context():
        try:
            conv = Conversation.query.get(conversation_id)
            if not conv:
                logger.error(f"Task Error: Conversation {conversation_id} not found.")
                return

            # 1. Fetch all messages
            # In a real scenario, we might want to only summarize messages that aren't yet summarized
            messages = ChatMessage.query.filter_by(conversation_id=conversation_id).order_by(ChatMessage.created_at.asc()).all()
            
            if not messages:
                return

            # 2. Logic: Summarize everything except the last 3 turns to keep immediate context raw
            # (Turn = 1 user + 1 assistant)
            RAW_BUFFER_TURNS = 6 # approx 3 full exchanges
            
            if len(messages) <= RAW_BUFFER_TURNS:
                logger.info(f"Skipping summarization for {conversation_id}: too few messages ({len(messages)})")
                return

            to_summarize = messages[:-RAW_BUFFER_TURNS]
            
            # Format for summarizer
            msg_dicts = []
            for m in to_summarize:
                msg_dicts.append({
                    "role": m.role,
                    "content": m.content,
                    "attachments": m.attachments or [] # Now already stores [{"id":..., "title":...}]
                })

            # 3. Call Summarizer
            summarizer = SummarizerService()
            # We don't pass 'existing_summary' here because we are re-summarizing the whole old block
            # Or we could pass it to be more efficient, but re-reading everything into a new summary
            # ensures we don't drift too much from the original context.
            # For efficiency in very long chats, using existing_summary + new_chunk is better.
            new_summary = summarizer.summarize_messages(msg_dicts, existing_summary=None)

            # 4. Update Conversation
            conv.summary = new_summary
            conv.last_summarized_msg_id = to_summarize[-1].id
            db.session.commit()
            
            logger.info(f"Successfully updated summary for Conversation {conversation_id}. Last summarized ID: {conv.last_summarized_msg_id}")

        except Exception as e:
            logger.error(f"Failed to summarize conversation {conversation_id}: {e}")
            db.session.rollback()
