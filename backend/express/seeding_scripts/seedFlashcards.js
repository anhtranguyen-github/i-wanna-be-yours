const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

const FlashcardSchema = new mongoose.Schema({
    front: String,
    back: String,
    reading: String,
    mnemonic: String
});

const FlashcardDeck = mongoose.model('FlashcardDeck', new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '🎴' },
    level: { type: String, default: 'N3' },
    tags: [String],
    isPublic: { type: Boolean, default: true },
    cards: [FlashcardSchema]
}));

const FLASHCARD_DATA = [
    {
        title: "JLPT N5 Core Kanji",
        description: "The absolute basics for your Japanese journey.",
        icon: "🧧",
        level: "N5",
        tags: ["kanji", "beginner"],
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

        await FlashcardDeck.deleteMany({});
        console.log('Cleared existing Flashcard decks');

        await FlashcardDeck.insertMany(FLASHCARD_DATA);
        console.log(`Successfully seeded ${FLASHCARD_DATA.length} Flashcard decks`);

        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seed();
