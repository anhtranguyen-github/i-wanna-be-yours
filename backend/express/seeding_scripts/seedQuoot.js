const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' }); // Adjust path as needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

const QuootCardSchema = new mongoose.Schema({
    front: String,
    back: String,
    reading: String,
    type: { type: String, default: 'vocabulary' }
});

const QuootDeck = mongoose.model('QuootDeck', new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    icon: { type: String, default: '⚔️' },
    level: { type: String, default: 'N3' },
    isPublic: { type: Boolean, default: true },
    cards: [QuootCardSchema]
}));

const QUOOT_DATA = [
    {
        title: "Anime Battle: Cyberpunk",
        description: "vocabulary from high-stakes tech and sci-fi anime.",
        icon: "🦾",
        level: "N2",
        cards: [
            { front: "電脳", back: "Cyberbrain", reading: "でんのう" },
            { front: "強化", back: "Enhancement", reading: "きょうか" },
            { front: "潜入", back: "Infiltration", reading: "せんにゅう" },
            { front: "座標", back: "Coordinates", reading: "ざひょう" }
        ]
    },
    {
        title: "Suru Verb Showdown",
        description: "Master the most common suru verbs in a fast-paced battle.",
        icon: "🏃",
        level: "N4",
        cards: [
            { front: "勉強する", back: "to study", reading: "べんきょうする" },
            { front: "散歩する", back: "to take a walk", reading: "さんぽする" },
            { front: "練習する", back: "to practice", reading: "れんしゅうする" },
            { front: "準備する", back: "to prepare", reading: "じゅんびする" }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing
        await QuootDeck.deleteMany({});
        console.log('Cleared existing Quoot decks');

        await QuootDeck.insertMany(QUOOT_DATA);
        console.log(`Successfully seeded ${QUOOT_DATA.length} Quoot decks`);

        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seed();
