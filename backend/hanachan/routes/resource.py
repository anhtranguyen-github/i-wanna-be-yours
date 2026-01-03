from flask import Blueprint, jsonify, request
from services.resource_processor import ResourceProcessor
from services.queue_factory import get_redis_connection
from rq.job import Job
from rq.exceptions import NoSuchJobError
from models.resource import Resource
from database.database import db
from modules.security import FileSecurity
from utils.auth import login_required
import os
import magic
from datetime import datetime

bp = Blueprint('resource', __name__, url_prefix='/resource')

# Use a relative path from the app root
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.mp3', '.mp4', '.m4a', '.jpg', '.jpeg', '.png', '.webp'}

@bp.route('/upload', methods=['POST'])
@login_required
def upload_resource():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    user_id = request.user.get("userId") or request.user.get("id")
    tags = request.form.getlist('tags')
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"File type not allowed: {ext}"}), 400
    
    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Validate content (Issue #21 security)
    with open(filepath, 'rb') as f:
        content_bytes = f.read()
        if not FileSecurity.validate_content(content_bytes):
            os.remove(filepath)
            return jsonify({"error": "File content validation failed"}), 400
    
    # Detect mime type
    mime_type = magic.from_file(filepath, mime=True)
    
    # Create DB entry
    new_resource = Resource(
        user_id=str(user_id),
        title=file.filename,
        type="audio" if ext in {'.mp3', '.m4a', '.mp4'} else "document",
        file_path=filepath,
        file_size=os.path.getsize(filepath),
        mime_type=mime_type,
        tags=tags,
        ingestion_status="pending"
    )
    
    db.session.add(new_resource)
    db.session.commit()
    
    # Automatically trigger ingestion after upload
    processor = ResourceProcessor()
    processor.trigger_ingestion(str(new_resource.id))
    
    return jsonify(new_resource.to_dict()), 201

@bp.route('', methods=['GET'])
@login_required
def list_resources():
    user_id = request.user.get("userId") or request.user.get("id")
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    query = Resource.query.filter_by(user_id=str(user_id))
    total = query.count()
    
    resources = query.order_by(Resource.created_at.desc()) \
                    .offset((page - 1) * limit) \
                    .limit(limit).all()
    
    return jsonify({
        "resources": [r.to_dict() for r in resources],
        "total": total,
        "page": page,
        "limit": limit
    }), 200

@bp.route('/<int:resource_id>', methods=['GET'])
@login_required
def get_resource(resource_id):
    user_id = request.user.get("userId") or request.user.get("id")
    role = request.user.get("role")
    
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({"error": "Resource not found"}), 404
    
    if str(resource.user_id) != str(user_id) and role != "ingestion_worker":
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify(resource.to_dict()), 200

@bp.route('/<int:resource_id>', methods=['PATCH'])
@login_required
def update_resource(resource_id):
    user_id = request.user.get("userId") or request.user.get("id")
    role = request.user.get("role")
    data = request.json
    
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({"error": "Resource not found"}), 404
    
    is_authorized = (str(resource.user_id) == str(user_id))
    if not is_authorized and role == "ingestion_worker":
        allowed_worker_fields = {"ingestionStatus", "metadata", "updatedAt", "ingestion_status", "metadata_"}
        if all(k in allowed_worker_fields for k in data.keys()):
            is_authorized = True
            
    if not is_authorized:
        return jsonify({"error": "Unauthorized"}), 403

    # Map frontend/legacy field names if necessary
    if "ingestionStatus" in data:
        resource.ingestion_status = data.pop("ingestionStatus")
    if "metadata" in data:
        resource.metadata_ = data.pop("metadata")
        
    for key, value in data.items():
        if hasattr(resource, key):
            setattr(resource, key, value)
            
    db.session.commit()
    return jsonify({"message": "Resource updated successfully"}), 200

@bp.route('/<int:resource_id>', methods=['DELETE'])
@login_required
def delete_resource(resource_id):
    user_id = request.user.get("userId") or request.user.get("id")
    
    resource = Resource.query.filter_by(id=resource_id, user_id=str(user_id)).first()
    if not resource:
        return jsonify({"error": "Resource not found"}), 404
        
    if os.path.exists(resource.file_path):
        os.remove(resource.file_path)
        
    db.session.delete(resource)
    db.session.commit()
    return jsonify({"message": "Resource deleted successfully"}), 200

@bp.route('/ingest/<resource_id>', methods=['POST'])
@login_required
def trigger_ingest(resource_id):
    # Backward compatibility for existing ingestion triggers
    processor = ResourceProcessor()
    job_id = processor.trigger_ingestion(str(resource_id))
    if job_id:
        return jsonify({"status": "queued", "job_id": job_id}), 200
    else:
        return jsonify({"error": "Failed to enqueue ingestion"}), 500

@bp.route('/ingest/status/<job_id>', methods=['GET'])
@login_required
def get_ingest_status(job_id):
    try:
        conn = get_redis_connection()
        job = Job.fetch(job_id, connection=conn)
        return jsonify({
            "job_id": job_id,
            "status": job.get_status(),
            "meta": job.meta,
            "result": job.result
        }), 200
    except NoSuchJobError:
        return jsonify({"error": "Job not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
