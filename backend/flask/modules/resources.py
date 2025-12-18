
import os
import uuid
import logging
import shutil
from datetime import datetime
from flask import request, jsonify, send_file
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename

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
        # Validate
        if not file or file.filename == '':
            raise ValueError("No file provided")
        
        if not self.is_allowed_file(file.filename):
            raise ValueError("File type not allowed")
        
        # Check size (reading from stream might be tricky if we want to reset pointer, 
        # usually flask file storage handles this, but let's trust content-length or handle exceptions)
        # Using seek/tell on spooled file
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        
        if size > self.max_file_size:
            raise ValueError(f"File too large. Max size: {self.max_file_size / 1024 / 1024}MB")
        
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
        
        @app.route("/f-api/v1/resources/upload", methods=["POST"])
        def upload_resource():
            try:
                if 'file' not in request.files:
                    return jsonify({"error": "No file provided"}), 400
                
                file = request.files['file']
                user_id = request.form.get('userId')
                tags = request.form.getlist('tags') or [] # Handles x-www-form-urlencoded if multiple tags
                # If passing JSON via form field, might need parsing. 
                # Assuming simple form fields for tags: tags=a&tags=b
                
                description = request.form.get('description', '')
                
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
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
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
        
        
        @app.route("/f-api/v1/resources", methods=["GET"])
        def list_resources():
            user_id = request.args.get('userId')
            resource_type = request.args.get('type')
            limit = int(request.args.get('limit', 50))
            offset = int(request.args.get('offset', 0))
            
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
        
        
        @app.route("/f-api/v1/resources/<id>", methods=["GET"])
        def get_resource(id):
            try:
                resource = self.resources_collection.find_one({
                    "_id": ObjectId(id),
                    "deletedAt": None
                })
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
        
        
        @app.route("/f-api/v1/resources/<id>/download", methods=["GET"])
        def download_resource(id):
            try:
                resource = self.resources_collection.find_one({
                    "_id": ObjectId(id),
                    "deletedAt": None
                })
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
        
        
        @app.route("/f-api/v1/resources/<id>", methods=["PUT"])
        def update_resource(id):
            try:
                data = request.json or {}
                
                update_fields = {"updatedAt": datetime.utcnow()}
                if "title" in data:
                    update_fields["title"] = data["title"]
                if "description" in data:
                    update_fields["description"] = data["description"]
                if "tags" in data:
                    update_fields["tags"] = data["tags"]
                
                result = self.resources_collection.update_one(
                    {"_id": ObjectId(id), "deletedAt": None},
                    {"$set": update_fields}
                )
                
                if result.matched_count == 0:
                    return jsonify({"error": "Resource not found"}), 404
                
                return jsonify({"message": "Resource updated", "id": id}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/f-api/v1/resources/<id>", methods=["DELETE"])
        def delete_resource(id):
            try:
                resource = self.resources_collection.find_one({
                    "_id": ObjectId(id),
                    "deletedAt": None
                })
                if not resource:
                    return jsonify({"error": "Resource not found"}), 404
                
                # Soft delete (keep file for now)
                self.resources_collection.update_one(
                    {"_id": ObjectId(id)},
                    {"$set": {"deletedAt": datetime.utcnow()}}
                )
                
                return jsonify({"message": "Resource deleted", "id": id}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        
        @app.route("/f-api/v1/resources/search", methods=["GET"])
        def search_resources():
            query_text = request.args.get('q', '')
            user_id = request.args.get('userId')
            
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
