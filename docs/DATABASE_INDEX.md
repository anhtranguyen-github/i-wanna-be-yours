# Database Documentation Index

Welcome to the Hanabira.org database documentation. This index will help you find the information you need.

## 📚 Documentation Files

### 1. [DATABASE_SUMMARY.md](../DATABASE_SUMMARY.md) - **Start Here**
**The complete reference guide for all databases**

Contains:
- Complete database catalog (11 databases)
- Detailed schema documentation for all collections
- API endpoints reference
- Data flow architecture
- Deployment information
- Security and performance considerations

**Best for:** Developers, database administrators, comprehensive reference

---

### 2. [DATABASE_QUICK_REFERENCE.md](../DATABASE_QUICK_REFERENCE.md)
**Quick lookup guide for common tasks**

Contains:
- Database matrix (one-page overview)
- Common query examples
- Quick troubleshooting guide
- Connection strings
- Port reference

**Best for:** Quick lookups, daily development work, troubleshooting

---

### 3. [DATABASE_SCHEMA_REFERENCE.md](../DATABASE_SCHEMA_REFERENCE.md)
**Visual schema and relationship diagrams**

Contains:
- Visual database structure diagrams
- Entity relationships
- Collection schemas
- Data flow diagrams

**Best for:** Understanding data relationships, architecture planning

---

## 🎯 Quick Navigation

### By Role

#### For Developers
1. Start with [DATABASE_QUICK_REFERENCE.md](../DATABASE_QUICK_REFERENCE.md) for connection strings
2. Use [DATABASE_SUMMARY.md](../DATABASE_SUMMARY.md) for API endpoints
3. Reference [DATABASE_SCHEMA_REFERENCE.md](../DATABASE_SCHEMA_REFERENCE.md) for schema details

#### For Database Administrators
1. Read [DATABASE_SUMMARY.md](../DATABASE_SUMMARY.md) sections:
   - Database Architecture
   - Storage Optimization Strategy
   - Performance Considerations
   - Security Considerations
2. Use [DATABASE_QUICK_REFERENCE.md](../DATABASE_QUICK_REFERENCE.md) for maintenance tasks

#### For New Team Members
1. Start with [DATABASE_SCHEMA_REFERENCE.md](../DATABASE_SCHEMA_REFERENCE.md) for visual overview
2. Read [DATABASE_SUMMARY.md](../DATABASE_SUMMARY.md) - Overview section
3. Keep [DATABASE_QUICK_REFERENCE.md](../DATABASE_QUICK_REFERENCE.md) handy

---

## 🔍 Find Information By Topic

### Architecture & Design
- Database Architecture → [DATABASE_SUMMARY.md § Database Architecture](../DATABASE_SUMMARY.md#database-architecture)
- Data Flow → [DATABASE_SUMMARY.md § Data Flow Architecture](../DATABASE_SUMMARY.md#data-flow-architecture)
- Visual Diagrams → [DATABASE_SCHEMA_REFERENCE.md](../DATABASE_SCHEMA_REFERENCE.md)

### Database Details
- Complete Catalog → [DATABASE_SUMMARY.md § Database Catalog](../DATABASE_SUMMARY.md#database-catalog)
- Quick Matrix → [DATABASE_QUICK_REFERENCE.md § Database Matrix](../DATABASE_QUICK_REFERENCE.md#database-matrix)
- Schemas → [DATABASE_SCHEMA_REFERENCE.md § Collection Schemas](../DATABASE_SCHEMA_REFERENCE.md)

### Development
- API Endpoints → [DATABASE_SUMMARY.md § API Endpoints Summary](../DATABASE_SUMMARY.md#api-endpoints-summary)
- Connection Info → [DATABASE_QUICK_REFERENCE.md § Connection Strings](../DATABASE_QUICK_REFERENCE.md)
- Query Examples → [DATABASE_QUICK_REFERENCE.md § Common Queries](../DATABASE_QUICK_REFERENCE.md)

### Operations
- Deployment → [DATABASE_SUMMARY.md § Deployment](../DATABASE_SUMMARY.md#deployment)
- Maintenance → [DATABASE_SUMMARY.md § Database Maintenance](../DATABASE_SUMMARY.md#database-maintenance)
- Troubleshooting → [DATABASE_QUICK_REFERENCE.md § Troubleshooting](../DATABASE_QUICK_REFERENCE.md)

### Security & Performance
- Security → [DATABASE_SUMMARY.md § Security Considerations](../DATABASE_SUMMARY.md#security-considerations)
- Performance → [DATABASE_SUMMARY.md § Performance Considerations](../DATABASE_SUMMARY.md#performance-considerations)
- Indexing → [DATABASE_QUICK_REFERENCE.md § Recommended Indexes](../DATABASE_QUICK_REFERENCE.md)

---

## 📊 Database Overview

### Database Count: 11

#### Production Databases (8)
1. **zenRelationshipsAutomated** - Static content (Express)
2. **flaskFlashcardDB** - User flashcard progress (Flask)
3. **mecabWords** - Vocabulary mining (Flask)
4. **sentenceMining** - Sentence mining (Flask)
5. **library** - Custom texts/videos (Flask)
6. **login_db** - Login tracking (Flask)
7. **email_db** - Email waitlist (Flask)
8. **jmdictDatabase** - Dictionary data (Dictionary)

#### Legacy/Reference (3)
9. **jitendexDatabase** - Alternative dictionary
10. **flashcardDB** - Legacy flashcards
11. **sourceDB** - Legacy source data

### Technology Stack
- **Database:** MongoDB (WiredTiger)
- **Host:** localhost:27017
- **Backends:** Express (8000), Flask (5100), Dictionary (5200)
- **Frontend:** Next.js (3000)
- **Proxy:** Nginx (8888)

---

## 🚀 Common Tasks

### Setup & Installation
```bash
# Clone repository
git clone https://github.com/tristcoil/hanabira.org.git
cd hanabira.org

# Start all services
docker-compose up

# Access application
http://localhost:8888/
```

### Database Access
```bash
# Access MongoDB shell
docker exec -it <container-name> mongosh

# List all databases
show dbs

# Use specific database
use zenRelationshipsAutomated

# List collections
show collections
```

### Backup
```bash
# Backup all databases
mongodump --out /backup/$(date +%Y%m%d)

# Backup specific database
mongodump --db flaskFlashcardDB --out /backup/user_data
```

---

## 📖 Additional Resources

### External Documentation
- [MongoDB Official Docs](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [Flask-PyMongo Documentation](https://flask-pymongo.readthedocs.io/)

### Project Resources
- **Main Repository:** [github.com/tristcoil/hanabira.org](https://github.com/tristcoil/hanabira.org)
- **Content Repository:** [hanabira.org-japanese-content](https://github.com/tristcoil/hanabira.org-japanese-content)
- **Website:** [hanabira.org](https://hanabira.org)
- **Discord:** [Hanabira Discord](https://discord.com/invite/afefVyfAkH)

### Data Sources
- **JMdict:** [edrdg.org/jmdict](http://www.edrdg.org/jmdict/edict.html)
- **KANJIDIC:** [edrdg.org/kanjidic](http://www.edrdg.org/kanjidic/kanjidic.html)
- **Tanos JLPT Lists:** [tanos.co.uk/jlpt](http://www.tanos.co.uk/jlpt/)

---

## 🤝 Contributing

### Documentation Updates
If you find errors or have suggestions for improving this documentation:

1. Create an issue on GitHub
2. Submit a pull request with updates
3. Join our Discord for discussions

### Database Schema Changes
If you need to modify database schemas:

1. Update the relevant documentation file
2. Update migration scripts if needed
3. Test with sample data
4. Document breaking changes
5. Update API version if necessary

---

## 📝 Documentation Changelog

### Version 1.0 (October 23, 2025)
- Initial comprehensive database documentation
- Created DATABASE_SUMMARY.md
- Created DATABASE_QUICK_REFERENCE.md
- Created DATABASE_SCHEMA_REFERENCE.md
- Created DATABASE_INDEX.md

---

## 💡 Tips for Using This Documentation

1. **Bookmark this page** for quick access to all documentation
2. **Use Ctrl+F** (Cmd+F on Mac) to search within documents
3. **Start with the Quick Reference** for common tasks
4. **Deep dive into Summary** when you need comprehensive information
5. **Use Schema Reference** for visual understanding
6. **Keep documentation updated** as the project evolves

---

## ⚠️ Important Notes

- **Project Status:** Early Alpha - expect bugs and breaking changes
- **Database Location:** All data in `./user_db` directory
- **No Authentication:** MongoDB runs without auth (localhost only)
- **Data Persistence:** Delete `user_db` to reset all user data
- **Breaking Changes:** May occur during alpha development

---

## 🔐 License

- **Code:** MIT License
- **Content:** Creative Commons License
- **External Data:** Various licenses (see DATABASE_SUMMARY.md)

---

**Last Updated:** October 23, 2025  
**Project:** Hanabira.org  
**Version:** Alpha  

For questions or support, visit [hanabira.org](https://hanabira.org) or join our [Discord](https://discord.com/invite/afefVyfAkH).

