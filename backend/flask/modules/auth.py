import os
import jwt
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv("JWT_SECRET", "your-development-secret-key")
JWT_ALGORITHM = "HS256"

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token and request.cookies.get("accessToken"):
            token = request.cookies.get("accessToken")

        if not token:
            return jsonify({"code": "UNAUTHORIZED", "error": "Token is missing"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"code": "TOKEN_EXPIRED", "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"code": "TOKEN_INVALID", "error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"code": "AUTH_FAILED", "error": "Authentication failed"}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if request.user.get("role") != "admin":
            return jsonify({"code": "FORBIDDEN", "error": "Admin role required"}), 403
        return f(*args, **kwargs)
    return decorated
