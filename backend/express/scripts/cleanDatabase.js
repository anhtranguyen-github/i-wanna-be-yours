/**
 * Clean Database Script
 * Removes all content data (flashcards, quoot, practice) while preserving users
 */

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { FlashcardSet } = require('../models/FlashcardSet');
const { QuootArena } = require('../models/QuootArena');
const { PracticeNode } = require('../models/PracticeNode');
const { User } = require('../models/User');
const { SessionRecord } = require('../models/SessionRecord');

async function cleanDatabase() {
    try {
        await connectDB();

        console.log('🧹 Cleaning database...');

        // Delete all content
        const flashcardResult = await FlashcardSet.deleteMany({});
        console.log(`  ✓ Deleted ${flashcardResult.deletedCount} flashcard sets`);

        const quootResult = await QuootArena.deleteMany({});
        console.log(`  ✓ Deleted ${quootResult.deletedCount} quoot arenas`);

        const practiceResult = await PracticeNode.deleteMany({});
        console.log(`  ✓ Deleted ${practiceResult.deletedCount} practice nodes`);

        const recordResult = await SessionRecord.deleteMany({});
        console.log(`  ✓ Deleted ${recordResult.deletedCount} session records`);

        // Clear user followedItems
        const userResult = await User.updateMany({}, { $set: { followedItems: [] } });
        console.log(`  ✓ Cleared followedItems from ${userResult.modifiedCount} users`);

        console.log('✅ Database cleaned successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Clean failed:', err);
        process.exit(1);
    }
}

cleanDatabase();
