import os
import time
import logging
from dotenv import load_dotenv
from jamdict import Jamdict
from pymongo import MongoClient, InsertOne
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "JapaneseDictionary")

# Define the target collection name
JMDict_COLLECTION = "jmdict_entries"

def _jamdict_iter_all_entries(jam):
    """Best-effort iterator over all Jamdict entries across versions.

    This handles multiple possible APIs exposed by different jamdict versions.
    """
    # Preferred: jam.jmdict.iter_entries()
    jmd = getattr(jam, "jmdict", None)
    if jmd is not None:
        if hasattr(jmd, "iter_entries") and callable(getattr(jmd, "iter_entries")):
            for e in jmd.iter_entries():
                yield e
            return
        # Newer/SQLite-backed versions expose search_iter; probe with wildcards
        if hasattr(jmd, "search_iter") and callable(getattr(jmd, "search_iter")):
            probes = ("*", "", "%")
            for probe in probes:
                try:
                    yielded = False
                    for e in jmd.search_iter(probe):
                        yielded = True
                        yield e
                    if yielded:
                        return
                except Exception as ex:
                    logging.debug("search_iter probe '%s' failed: %s", probe, ex)
        # Some versions expose a materialized collection "entries"
        entries = getattr(jmd, "entries", None)
        if entries is not None:
            if isinstance(entries, dict):
                for e in entries.values():
                    yield e
                return
            try:
                for e in entries:
                    yield e
                return
            except TypeError:
                pass
        # Fallbacks sometimes expose "all_entries" method
        if hasattr(jmd, "all_entries") and callable(getattr(jmd, "all_entries")):
            for e in jmd.all_entries():
                yield e
            return
        # Some implementations keep a private _entries list/dict
        private_entries = getattr(jmd, "_entries", None)
        if private_entries is not None:
            try:
                iterable = private_entries.values() if isinstance(private_entries, dict) else private_entries
                for e in iterable:
                    yield e
                return
            except Exception:
                pass

    # Final fallback: some examples mention jam.get_entries / get_all_entries
    for meth in ("get_all_entries", "get_entries"):
        if hasattr(jam, meth) and callable(getattr(jam, meth)):
            for e in getattr(jam, meth)():
                yield e
            return

    # Log diagnostics to help determine the correct API for this version
    logging.error("Jamdict attributes: %s", sorted([a for a in dir(jam) if not a.startswith('__')]))
    if jmd is not None:
        logging.error("Jamdict.jmdict class: %s", jmd.__class__.__name__)
        logging.error("Jamdict.jmdict attributes: %s", sorted([a for a in dir(jmd) if not a.startswith('__')]))
    else:
        logging.error("Jamdict has no 'jmdict' attribute. Installed version may differ.")
    raise AttributeError("Unable to enumerate Jamdict entries: unsupported jamdict API for this version")

def transform_entry_to_doc(entry):
    """Transforms a Jamdict Entry object into a denormalized MongoDB document."""
    
    # Proactive denormalization: embedding all readings and senses into the main word document
    
    kanji_forms = []
    for k in entry.kanji_forms:
        kanji_forms.append({"text": k.text, "info": k.info, "prio": [p.text for p in k.prio]})

    reading_forms = []
    for r in entry.reading_forms:
        reading_forms.append({"text": r.text, "info": r.info, "prio": [p.text for p in r.prio]})

    senses =[]
    for s in entry.senses:
        # Normalize common jamdict structures to plain strings
        gloss_list = []
        for g in getattr(s, "gloss", []) or []:
            gloss_list.append(getattr(g, "text", str(g)))
        pos_list = [getattr(p, "text", str(p)) for p in (getattr(s, "part_of_speech", []) or [])]
        field_list = [getattr(f, "text", str(f)) for f in (getattr(s, "field", []) or [])]
        misc_list = [getattr(m, "text", str(m)) for m in (getattr(s, "misc", []) or [])]
        dialect_list = [getattr(d, "text", str(d)) for d in (getattr(s, "dialect", []) or [])]
        senses.append({
            "gloss": gloss_list,
            "part_of_speech": pos_list,
            "field": field_list,
            "misc": misc_list,
            "dialect": dialect_list
        })

    return {
        "_id": entry.id, # Use entry sequence number as primary key
        "entry_id": entry.id,
        "kanji_elements": kanji_forms,
        "reading_elements": reading_forms,
        "senses": senses,
        "is_common": any("ichi" in p.text or "news" in p.text for k in entry.kanji_forms for p in k.prio) or \
                     any("ichi" in p.text or "news" in p.text for r in entry.reading_forms for p in r.prio)
    }

def seed_mongodb():
    """Initializes Jamdict, extracts data, and performs bulk insert into MongoDB."""
    if not MONGO_URI:
        logging.error("MONGO_URI is not set in the .env file.")
        return

    logging.info("--- Phase 1: Initializing Jamdict (may take time on first run) ---")
    t_start = time.time()
    try:
        # Jamdict automatically handles parsing the XML into its internal structure
        jam = Jamdict(lookup_limit=1)
        # Robust enumeration across jamdict versions
        all_entries = _jamdict_iter_all_entries(jam)
        logging.info("Jamdict initialization complete in %.2f seconds.", (time.time() - t_start))
    except Exception as e:
        logging.critical("CRITICAL ERROR loading Jamdict data: %s", e)
        return

    logging.info("--- Phase 2: Connecting to MongoDB and preparing data ---")
    t_start = time.time()
    # Keep credentials private; log only scheme and options
    uri_scheme = "mongodb+srv" if MONGO_URI.lower().startswith("mongodb+srv://") else "mongodb"
    logging.info("Connecting using URI scheme: %s", uri_scheme)
    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=10000,
        )
        # Force a ping to validate connectivity early
        client.admin.command("ping")
    except (ConfigurationError, ServerSelectionTimeoutError) as e:
        logging.critical(
            "MongoDB connection failed: %s. If using mongodb+srv, ensure DNS works inside WSL and 'dnspython' is installed. Alternatively, switch to a standard 'mongodb://host:port' URI or add '?directConnection=true' when connecting to a single host.",
            e,
        )
        return
    db = client[DATABASE_NAME]
    collection = db[JMDict_COLLECTION]
    
    # Drop existing collection to ensure a clean re-seed
    collection.drop()

    operations =[]
    i = 0
    batch_size = 5000
    last_log_time = time.time()
    last_log_count = 0
    
    # Iterate through all entries and prepare bulk insert operations
    for entry in all_entries:
        doc = transform_entry_to_doc(entry)
        operations.append(InsertOne(doc))
        i += 1
        
        # Perform bulk write in batches to optimize network I/O
        if len(operations) >= batch_size:
            collection.bulk_write(operations, ordered=False)
            operations =[]
            now = time.time()
            interval = now - last_log_time
            inserted_since = i - last_log_count
            rate = (inserted_since / interval) if interval > 0 else 0
            logging.info("Inserted %d documents so far (%.0f docs/s)", i, rate)
            last_log_time = now
            last_log_count = i

    # Insert remaining documents
    if operations:
        collection.bulk_write(operations, ordered=False)

    t_end = time.time()
    logging.info("Successfully inserted %d total documents.", i)
    logging.info("MongoDB bulk insertion complete in %.2f seconds.", (t_end - t_start))
    
    # Indexing for high-speed lookups
    logging.info("--- Phase 3: Creating indexes ---")
    collection.create_index([("reading_elements.text", 1)], name="reading_lookup")
    collection.create_index([("kanji_elements.text", 1)], name="kanji_lookup")
    collection.create_index([("is_common", -1), ("entry_id", 1)], name="common_priority")
    logging.info("Indexes created: reading_lookup, kanji_lookup, common_priority.")

    client.close()
    logging.info("Seeding complete.")

if __name__ == "__main__":
    seed_mongodb()