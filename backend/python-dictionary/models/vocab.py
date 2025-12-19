from pydantic import BaseModel, Field
from typing import List, Optional

class VocabEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    expression: str
    reading: str
    type: Optional[str] = None
    meanings: List[str] = []

class VocabResponse(BaseModel):
    expression: str
    reading: str
    meanings: List[str]
    pos_tags: List[str]
    jlpt_level: Optional[str] = None
    audio_url: Optional[str] = None
