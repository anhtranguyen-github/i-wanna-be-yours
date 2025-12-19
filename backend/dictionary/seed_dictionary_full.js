const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoDB = 'mongodb://localhost:27017/jmdictDatabase';

const EntrySchema = new mongoose.Schema({
    expression: String,
    reading: String,
    type: String,
    meanings: [String]
}, { collection: 'entries' });

const KanjiSchema = new mongoose.Schema({
    literal: { type: String, index: true },
    codepoint: Object,
    radical: Object,
    misc: Object,
    dic_number: Object,
    query_code: Object,
    reading_meaning: Object
}, { collection: 'kanjis' });

const Entry = mongoose.model('Entry', EntrySchema);
const Kanji = mongoose.model('KanjiEntry', KanjiSchema);

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoDB);
        console.log("Connected.");

        // 1. Seed Kanji (Full Set)
        console.log("Seeding Kanjidic2...");
        const kanjiPath = path.join(__dirname, 'kanjidic', 'kanjidic2.json');
        if (fs.existsSync(kanjiPath)) {
            const kanjiRaw = JSON.parse(fs.readFileSync(kanjiPath, 'utf8'));
            const kanjiList = kanjiRaw.kanjidic2.character;

            await Kanji.deleteMany({});
            console.log(`Deleted old kanji records. Inserting ${kanjiList.length} new records...`);

            // Batch insert for performance
            const batchSize = 1000;
            for (let i = 0; i < kanjiList.length; i += batchSize) {
                await Kanji.insertMany(kanjiList.slice(i, i + batchSize));
                if (i % 5000 === 0) console.log(`Processed ${i} kanji...`);
            }
            console.log("Kanji seeded successfully.");
        } else {
            console.warn("Kanjidic2.json not found, skipping.");
        }

        // 2. Seed JMDict (Words)
        console.log("Seeding JMDict Words...");
        const simplifiedDir = path.join(__dirname, 'jmdict_json_data_simplified');
        if (fs.existsSync(simplifiedDir)) {
            const files = fs.readdirSync(simplifiedDir).filter(f => f.endsWith('.json'));

            if (files.length > 0) {
                await Entry.deleteMany({});
                console.log("Deleted old JMDict entries.");

                for (const file of files) {
                    console.log(`Processing ${file}...`);
                    const entries = JSON.parse(fs.readFileSync(path.join(simplifiedDir, file), 'utf8'));
                    await Entry.insertMany(entries);
                }
                console.log("JMDict seeded successfully.");
            } else {
                console.warn("No simplified JSON files found. Run 'node streamline_jmdict_json.js' first.");
            }
        }

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        mongoose.connection.close();
    }
}

seed();
