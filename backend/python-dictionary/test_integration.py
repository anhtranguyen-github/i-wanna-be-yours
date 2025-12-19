import asyncio
from main import app
from data.mongodb import db
from services.search_service import search_service

async def test_search():
    await db.connect()
    try:
        print("Testing search for '学校'...")
        res = await search_service.search("学校")
        print(f"Vocab found: {len(res['vocab'])}")
        for v in res['vocab'][:2]:
            print(f" - {v['expression']} ({v['reading']}): {v['meanings'][:2]}")
        print(f"Kanji found: {[k['literal'] for k in res['kanji']]}")

        print("\nTesting search for '家'...")
        res = await search_service.search("家")
        print(f"Vocab found: {len(res['vocab'])}")
        print(f"Kanji found: {[k['literal'] for k in res['kanji']]}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(test_search())
