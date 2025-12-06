import os
import jwt
from functools import wraps
from flask import request, jsonify, g

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # TEMPORARY: Disable auth for local dev
        g.user = {"user_id": "dev_user", "username": "dev_user", "userId": "dev_user_id"}
        return f(*args, **kwargs)
        
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({'error': 'Token is missing'}), 401

        secret = os.getenv('JWT_SECRET', 'your-secret-key')
        
        try:
            # Verify token
            # Note: algorithms parameter is important to prevent downgrade attacks
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            g.user = payload # Store user info in flask global context
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated
