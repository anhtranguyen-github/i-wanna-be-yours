import io
import logging
import os
import base64
import asyncio
from typing import Optional, Dict, Any
from database.mongo import get_db
from bson.objectid import ObjectId

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
    logging.warning("PyPDF2 not installed. PDF extraction will fail.")

try:
    from docx import Document
except ImportError:
    Document = None
    logging.warning("python-docx not installed. DOCX extraction will fail.")

logger = logging.getLogger(__name__)

class ResourceProcessor:
    """Handles text extraction and content processing (Asynchronous)."""

    def __init__(self, upload_folder: Optional[str] = None):
        self.upload_folder = upload_folder or os.environ.get("UPLOAD_FOLDER", "/app/uploads")
        self.db = get_db()
        self.resources = self.db.resources

    async def get_resource_doc(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Fetch metadata directly from MongoDB (Async)."""
        try:
            return await self.resources.find_one({"_id": ObjectId(resource_id)})
        except Exception as e:
            logger.error(f"Error fetching resource {resource_id} from Mongo: {e}")
            return None

    async def update_resource(self, resource_id: str, update_data: Dict[str, Any]):
        """Update resource metadata in MongoDB (Async)."""
        try:
            await self.resources.update_one(
                {"_id": ObjectId(resource_id)},
                {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"Error updating resource {resource_id}: {e}")

    async def get_resource_content(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Locates the file on disk and extracts its text/content (Async IO)."""
        doc = await self.get_resource_doc(resource_id)
        if not doc:
            return None

        file_path = os.path.join(self.upload_folder, doc.get("filePath", ""))
        
        if not os.path.exists(file_path):
            logger.error(f"File not found on disk: {file_path}")
            return None

        try:
            # Using run_in_executor for blocking disk read and CPU-bound extraction
            loop = asyncio.get_event_loop()
            
            def _extract_task():
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                mime_type = doc.get("mimeType", "")
                content = ""
                media_base64 = None

                if "image" in mime_type:
                    media_base64 = base64.b64encode(file_bytes).decode("utf-8")
                elif "pdf" in mime_type or file_path.endswith(".pdf"):
                    content = self._extract_pdf(file_bytes)
                elif "word" in mime_type or file_path.endswith(".docx"):
                    content = self._extract_docx(file_bytes)
                elif "text" in mime_type or file_path.endswith(".txt"):
                    content = file_bytes.decode("utf-8", errors="ignore")
                
                # Fallback
                if not content and not media_base64 and len(file_bytes) < 1024 * 1024:
                    try: content = file_bytes.decode("utf-8")
                    except: pass

                return content, media_base64, mime_type

            content, media_base64, mime_type = await loop.run_in_executor(None, _extract_task)

            return {
                "id": str(doc["_id"]),
                "userId": doc.get("userId"),
                "title": doc.get("title"),
                "type": doc.get("type"),
                "mimeType": mime_type,
                "content": content,
                "mediaBase64": media_base64,
                "filePath": file_path
            }
        except Exception as e:
            logger.error(f"Error processing file for resource {resource_id}: {e}")
            return None

    def _extract_pdf(self, file_bytes: bytes) -> str:
        if PdfReader is None: return "Error: PyPDF2 not installed."
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            return "\n".join([page.extract_text() or "" for page in reader.pages]).strip()
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return ""

    def _extract_docx(self, file_bytes: bytes) -> str:
        if Document is None: return "Error: python-docx not installed."
        try:
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join([para.text for para in doc.paragraphs]).strip()
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return ""
