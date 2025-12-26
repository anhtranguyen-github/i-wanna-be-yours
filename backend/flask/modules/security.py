
import os
import magic
import clamd
import logging
from flask import request, jsonify
from functools import wraps

# Configuration
ALLOWED_EXTENSIONS = {
    'document': {'pdf', 'docx', 'doc', 'txt', 'md', 'rtf'},
    'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
    'audio': {'mp3', 'wav', 'ogg', 'm4a'}
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
CLAMAV_HOST = os.getenv("CLAMAV_HOST", "localhost")
CLAMAV_PORT = int(os.getenv("CLAMAV_PORT", 3310))

class FileSecurityMiddleware:
    def __init__(self):
        self.magic = magic.Magic(mime=True)
        try:
            self.cd = clamd.ClamdNetworkSocket(host=CLAMAV_HOST, port=CLAMAV_PORT)
            # Try a ping to verify connection
            self.cd.ping()
            self.clamav_available = True
        except Exception as e:
            logging.error(f"ClamAV not available: {e}")
            self.clamav_available = False

    def validate_file(self, file_stream, filename):
        """
        Validates file size, extension and magic number.
        Returns (is_valid, error_code, error_message)
        """
        # 1. Check Extension
        if '.' not in filename:
            return False, "INVALID_EXTENSION", "File has no extension"
        
        ext = filename.rsplit('.', 1)[1].lower()
        all_allowed = set()
        for exts in ALLOWED_EXTENSIONS.values():
            all_allowed.update(exts)
        
        if ext not in all_allowed:
            return False, "INVALID_EXTENSION", f"File type not allowed (Extension .{ext} not allowed)"

        # 2. Check Size
        file_stream.seek(0, os.SEEK_END)
        size = file_stream.tell()
        file_stream.seek(0)

        if size > MAX_FILE_SIZE:
            return False, "FILE_TOO_LARGE", f"File size {size} exceeds limit of {MAX_FILE_SIZE}"

        # 3. Check Magic Number (Mime Type)
        # Read first 2048 bytes for magic check
        header = file_stream.read(2048)
        mime_type = self.magic.from_buffer(header)
        file_stream.seek(0)

        # Basic mime check - mapping back to allowed categories
        # This is a bit simplified, but checks if the magic mime matches the extension class
        if 'image' in mime_type and ext not in ALLOWED_EXTENSIONS['image']:
            return False, "MIME_MISMATCH", f"File content looks like an image but has extension .{ext}"
        if 'pdf' in mime_type and ext != 'pdf':
             return False, "MIME_MISMATCH", "File content looks like PDF but has different extension"
        
        # 4. Virus Scan
        if self.clamav_available:
            try:
                scan_result = self.cd.instream(file_stream)
                file_stream.seek(0)
                if scan_result and scan_result['stream'][0] == 'FOUND':
                    virus_name = scan_result['stream'][1]
                    return False, "VIRUS_DETECTED", f"Virus detected: {virus_name}"
            except Exception as e:
                logging.error(f"Virus scan failed: {e}")
                # We might want to block or allow if scan fails. 
                # For high security, we block.
                # return False, "SCAN_FAILED", "Could not complete virus scan"

        return True, None, None

def file_security_check(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'file' not in request.files:
            return f(*args, **kwargs) # Let the controller handle missing file if needed
        
        file = request.files['file']
        security = FileSecurityMiddleware()
        is_valid, code, message = security.validate_file(file, file.filename)
        
        if not is_valid:
            return jsonify({"code": code, "error": message}), 400
        
        return f(*args, **kwargs)
    return decorated
