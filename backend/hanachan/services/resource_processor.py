
import requests
import io
import logging

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
    logging.warning("PyPDF2 not installed. PDF extraction will fail.")

# from docx import Document # python-docx

import os

RESOURCES_API = os.environ.get("RESOURCES_API_URL", "http://localhost:5100")

class ResourceProcessor:
    """Handles downloading and processing resources for AI context"""
    
    def get_resource_content(self, resource_id: str) -> dict:
        """Download resource and extract text"""
        try:
            # Get metadata
            meta_res = requests.get(f"{RESOURCES_API}/f-api/v1/resources/{resource_id}")
            if not meta_res.ok:
                logging.error(f"Failed to fetch metadata for {resource_id}: {meta_res.status_code}")
                return None
            
            metadata = meta_res.json()
            
            # Download file
            from modules.security import FileSecurity
            
            download_res = requests.get(
                f"{RESOURCES_API}/f-api/v1/resources/{resource_id}/download",
                timeout=30 # Security: Timeout to prevent hanging
            )
            if not download_res.ok:
                logging.error(f"Failed to download file for {resource_id}: {download_res.status_code}")
                return None
            
            file_bytes = download_res.content
            
            # Security: Validate Magic Bytes
            if not FileSecurity.validate_content(file_bytes):
                logging.error(f"FileSecurity: Rejected resource {resource_id} due to invalid magic bytes.")
                return None

            # Security: Size check
            if not FileSecurity.is_safe_size(len(file_bytes)):
                logging.error(f"FileSecurity: Rejected resource {resource_id} due to size limit.")
                return None

            # Extract text based on type
            
            if 'image' in mime_type:
                import base64
                media_base64 = base64.b64encode(file_bytes).decode('utf-8')
            elif 'pdf' in mime_type or metadata.get('type') == 'document':
                content = self._extract_text(file_bytes, mime_type, metadata.get('originalFilename', ''))
            
            # Fallback for plain text or unknown
            if not content and not media_base64 and mime_type.startsWith('text/'):
                 content = file_bytes.decode('utf-8', errors='ignore')

            return {
                "id": resource_id,
                "title": metadata['title'],
                "type": metadata['type'],
                "mimeType": mime_type,
                "content": content,
                "mediaBase64": media_base64
            }
        except Exception as e:
            logging.error(f"Error processing resource {resource_id}: {e}")
            return None
    
    def trigger_ingestion(self, resource_id: str):
        """Enqueue a background task to ingest the resource"""
        try:
            from services.queue_factory import get_queue
            from tasks.resource import ingest_resource
            
            q = get_queue()
            job = q.enqueue(ingest_resource, resource_id=resource_id)
            logging.info(f"ResourceProcessor: Enqueued ingestion for {resource_id} (Job: {job.id})")
            return job.id
        except Exception as e:
            logging.error(f"Failed to enqueue ingestion for {resource_id}: {e}")
            return None
    
    def _extract_text(self, file_bytes: bytes, mime_type: str, filename: str) -> str:
        try:
            if 'pdf' in mime_type or filename.endswith('.pdf'):
                return self._extract_pdf(file_bytes)
            # Add docx support here if needed, requires python-docx
            # elif 'word' in mime_type or filename.endswith('.docx'):
            #    return self._extract_docx(file_bytes)
            elif 'text/plain' in mime_type or filename.endswith('.txt'):
                return file_bytes.decode('utf-8', errors='ignore')
            return ""
        except Exception as e:
            logging.error(f"Extraction error: {e}")
            return ""
    
    def _extract_pdf(self, file_bytes: bytes) -> str:
        if PdfReader is None:
            return "Error: PyPDF2 library not installed, cannot extract text from PDF."
            
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text.strip()
