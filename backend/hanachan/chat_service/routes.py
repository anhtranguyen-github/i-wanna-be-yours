from flask import request, Response, stream_with_context, jsonify, g
import asyncio
import logging
from .service import chat_service
from modules.auth_middleware import require_auth

logger = logging.getLogger(__name__)

def register_routes(app):
    @app.route('/chat/stream', methods=['POST'])
    @require_auth
    def chat_stream():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        conversation_id = data.get('conversation_id')
        user_id = g.user.get('userId') if hasattr(g, 'user') else data.get('user_id')
        
        if not query:
            return jsonify({'error': "Missing 'query'"}), 400

        def generate():
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            agen = chat_service.stream_answer(query, conversation_id, user_id, show_thinking)
            
            while True:
                try:
                    chunk = loop.run_until_complete(agen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
                except Exception as e:
                    logger.error(f"Error in stream: {e}")
                    yield f"Error: {str(e)}"
                    break

        return Response(stream_with_context(generate()), mimetype='text/plain')

    @app.route('/chat/complete', methods=['POST'])
    @require_auth
    def chat_complete():
        data = request.get_json() or {}
        query = data.get('query') or data.get('text') or ''
        show_thinking = bool(data.get('thinking') or (request.args.get('thinking') in ['1','true','yes']))
        conversation_id = data.get('conversation_id')
        user_id = g.user.get('userId') if hasattr(g, 'user') else data.get('user_id')
        
        if not query:
            return jsonify({'error': "Missing 'query'"}), 400

        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        text = loop.run_until_complete(chat_service.full_answer(query, conversation_id, user_id, show_thinking))
        return jsonify({'response': text})

    @app.route('/chat/history', methods=['GET'])
    @require_auth
    def get_history():
        conversation_id = request.args.get('conversation_id')
        user_id = g.user.get('userId')
        if not conversation_id:
            return jsonify({'error': "Missing 'conversation_id'"}), 400
            
        history = chat_service.get_history_json(conversation_id, user_id)
        return jsonify({'history': history})

    @app.route('/chat/conversations', methods=['GET'])
    @require_auth
    def get_conversations():
        user_id = g.user.get('userId')
        conversations = chat_service.get_user_conversations(user_id)
        return jsonify({'conversations': conversations})

    @app.route('/chat/conversations/<conversation_id>', methods=['DELETE'])
    @require_auth
    def delete_conversation(conversation_id):
        user_id = g.user.get('userId')
        success = chat_service.delete_conversation(conversation_id, user_id)
        if success:
            return jsonify({'message': 'Conversation deleted'})
        return jsonify({'error': 'Conversation not found or not authorized'}), 404

    # --- Resource Routes ---

    @app.route('/resources', methods=['GET'])
    @require_auth
    def get_resources():
        user_id = g.user.get('userId')
        resources = chat_service.get_user_resources(user_id)
        return jsonify({'resources': resources})

    @app.route('/resources', methods=['POST'])
    @require_auth
    def create_resource():
        user_id = g.user.get('userId')
        data = request.get_json() or {}
        
        if not all(k in data for k in ('type', 'content', 'title')):
            return jsonify({'error': 'Missing required fields'}), 400
            
        resource = chat_service.create_resource(
            user_id, 
            data['type'], 
            data['content'], 
            data['title']
        )
        return jsonify({'resource': resource})

    @app.route('/resources/<resource_id>', methods=['DELETE'])
    @require_auth
    def delete_resource(resource_id):
        user_id = g.user.get('userId')
        success = chat_service.delete_resource(resource_id, user_id)
        if success:
            return jsonify({'message': 'Resource deleted'})
        return jsonify({'error': 'Resource not found or not authorized'}), 404
