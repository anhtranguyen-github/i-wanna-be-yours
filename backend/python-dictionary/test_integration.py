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

        print("\nTesting search for '今日は新しいことを学ぶのにぴったりな日です。'...")
        res = await search_service.search("今日は新しいことを学ぶのにぴったりな日です。")
        print(f"Vocab found: {len(res['vocab'])}")
        # Check for duplicates by ID
        vocab_keys = [(v['expression'], v['reading']) for v in res['vocab']]
        if len(vocab_keys) != len(set(vocab_keys)):
            print("ERROR: Duplicates found in vocab (expr+read)!")
            # Print duplicates
            seen = set()
            for k in vocab_keys:
                if k in seen:
                    print(f"   Duplicate: {k}")
                seen.add(k)
        else:
            print("✅ No duplicates in vocab (consist of expression and reading).")
            
        # Check Kanji list
        kanji_found = [k['literal'] for k in res['kanji']]
        print(f"Kanji found: {kanji_found}")
        expected_kanji = [c for c in "今日新学日" if c in "今日は新しいことを学ぶのにぴったりな日です。"]
        # Set: 今, 日, 新, 学
        for k in kanji_found:
            if k not in "今日は新しいことを学ぶのにぴったりな日です。":
                print(f"ERROR: Extra kanji found: {k}")
        print("✅ Kanji filtering check complete.")

        # Check Sentences
        print(f"Sentences found: {len(res['sentences'])}")
        for s in res['sentences'][:3]:
            print(f" - {s['original']} ({s['key']})")

    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(test_search())
