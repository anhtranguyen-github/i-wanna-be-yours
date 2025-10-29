from typing import List, Literal
from fastmcp import FastMCP, tool
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Depends
import asyncio

# --- 1. Define Structured Output Schemas (Pydantic Models) ---
# Pydantic models ensure the LLM receives clean, structured JSON output
# instead of raw text, improving reliability.[6, 7]

class JapaneseSense(BaseModel):
    """A single sense (definition block) for a word."""
    glosses: List[str] = Field(description="English definitions/glosses for this sense.")
    part_of_speech: List[str] = Field(description="Grammatical classification (e.g., noun, Ichidan verb).")

class JapaneseEntry(BaseModel):
    """A complete Japanese dictionary entry."""
    entry_id: int
    kanji: List[str] = Field(description="List of possible Kanji forms for the word.")
    reading: List[str] = Field(description="List of all readings (Kana/Yomi) for the word.")
    senses: List = Field(description="Detailed list of definitions and linguistic metadata.")
    is_common: bool = Field(description="True if this is a common word (useful for sorting results).")

# --- 2. Initialize FastMCP Server ---
# The name is used for identification by AI clients.[8]
mcp = FastMCP(name="JapaneseLexicalContextServer", version="1.0")

# --- 3. Dependency Injection for Database Access ---

# The database dependency is managed by FastAPI's lifespan events in main.py
def get_db(request) -> AsyncIOMotorDatabase:
    """Returns the MongoDB database instance."""
    # The client is attached to the app state during startup
    return request.app.state.mongodb_client

# --- 4. Define the Core MCP Tool ---

@tool()
async def lookup_vocabulary(
    query: str, 
    # Use Literal to constrain the search type parameter, aiding the LLM 
    search_by: Literal["kanji", "reading", "meaning"] = "reading",
    limit: int = 10,
    db: AsyncIOMotorDatabase = Depends(get_db) # Motor database dependency
) -> List[JapaneseEntry]:
    """
    Searches the comprehensive Japanese dictionary (JMdict) for words based on 
    Kanji form, Kana reading, or English meaning. Results are sorted by 
    commonness and relevance.
    """
    
    collection = db["jmdict_entries"]
    
    # 4.1 Construct the MongoDB Query based on search_by parameter
    if search_by == "kanji":
        # Use B-tree index on kanji_elements.text
        match_query = {"kanji_elements.text": query}
    elif search_by == "reading":
        # Use B-tree index on reading_elements.text
        match_query = {"reading_elements.text": query}
    elif search_by == "meaning":
        # NOTE: Full-Text Search ($text or $search) requires a dedicated index
        # For a basic setup, we perform a less efficient regex or assume Atlas Search index exists
        # In a production environment, use $search with the Kuromoji analyzer [9]
        match_query = {"senses.gloss": {"$regex": query, "$options": "i"}}
    else:
        # Default fallback
        match_query = {}

    # 4.2 Execute the Asynchronous Query using Motor [5]
    # We sort by 'is_common' descending and 'entry_id' ascending to prioritize common words
    cursor = collection.find(match_query).sort([("is_common", -1), ("entry_id", 1)]).limit(limit)

    # 4.3 Aggregate results into the defined Pydantic model
    structured_entries =[]
    
    # Motor's to_list() is the non-blocking way to fetch all results
    docs = await cursor.to_list(length=limit)
    
    for doc in docs:
        
        # Map raw MongoDB document back to Pydantic structure
        kanji_list = [k['text'] for k in doc.get('kanji_elements',)]
        reading_list = [r['text'] for r in doc.get('reading_elements',)]
        
        sense_models =[]  
        for s in doc.get('senses',):
            sense_models.append(JapaneseSense(
                glosses=s.get('gloss',),
                part_of_speech=s.get('part_of_speech',)
            ))
            
        structured_entries.append(JapaneseEntry(
            entry_id=doc['entry_id'],
            kanji=kanji_list,
            reading=reading_list,
            senses=sense_models,
            is_common=doc['is_common']
        ))
    
    return structured_entries