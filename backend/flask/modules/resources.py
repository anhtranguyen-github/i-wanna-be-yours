
import os
import uuid
import logging
import shutil
from datetime import datetime, timezone
from flask import request, jsonify, send_file
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename
from modules.auth import login_required
from modules.security import file_security_check
from modules.validation import validate_request, ResourceUploadSchema, ResourceUpdateSchema

class ResourcesModule:
    """
    Pure storage service for file resources.
    Handles: upload, store, list, download, delete.
    Does NOT handle: text extraction, chunking, AI processing.
    """
    
    def __init__(self):
        # MongoDB connection
        # Using the same connection string as seen in server.py (or default local)
        # server.py uses: app.config["MONGO_URI_FLASKFLASHCARDDATABASE"] = "mongodb://localhost:27017/flaskFlashcardDB"
        # The plan says to use 'library' database.
        self.client = MongoClient("mongodb://localhost:27017/")
        self.db = self.client["library"]
        self.resources_collection = self.db["resources"]
        
        # File storage configuration
        # Relative to backend/flask/modules/ -> ../uploads
        self.upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
        os.makedirs(self.upload_folder, exist_ok=True)
        
        # Allowed extensions
        self.allowed_extensions = {
            'document': {'pdf', 'docx', 'doc', 'txt', 'md', 'rtf'},
            'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
            'audio': {'mp3', 'wav', 'ogg', 'm4a'}
        }
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        
        logging.basicConfig(level=logging.INFO)
    
    # --- Helper Methods ---

    def is_allowed_file(self, filename: str) -> bool:
        if '.' not in filename:
            return False
        ext = filename.rsplit('.', 1)[1].lower()
        all_extensions = set()
        for exts in self.allowed_extensions.values():
            all_extensions.update(exts)
        return ext in all_extensions

    def get_resource_type(self, file_ext: str) -> str:
        for resource_type, extensions in self.allowed_extensions.items():
            if file_ext in extensions:
                return resource_type
        return 'document'

    def get_file_path(self, relative_path: str) -> str:
        return os.path.join(self.upload_folder, relative_path)

    def save_file(self, file) -> dict:
        """
        Save uploaded file to disk with unique name.
        Returns dict with filePath, fileSize, mimeType, extension.
        """
        if not file or file.filename == '':
            raise ValueError("No file provided")
        
        # Security checks are now handled by FileSecurityMiddleware
        # We only need to save the file and return info.
        
        # Check size for storage info (stream handle should be at 0)
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_id = str(uuid.uuid4())[:8]
        safe_name = secure_filename(file.filename)
        unique_filename = f"{unique_id}_{safe_name}"
        
        # Create date-based folder
        date_folder = datetime.now().strftime("%Y/%m")
        upload_path = os.path.join(self.upload_folder, date_folder)
        os.makedirs(upload_path, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_path, unique_filename)
        file.save(file_path)
        
        # Relative path for storage in DB
        # Note: os.path.join might use backslashes on Windows, but we want forward slashes for DB consistency usually.
        # However, backend is running in WSL/Linux, so forward slash is default.
        relative_path = f"{date_folder}/{unique_filename}"
        
        return {
            "filePath": relative_path,
            "fileSize": os.path.getsize(file_path),
            "mimeType": file.content_type,
            "extension": file_ext
        }

    # --- Route Registration ---

    def register_routes(self, app):
        
        @app.route("/v1/resources/upload", methods=["POST"])
        @login_required
        @file_security_check
        @validate_request(ResourceUploadSchema)
        def upload_resource():
            user_id = request.user.get("userId") or request.user.get("id")
            try:
                if 'file' not in request.files:
                    return jsonify({"error": "No file provided"}), 400
                
                file = request.files['file']
                validated_data = request.validated_data
                tags = validated_data.get('tags') or []
                description = validated_data.get('description', '')
                
                # Save file to disk
                file_info = self.save_file(file)
                
                # Create resource document (metadata only)
                resource_doc = {
                    "userId": user_id,
                    "title": file.filename,
                    "description": description,
                    "type": self.get_resource_type(file_info['extension']),
                    "mimeType": file_info['mimeType'],
                    "filePath": file_info['filePath'],
                    "fileSize": file_info['fileSize'],
                    "originalFilename": file.filename,
                    "tags": tags,
                    "metadata": {},
                    "createdAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                    "deletedAt": None
                }
                
                result = self.resources_collection.insert_one(resource_doc)
                resource_id = str(result.inserted_id)
                
                return jsonify({
                    "id": resource_id,
                    "title": resource_doc["title"],
                    "type": resource_doc["type"],
                    "mimeType": resource_doc["mimeType"],
                    "fileSize": resource_doc["fileSize"],
                    "createdAt": resource_doc["createdAt"].isoformat()
                }), 201
                
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                logging.error(f"Upload error: {e}")
                return jsonify({"error": "Upload failed"}), 500
        
        
        @app.route("/v1/resources", methods=["GET"])
        @login_required
        def list_resources():
            user_id = request.user.get("userId") or request.user.get("id")
            resource_type = request.args.get('type')
            limit = int(request.args.get('limit', 50))
            offset = int(request.args.get('offset', 0))
            
            try:
                query = {"deletedAt": None}
                if user_id:
                    query["userId"] = user_id
                if resource_type:
                    query["type"] = resource_type
                
                total = self.resources_collection.count_documents(query)
                cursor = self.resources_collection.find(query) \
                    .sort("createdAt", -1) \
                    .skip(offset) \
                    .limit(limit)
                
                resources = []
                for doc in cursor:
                    resources.append({
                        "id": str(doc["_id"]),
                        "title": doc.get("title"),
                        "type": doc.get("type"),
                        "fileSize": doc.get("fileSize"),
                        "tags": doc.get("tags", []),
                        "createdAt": doc.get("createdAt").isoformat() if doc.get("createdAt") else None
                    })
                
                return jsonify({
                    "resources": resources,
                    "total": total,
                    "limit": limit,
                    "offset": offset
                }), 200
            except Exception as e:
                logging.error(f"Error listing resources: {e}")
                return jsonify({"error": "Failed to list resources", "details": str(e)}), 500
        
        
        @app.route("/v1/resources/<id>", methods=["GET"])
        @login_required
        def get_resource(id):
            user_id = request.user.get("userId") or request.user.get("id")
            role = request.user.get("role")
            
            try:
                query = {
                    "_id": ObjectId(id),
                    "deletedAt": None
                }
                if role != 'admin':
                    query["userId"] = user_id

                resource = self.resources_collection.find_one(query)
                if not resource:
                    return jsonify({"error": "Resource not found"}), 404
                
                return jsonify({
                    "id": str(resource["_id"]),
                    "userId": resource.get("userId"),
                    "title": resource.get("title"),
                    "description": resource.get("description"),
                    "type": resource.get("type"),
                    "mimeType": resource.get("mimeType"),
                    "fileSize": resource.get("fileSize"),
                    "filePath": resource.get("filePath"),
                    "tags": resource.get("tags", []),
                    "createdAt": resource.get("createdAt").isoformat() if resource.get("createdAt") else None,
                    "updatedAt": resource.get("updatedAt").isoformat() if resource.get("updatedAt") else None
                }), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/v1/resources/<id>/download", methods=["GET"])
        @login_required
        def download_resource(id):
            user_id = request.user.get("userId") or request.user.get("id")
            role = request.user.get("role")
            
            try:
                query = {
                    "_id": ObjectId(id),
                    "deletedAt": None
                }
                if role != 'admin':
                    query["userId"] = user_id

                resource = self.resources_collection.find_one(query)
                if not resource:
                    return jsonify({"error": "Resource not found"}), 404
                
                file_path = self.get_file_path(resource["filePath"])
                if not os.path.exists(file_path):
                    return jsonify({"error": "File not found on disk"}), 404
                
                return send_file(
                    file_path,
                    as_attachment=True,
                    download_name=resource.get("originalFilename", resource.get("title", "download"))
                )
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/v1/resources/<id>", methods=["PUT"])
        @login_required
        @validate_request(ResourceUpdateSchema)
        def update_resource(id):
            user_id = request.user.get("userId") or request.user.get("id")
            try:
                data = request.validated_data
                
                update_fields = {"updatedAt": datetime.now(timezone.utc)}
                if "title" in data:
                    update_fields["title"] = str(data["title"])
                if "description" in data:
                    update_fields["description"] = str(data["description"])
                if "tags" in data:
                    update_fields["tags"] = [str(t) for t in data["tags"]]
                
                result = self.resources_collection.update_one(
                    {"_id": ObjectId(id), "userId": user_id, "deletedAt": None},
                    {"$set": update_fields}
                )
                
                if result.matched_count == 0:
                    return jsonify({"error": "Resource not found"}), 404
                
                return jsonify({"message": "Resource updated", "id": id}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/v1/resources/<id>", methods=["DELETE"])
        @login_required
        def delete_resource(id):
            user_id = request.user.get("userId") or request.user.get("id")
            try:
                resource = self.resources_collection.find_one({
                    "_id": ObjectId(id),
                    "userId": user_id,
                    "deletedAt": None
                })
                if not resource:
                    return jsonify({"error": "Resource not found"}), 404
                
                # Soft delete (keep file for now)
                self.resources_collection.update_one(
                    {"_id": ObjectId(id)},
                    {"$set": {"deletedAt": datetime.now(timezone.utc)}}
                )
                
                return jsonify({"message": "Resource deleted", "id": id}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/v1/resources/search", methods=["GET"])
        @login_required
        def search_resources():
            user_id = request.user.get("userId") or request.user.get("id")
            query_text = request.args.get('q', '')
            
            if not query_text:
                return jsonify({"resources": []}), 200
            
            search_query = {
                "deletedAt": None,
                "$or": [
                    {"title": {"$regex": query_text, "$options": "i"}},
                    {"tags": {"$regex": query_text, "$options": "i"}}
                ]
            }
            if user_id:
                search_query["userId"] = user_id
            
            cursor = self.resources_collection.find(search_query).limit(20)
            
            resources = [{
                "id": str(doc["_id"]),
                "title": doc.get("title"),
                "type": doc.get("type"),
                "tags": doc.get("tags", [])
            } for doc in cursor]
            
            return jsonify({"resources": resources}), 200
