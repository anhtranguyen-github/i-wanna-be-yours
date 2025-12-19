from pydantic import BaseModel
from typing import Optional

class SentenceEntry(BaseModel):
    id: str
    original: str
    english: str
    simplified: Optional[str] = None
    romaji: Optional[str] = None
    audio: Optional[str] = None
    picture: Optional[str] = None
    key: str
