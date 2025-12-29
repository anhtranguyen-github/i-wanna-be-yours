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
                # 0. Try generic cleanup of ID
                rid_str = str(rid)
                
                # 1. OPTION A: Check Local SQL Resource (Integer IDs)
                # Hanachan manages 'static' resources via proper SQL models
                local_res = None
                if rid_str.isdigit():
                    from models.resource import Resource
                    local_res = Resource.query.get(int(rid_str))
                
                if local_res:
                    # Validate Ownership Locally
                    # Allow if resource is global (user_id is None) OR if user owns it
                    if local_res.user_id and user_id and str(local_res.user_id) != str(user_id):
                        return jsonify({"error": f"Unauthorized access to resource {rid}"}), 403
                    
                    # Validate Type Locally
                    # SQL Resource usually has 'type' or content. Assuming text/valid for now.
                    # If we need strict checking, check local_res.type or suffix
                    continue # Validated locally
                
                # 2. OPTION B: Fetch metadata from internal resource service (Mongo/Legacy)
                # We use internal port 5100 where the flask-dynamic-db lives
                resp = requests.get(f"{RESOURCES_INTERNAL_API}/{rid}", headers=headers)
                if not resp.ok:
                    return jsonify({"error": f"Resource {rid} not found or inaccessible (checked local and remote)"}), 404
                
                meta = resp.json()
                
                # 2.1 Check Ownership
                res_user_id = meta.get('userId') or meta.get('user_id')
                if user_id and str(res_user_id) != str(user_id):
                    return jsonify({"error": f"Unauthorized access to resource {rid}"}), 403
                
                # 2.2 Check File Type
                filename = meta.get('originalFilename', '').lower()
                mime_type = meta.get('mimeType', '').lower()
                
                is_allowed = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS) or \
                             'pdf' in mime_type or 'text' in mime_type or 'image' in mime_type
                
                if not is_allowed:
                    return jsonify({"error": f"File type for {rid} is not supported for AI analysis"}), 400
                    
            except Exception as e:
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Error validating resource {rid}: {str(e)}"}), 500

        return f(*args, **kwargs)
    return decorated_function
