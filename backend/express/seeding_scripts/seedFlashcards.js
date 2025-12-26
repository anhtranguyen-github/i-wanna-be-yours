const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

const FlashcardSchema = new mongoose.Schema({
    front: String,
    back: String,
    reading: String,
    mnemonic: String
});

const FlashcardSet = mongoose.model('FlashcardSet', new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '🎴' },
    level: { type: String, default: 'N3' },
    tags: [String],
    visibility: { type: String, default: 'global' },
    creatorName: { type: String, default: 'Hanabira' },
    cards: [FlashcardSchema]
}));

const SET_DATA = [
    {
        title: "JLPT N5 Core Kanji",
        description: "The absolute basics for your Japanese journey.",
        icon: "🧧",
        level: "N5",
        tags: ["kanji", "beginner"],
        visibility: "global",
        creatorName: "Hanabira Official",
        cards: [
            { front: "日", back: "Day / Sun", reading: "ひ / にち", mnemonic: "Looks like a window where the sun shines in." },
            { front: "月", back: "Month / Moon", reading: "つき / げつ", mnemonic: "Looks like a crescent moon with two rays." },
            { front: "火", back: "Fire", reading: "ひ / か", mnemonic: "A person flailing their arms in a fire." }
        ]
    },
    {
        title: "Essential Adjectives",
        description: "Expand your descriptive powers.",
        icon: "✨",
        level: "N4",
        tags: ["vocabulary", "adjectives"],
        visibility: "global",
        creatorName: "Hanabira Official",
        cards: [
            { front: "高い", back: "Expensive / High", reading: "たかい" },
            { front: "安い", back: "Cheap", reading: "やすい" },
            { front: "面白い", back: "Interesting", reading: "おもしろい" }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await FlashcardSet.deleteMany({ visibility: 'global' });
        console.log('Cleared existing global Flashcard sets');

        await FlashcardSet.insertMany(SET_DATA);
        console.log(`Successfully seeded ${SET_DATA.length} Flashcard sets`);

        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seed();
