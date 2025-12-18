
import requests
import io
import logging
from PyPDF2 import PdfReader
# from docx import Document # python-docx

RESOURCES_API = "http://localhost:5100"

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
            download_res = requests.get(f"{RESOURCES_API}/f-api/v1/resources/{resource_id}/download")
            if not download_res.ok:
                logging.error(f"Failed to download file for {resource_id}: {download_res.status_code}")
                return None
            
            # Extract text based on type
            content = ""
            mime_type = metadata.get('mimeType', '')
            file_bytes = download_res.content
            
            if 'pdf' in mime_type or metadata.get('type') == 'document':
                content = self._extract_text(file_bytes, mime_type, metadata.get('originalFilename', ''))
            
            # Fallback for plain text or unknown
            if not content and mime_type.startswith('text/'):
                 content = file_bytes.decode('utf-8', errors='ignore')

            return {
                "id": resource_id,
                "title": metadata['title'],
                "type": metadata['type'],
                "content": content
            }
        except Exception as e:
            logging.error(f"Error processing resource {resource_id}: {e}")
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
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text.strip()
