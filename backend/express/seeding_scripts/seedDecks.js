/**
 * Seed Deck Words (Comprehensive)
 * Creates sample words for Flashcard and Quoot decks across multiple volumes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

const WordSchema = new mongoose.Schema({
    vocabulary_original: { type: String, required: true },
    vocabulary_english: { type: String, required: true },
    vocabulary_simplified: { type: String, default: '' },
    vocabulary_audio: { type: String, default: '' },
    p_tag: { type: String, index: true },
    s_tag: { type: String, index: true },
    sentences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sentence' }]
});

const Word = mongoose.model('Word', WordSchema);

const WORDS_DATA = [
    // Essential Verbs Vol 1
    { vocabulary_original: '食べる', vocabulary_english: 'to eat', vocabulary_simplified: 'たべる', p_tag: 'essential_600_verbs', s_tag: 'verbs-1' },
    { vocabulary_original: '飲む', vocabulary_english: 'to drink', vocabulary_simplified: 'のむ', p_tag: 'essential_600_verbs', s_tag: 'verbs-1' },
    { vocabulary_original: '行く', vocabulary_english: 'to go', vocabulary_simplified: 'いく', p_tag: 'essential_600_verbs', s_tag: 'verbs-1' },

    // Essential Verbs Vol 2
    { vocabulary_original: '話す', vocabulary_english: 'to speak', vocabulary_simplified: 'はなす', p_tag: 'essential_600_verbs', s_tag: 'verbs-2' },
    { vocabulary_original: '書く', vocabulary_english: 'to write', vocabulary_simplified: 'かく', p_tag: 'essential_600_verbs', s_tag: 'verbs-2' },
    { vocabulary_original: '読む', vocabulary_english: 'to read', vocabulary_simplified: 'よむ', p_tag: 'essential_600_verbs', s_tag: 'verbs-2' },

    // Suru Verbs Vol 1
    { vocabulary_original: '勉強する', vocabulary_english: 'to study', vocabulary_simplified: 'べんきょうする', p_tag: 'suru_essential_600_verbs', s_tag: 'verbs-1' },
    { vocabulary_original: '料理する', vocabulary_english: 'to cook', vocabulary_simplified: 'りょうりする', p_tag: 'suru_essential_600_verbs', s_tag: 'verbs-1' },

    // Suru Verbs Vol 2
    { vocabulary_original: '散歩する', vocabulary_english: 'to take a walk', vocabulary_simplified: 'さんぽする', p_tag: 'suru_essential_600_verbs', s_tag: 'verbs-2' },
    { vocabulary_original: '掃除する', vocabulary_english: 'to clean', vocabulary_simplified: 'そうじする', p_tag: 'suru_essential_600_verbs', s_tag: 'verbs-2' }
];

async function seedDecks() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Clearing existing sample words...');
        await Word.deleteMany({ p_tag: { $in: ['essential_600_verbs', 'suru_essential_600_verbs'] } });

        console.log('Inserting sample words...');
        for (const wordData of WORDS_DATA) {
            const word = new Word(wordData);
            await word.save();
            console.log(`  ✓ Seeded: ${word.vocabulary_original} (${word.p_tag}/${word.s_tag})`);
        }

        console.log('\n✅ Successfully seeded deck words!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding decks:', error);
        process.exit(1);
    }
}

seedDecks();
