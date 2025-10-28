# Database Documentation - README

## 📋 Documentation Complete!

Comprehensive database documentation has been created for the Hanabira.org project. This document provides an overview of all available documentation.

---

## 📁 Documentation Files Created

### 1. DATABASE_SUMMARY.md (22 KB) ⭐
**Location:** `/DATABASE_SUMMARY.md` (project root)

**The Complete Reference Guide**

This is the main, comprehensive documentation file containing:
- Full database catalog (11 databases)
- Detailed schema documentation
- Complete API endpoint reference
- Data flow architecture
- Deployment guide
- Security & performance considerations
- Troubleshooting guide

**When to use:** 
- First-time setup
- Comprehensive understanding needed
- API endpoint lookup
- Architecture decisions
- Production deployment

---

### 2. DATABASE_QUICK_REFERENCE.md (9.8 KB)
**Location:** `/DATABASE_QUICK_REFERENCE.md` (project root)

**Fast Lookup Guide**

Quick reference for daily development:
- Database matrix (one-page overview)
- Connection strings
- Common MongoDB queries
- Quick troubleshooting
- Port reference

**When to use:**
- Daily development
- Quick database queries
- Connection troubleshooting
- Fast lookups

---

### 3. DATABASE_SCHEMA_REFERENCE.md (31 KB)
**Location:** `/DATABASE_SCHEMA_REFERENCE.md` (project root)

**Visual Schemas & Relationships**

Detailed schema documentation with diagrams:
- Visual database structure
- Entity relationships
- Collection schemas (with examples)
- Data flow diagrams
- Index recommendations

**When to use:**
- Understanding data models
- Planning schema changes
- Visualizing relationships
- Database optimization

---

### 4. DATABASE_INDEX.md (8 KB)
**Location:** `/docs/DATABASE_INDEX.md`

**Navigation Hub**

Central index to all documentation:
- Links to all documentation
- Quick navigation by role/topic
- Getting started guides
- Common tasks

**When to use:**
- First entry point
- Finding specific information
- Team onboarding

---

## 🎯 Quick Start

### For New Developers
```
1. Read: docs/DATABASE_INDEX.md
2. Browse: DATABASE_SCHEMA_REFERENCE.md (visual overview)
3. Refer: DATABASE_QUICK_REFERENCE.md (for daily work)
4. Deep dive: DATABASE_SUMMARY.md (when needed)
```

### For Database Administrators
```
1. Read: DATABASE_SUMMARY.md (complete)
2. Bookmark: DATABASE_QUICK_REFERENCE.md
3. Reference: DATABASE_SCHEMA_REFERENCE.md
```

### For Project Managers
```
1. Skim: DATABASE_SUMMARY.md § Overview
2. Review: DATABASE_SCHEMA_REFERENCE.md (diagrams)
```

---

## 📊 Database Overview

### Total Databases: 11

#### Production (8)
1. **zenRelationshipsAutomated** - Static educational content (Express)
2. **flaskFlashcardDB** - User SRS progress (Flask)
3. **mecabWords** - Vocabulary knowledge tracking (Flask)
4. **sentenceMining** - Custom vocabulary mining (Flask)
5. **library** - User texts/videos library (Flask)
6. **login_db** - Login streak tracking (Flask)
7. **email_db** - Email waitlist (Flask)
8. **jmdictDatabase** - Japanese dictionary (Dictionary)

#### Legacy/Reference (3)
9. **jitendexDatabase** - Alternative dictionary
10. **flashcardDB** - Legacy flashcard data
11. **sourceDB** - Legacy source data

### Total Collections: ~30

### Technology Stack
- **Database:** MongoDB (WiredTiger)
- **ODM/Drivers:** Mongoose, PyMongo, Flask-PyMongo
- **Backends:** Express.js (8000), Flask (5100), Dictionary (5200)
- **Frontend:** Next.js (3000)
- **Proxy:** Nginx (8888)

---

## 🗂️ Database Organization

```
Hanabira.org/
│
├── DATABASE_SUMMARY.md                    # 📘 Main reference (22 KB)
├── DATABASE_QUICK_REFERENCE.md            # ⚡ Quick lookup (9.8 KB)
├── DATABASE_SCHEMA_REFERENCE.md           # 📐 Schemas & diagrams (31 KB)
│
├── docs/
│   ├── DATABASE_INDEX.md                  # 🧭 Navigation hub (8 KB)
│   └── README_DATABASE_DOCS.md            # 📄 This file
│
├── backend/
│   ├── express/                           # Express backend (8000)
│   │   ├── config/db.js                   # → zenRelationshipsAutomated
│   │   └── models/                        # Mongoose models
│   │
│   ├── flask/                             # Flask backend (5100)
│   │   ├── server.py                      # → flaskFlashcardDB
│   │   └── modules/                       # PyMongo modules
│   │       ├── flashcards.py              # → flaskFlashcardDB
│   │       ├── vocabulary_mining.py       # → mecabWords
│   │       ├── sentence_mining.py         # → sentenceMining
│   │       ├── library.py                 # → library
│   │       ├── login_streak.py            # → login_db
│   │       └── email_waitlist.py          # → email_db
│   │
│   └── dictionary/                        # Dictionary backend (5200)
│       ├── server.js                      # → jmdictDatabase, legacy DBs
│       └── seed_jmdict_data.js            # Seeding scripts
│
└── user_db/                               # MongoDB data directory
```

---

## 🔧 Common Operations

### View Documentation
```bash
# In your preferred markdown viewer
# Or open in VS Code, GitHub, etc.
cat DATABASE_SUMMARY.md
cat DATABASE_QUICK_REFERENCE.md
cat DATABASE_SCHEMA_REFERENCE.md
```

### Access Database
```bash
# Via Docker
docker exec -it hanabira-flask-dynamic-db-1 mongosh

# List databases
show dbs

# Use database
use zenRelationshipsAutomated

# List collections
show collections

# Query examples (see DATABASE_QUICK_REFERENCE.md)
db.words.find({ p_tag: "JLPT_N5" }).limit(5)
```

### Backup Databases
```bash
# Backup all databases
mongodump --out /backup/$(date +%Y%m%d)

# Backup user-specific databases (recommended)
mongodump --db flaskFlashcardDB --out /backup/user_data
mongodump --db mecabWords --out /backup/user_data
mongodump --db sentenceMining --out /backup/user_data
mongodump --db library --out /backup/user_data
mongodump --db login_db --out /backup/user_data
```

---

## 📈 Statistics

### Documentation Coverage

| Aspect | Coverage |
|--------|----------|
| Databases | 11/11 (100%) |
| Collections | ~30/30 (100%) |
| Schemas | Complete |
| API Endpoints | 40+ documented |
| Code Examples | Yes |
| Diagrams | Yes |
| Troubleshooting | Yes |

### File Sizes
- Total documentation: ~71 KB
- 4 comprehensive files
- 100+ examples
- Multiple diagrams

---

## 🎓 Learning Path

### Week 1: Understanding Structure
- [ ] Read DATABASE_INDEX.md
- [ ] Browse DATABASE_SCHEMA_REFERENCE.md diagrams
- [ ] Understand database architecture
- [ ] Explore one backend service

### Week 2: Development Setup
- [ ] Set up local environment
- [ ] Connect to databases
- [ ] Run sample queries (from QUICK_REFERENCE)
- [ ] Test API endpoints

### Week 3: Deep Dive
- [ ] Study complete schemas
- [ ] Understand data relationships
- [ ] Review data flow patterns
- [ ] Plan first contribution

---

## 🔍 Finding Information Fast

### "How do I...?"

| Task | Document | Section |
|------|----------|---------|
| Connect to MongoDB | QUICK_REFERENCE | Connection Strings |
| Find API endpoints | SUMMARY | API Endpoints Summary |
| Understand schemas | SCHEMA_REFERENCE | Collection Schemas |
| Query data | QUICK_REFERENCE | Common Queries |
| Troubleshoot | QUICK_REFERENCE | Troubleshooting |
| Deploy | SUMMARY | Deployment |
| Optimize | SUMMARY | Performance |
| Secure | SUMMARY | Security |

---

## ✅ What's Documented

### ✅ Complete Coverage

- [x] All 11 databases catalogued
- [x] All ~30 collections documented
- [x] Complete schema definitions
- [x] API endpoint reference (40+)
- [x] Entity relationships explained
- [x] Data flow diagrams
- [x] Connection information
- [x] Query examples
- [x] Troubleshooting guide
- [x] Security considerations
- [x] Performance tips
- [x] Deployment guide
- [x] Maintenance procedures

### 🎯 Extras Included

- [x] Visual diagrams
- [x] Example documents
- [x] Code snippets
- [x] Best practices
- [x] Common pitfalls
- [x] Future enhancements
- [x] Version tracking
- [x] Index recommendations

---

## 🤝 Contributing

### Updating Documentation

When making schema changes:

1. **Update schema definitions**
   - Edit DATABASE_SCHEMA_REFERENCE.md
   - Update example documents

2. **Update API docs**
   - Edit DATABASE_SUMMARY.md
   - Add new endpoints

3. **Update quick reference**
   - Edit DATABASE_QUICK_REFERENCE.md
   - Add common queries

4. **Document breaking changes**
   - Note in all relevant docs
   - Update version numbers

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep index updated
- Test all code examples
- Update dates and versions

---

## 📞 Support

### Internal Resources
- Database docs (this collection)
- Main README.md
- Code comments
- Dev team Discord

### External Resources
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [PyMongo Docs](https://pymongo.readthedocs.io/)

### Getting Help
1. Check relevant documentation file
2. Search codebase
3. Ask in team Discord
4. Create GitHub issue
5. Contact project maintainers

---

## 🎉 Summary

You now have comprehensive database documentation including:

- **Complete reference** (DATABASE_SUMMARY.md)
- **Quick lookup guide** (DATABASE_QUICK_REFERENCE.md)
- **Visual schemas** (DATABASE_SCHEMA_REFERENCE.md)
- **Navigation hub** (DATABASE_INDEX.md)

**Total coverage:** 11 databases, ~30 collections, 40+ API endpoints

**Start here:** [DATABASE_INDEX.md](DATABASE_INDEX.md)

---

## 📝 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 23, 2025 | Initial documentation suite created |

---

## 📄 License

This documentation follows the same license as the Hanabira.org project:
- **Code:** MIT License
- **Content:** Creative Commons License

---

**Documentation Created:** October 23, 2025  
**Last Updated:** October 23, 2025  
**Status:** Complete ✅  
**Coverage:** 100% 🎯

**Happy coding! 🚀**

