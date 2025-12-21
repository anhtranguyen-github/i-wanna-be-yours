"""
Artifact API routes - REST endpoints for artifact management.
All artifacts use flexible schema (metadata and data can contain any fields).
"""
from flask import Blueprint, request, jsonify
from services.artifact_service import ArtifactService
from utils.auth import login_required

bp = Blueprint('artifacts', __name__, url_prefix='/artifacts')


@bp.route('/', methods=['POST'])
@login_required
def create_artifact():
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Create a new artifact.
    
    Body:
    {
        "userId": "user_123",
        "type": "flashcard_deck",
        "title": "N5 Verbs",
        "data": { ... },       // Any structure
        "metadata": { ... },   // Any fields
        "conversationId": "conv_456",  // Optional
        "savedToLibrary": false
    }
    """
    data = request.json
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
    
    required = ["type", "title", "data"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    artifact = ArtifactService.create_artifact(
        user_id=user_id,
        artifact_type=data["type"],
        title=str(data["title"]),
        data=data["data"],
        metadata=data.get("metadata", {}),
        conversation_id=data.get("conversationId"),
        message_id=data.get("messageId"),
        save_to_library=data.get("savedToLibrary", False)
    )
    
    return jsonify(artifact), 201


@bp.route('/<artifact_id>', methods=['GET'])
@login_required
def get_artifact(artifact_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Get artifact by ID.
    Requires userId for authorization - only the artifact owner can access it.
    """
    # Ownership check is done within the service using user_id from token
    
    artifact = ArtifactService.get_artifact(artifact_id, user_id)
    
    if not artifact:
        return jsonify({"error": "Artifact not found or not owned"}), 404
    
    return jsonify(artifact)


@bp.route('/', methods=['GET'])
@login_required
def list_artifacts():
    user_id = request.user.get("userId") or request.user.get("id")
    """
    List user's artifacts.
    
    Query params:
    - userId: Required
    - type: Optional filter (flashcard_deck, quiz, exam, etc.)
    - savedToLibrary: Optional filter (true/false)
    - limit: Optional (default 50)
    - skip: Optional pagination offset
    """
    # user_id comes from token
    
    artifact_type = request.args.get("type")
    saved_only = request.args.get("savedToLibrary", "").lower() == "true"
    limit = int(request.args.get("limit", 50))
    skip = int(request.args.get("skip", 0))
    
    artifacts = ArtifactService.get_user_artifacts(
        user_id=user_id,
        artifact_type=artifact_type,
        saved_only=saved_only,
        limit=limit,
        skip=skip
    )
    
    return jsonify({
        "artifacts": artifacts,
        "count": len(artifacts),
        "skip": skip,
        "limit": limit
    })


@bp.route('/<artifact_id>/save', methods=['PATCH'])
@login_required
def save_to_library(artifact_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Mark artifact as saved to user's library.
    
    Body:
    {
        "userId": "user_123"
    }
    """
    data = request.json or {}
    # user_id from token
    
    success = ArtifactService.save_to_library(artifact_id, user_id)
    
    if success:
        return jsonify({"success": True, "message": "Saved to library"})
    else:
        return jsonify({"error": "Artifact not found or not owned"}), 404


@bp.route('/<artifact_id>', methods=['PATCH'])
@login_required
def update_artifact(artifact_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Update artifact fields.
    
    Body: Any fields to update (title, metadata, data, etc.)
    Must include userId for ownership check.
    """
    data = request.json or {}
    # user_id from token, remove from body if present to avoid confusion
    data.pop("userId", None)
    
    if not data:
        return jsonify({"error": "No fields to update"}), 400
    
    success = ArtifactService.update_artifact(artifact_id, user_id, data)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Artifact not found or not owned"}), 404


@bp.route('/<artifact_id>/cards', methods=['POST'])
@login_required
def add_cards_to_deck(artifact_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Add cards to an existing flashcard deck.
    
    Body:
    {
        "userId": "user_123",
        "cards": [
            { "front": "食べる", "back": "to eat" },
            ...
        ]
    }
    """
    data = request.json or {}
    # user_id from token
    
    if not cards:
        return jsonify({"error": "cards array required"}), 400
    
    success = ArtifactService.add_cards_to_deck(artifact_id, user_id, cards)
    
    if success:
        return jsonify({"success": True, "cardsAdded": len(cards)})
    else:
        return jsonify({"error": "Deck not found or not owned"}), 404


@bp.route('/<artifact_id>', methods=['DELETE'])
@login_required
def delete_artifact(artifact_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """Delete an artifact."""
    # user_id from token
    
    success = ArtifactService.delete_artifact(artifact_id, user_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Artifact not found or not owned"}), 404


@bp.route('/conversation/<conversation_id>', methods=['GET'])
@login_required
def get_conversation_artifacts(conversation_id):
    user_id = request.user.get("userId") or request.user.get("id")
    """
    Get all artifacts from a conversation.
    Requires userId for authorization - only the conversation owner can access artifacts.
    """
    # user_id from token
    
    artifacts = ArtifactService.get_conversation_artifacts(conversation_id, user_id)
    
    return jsonify({
        "artifacts": artifacts,
        "count": len(artifacts)
    })

