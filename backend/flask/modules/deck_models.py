from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

# --- Card Model ---
class DeckCard(BaseModel):
    """
    Represents a single card within a deck.
    This is a simplified, unified structure for both Kanji and Vocab.
    """
    id: str = Field(default_factory=lambda: "new_card", alias='_id')
    front: str 
    back: str
    sub_detail: Optional[str] = None # e.g. Reading for Kanji, Romaji for Vocab
    
    # Type identifier (e.g. 'kanji', 'vocabulary', 'sentence')
    type: str = "vocabulary"
    
    # Store rich data like audio url, example sentences, etc.
    # This prevents the need for strict schema updates for every little visual tweak.
    extra_data: Dict[str, Any] = {} 

class Deck(BaseModel):
    """
    Represents a Collection of Cards.
    """
    id: str = Field(alias='_id') # e.g. 'vocab-essential-verbs-1'
    title: str
    description: Optional[str] = ""
    tags: List[str] = []
    
    # The actual content.
    # We store the full card objects here for the "Simplified" approach.
    cards: List[DeckCard] = []

    # Metadata for UI
    level: Optional[str] = "Beginner" 
    icon: Optional[str] = "book" # Icon name to render on client
    
    class Config:
        populate_by_name = True
