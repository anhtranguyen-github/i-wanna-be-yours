
import magic
import logging

logger = logging.getLogger(__name__)

class FileSecurity:
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/json'
    }

    @staticmethod
    def validate_content(file_bytes: bytes) -> bool:
        """
        Validate file content using magic bytes.
        """
        mime = magic.from_buffer(file_bytes, mime=True)
        if mime not in FileSecurity.ALLOWED_MIME_TYPES:
            logger.warning(f"FileSecurity: Blocked unauthorized MIME type: {mime}")
            return False
        return True

    @staticmethod
    def is_safe_size(size_bytes: int, max_mb: int = 25) -> bool:
        """
        Check if file size is within limits.
        """
        max_bytes = max_mb * 1024 * 1024
        if size_bytes > max_bytes:
            logger.warning(f"FileSecurity: Blocked oversized file: {size_bytes} bytes")
            return False
        return True
