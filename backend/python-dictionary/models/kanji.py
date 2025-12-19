from pydantic import BaseModel
from typing import List, Optional, Any

class KanjiReading(BaseModel):
    type: str
    value: str

class KanjiMeaning(BaseModel):
    value: str
    lang: Optional[str] = None

class KanjiEntry(BaseModel):
    literal: str
    readings: List[KanjiReading] = []
    meanings: List[KanjiMeaning] = []
    stroke_count: Optional[List[str]] = None
    grade: Optional[str] = None
    jlpt_level: Optional[str] = None
    frequency: Optional[str] = None
    radicals: List[dict] = []
    unicode: Optional[str] = None

class KanjiResponse(BaseModel):
    literal: str
    stroke_count: Optional[int] = None
    onyomi: List[str] = []
    kunyomi: List[str] = []
    meanings: List[str] = []
    radical_info: Optional[str] = None
    jlpt: Optional[str] = None
