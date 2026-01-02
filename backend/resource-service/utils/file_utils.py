import hashlib
import os

def calculate_file_hash(content: bytes) -> str:
    """Calculates MD5 hash of a bytes object."""
    return hashlib.md5(content).hexdigest()

def get_resource_type(filename: str) -> str:
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    types = {
        'document': {'pdf', 'docx', 'doc', 'txt', 'md', 'rtf'},
        'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
        'audio': {'mp3', 'wav', 'ogg', 'm4a'}
    }
    
    for resource_type, extensions in types.items():
        if ext in extensions:
            return resource_type
    return 'document'
