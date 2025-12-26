
import os

def get_cors_config():
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    return {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Content-Range"],
        "supports_credentials": True,
        "max_age": 86400
    }
