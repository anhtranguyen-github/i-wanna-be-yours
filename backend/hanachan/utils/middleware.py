from functools import wraps
from flask import request, jsonify, g
import requests
import os

RESOURCES_INTERNAL_API = "http://localhost:5100/v1/resources"
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.png', '.jpg', '.jpeg', '.docx'}

def validate_resource_access(f):
    """
    Middleware to ensure:
    1. Resource IDs belong to the requesting user.
    2. File types are allowed for AI processing.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()
        if not data:
            return f(*args, **kwargs)

        user_id = data.get('user_id') or data.get('userId')
        # Handle context_config structure
        context_config = data.get('context_config', {})
        resource_ids = context_config.get('resource_ids', []) if isinstance(context_config, dict) else []
        
        # Also check top-level resource_ids if any
        if 'resource_ids' in data:
            resource_ids.extend(data['resource_ids'])

        if not resource_ids:
            return f(*args, **kwargs)
            
        # Get Auth token to forward
        auth_header = request.headers.get('Authorization')
        headers = {'Authorization': auth_header} if auth_header else {}

        for rid in resource_ids:
            try:
                # 1. Fetch metadata from internal resource service
                # We use internal port 5100 where the flask-dynamic-db lives
                resp = requests.get(f"{RESOURCES_INTERNAL_API}/{rid}", headers=headers)
                if not resp.ok:
                    return jsonify({"error": f"Resource {rid} not found or inaccessible"}), 404
                
                meta = resp.json()
                
                # 2. Check Ownership
                res_user_id = meta.get('userId') or meta.get('user_id')
                if user_id and str(res_user_id) != str(user_id):
                    return jsonify({"error": f"Unauthorized access to resource {rid}"}), 403
                
                # 3. Check File Type
                filename = meta.get('originalFilename', '').lower()
                mime_type = meta.get('mimeType', '').lower()
                
                is_allowed = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS) or \
                             'pdf' in mime_type or 'text' in mime_type or 'image' in mime_type
                
                if not is_allowed:
                    return jsonify({"error": f"File type for {rid} is not supported for AI analysis"}), 400
                    
            except Exception as e:
                return jsonify({"error": f"Error validating resource {rid}: {str(e)}"}), 500

        return f(*args, **kwargs)
    return decorated_function
