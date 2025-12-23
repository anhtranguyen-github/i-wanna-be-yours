from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from data.mongodb import db
from services.search_service import search_service
from services.tokenizer import tokenizer_service
from typing import Dict, Any, List
import uvicorn
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.close()

app = FastAPI(title="Hanachan Python Dictionary Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/v1/parse-split")
async def parse_split(payload: Dict[str, str]):
    text = payload.get("text")
    mode = payload.get("mode", "B") # Sudachi mode B is usually best for parsing
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
        
    sentences = tokenizer_service.get_sentences(text)
    results = []
    
    for sent in sentences:
        tokens = tokenizer_service.tokenize(sent, mode=mode)
        results.append([
            {
                "original": t["surface"],
                "dictionary": t["dictionary_form"],
                "furigana": t["reading"], # Sudachi gives reading in Katakana usually
                "pos": t["pos"]
            }
            for t in tokens
        ])
        
    return results

@app.get("/v1/kanji/{character}")
async def get_kanji(character: str):
    # Implementation similar to search_service logic but for single kanji
    res = await search_service.search(character)
    if not res["kanji"]:
        raise HTTPException(status_code=404, detail="Kanji not found")
    return res["kanji"][0]

@app.get("/v1/simple-vocabulary/{expression}")
async def get_vocab(expression: str):
    # Lookup in entries
    cursor = db.db.entries.find({
        "$or": [{"expression": expression}, {"reading": expression}]
    })
    
    results = []
    async for entry in cursor:
        results.append({
            "original": entry.get("expression"),
            "hiragana": entry.get("reading"),
            "englishTranslations": entry.get("meanings", [])
        })
        
    if not results:
        raise HTTPException(status_code=404, detail="Word not found")
    return results[0]

@app.post("/v1/search")
async def unified_search(payload: Dict[str, str]):
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    return await search_service.search(text)

@app.post("/v1/sentences")
async def get_sentences(payload: Dict[str, str]):
    query = payload.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="No query provided")
    return await search_service.get_sentences(query)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5200, reload=True)
