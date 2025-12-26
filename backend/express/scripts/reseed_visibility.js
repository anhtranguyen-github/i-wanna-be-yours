const mongoose = require('mongoose');
const path = require('path');
// Adjust path to find .env from scripts/
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { PracticeNode } = require('../models/PracticeNode');
const { FlashcardSet } = require('../models/FlashcardSet');
const { QuootArena } = require('../models/QuootArena');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

async function randomizeVisibility(Model, modelName) {
    const items = await Model.find({});
    console.log(`Processing ${items.length} ${modelName}...`);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Strategy:
        // 0.0 - 0.4: Global
        // 0.4 - 0.7: Public
        // 0.7 - 1.0: Private (if userId exists)

        const r = Math.random();
        let newVis = 'global';

        if (r < 0.4) {
            newVis = 'global';
        } else if (r < 0.7) {
            newVis = 'public';
        } else {
            if (item.userId) {
                newVis = 'private';
            } else {
                newVis = 'public';
            }
        }

        // Override: if item is "system" origin (PracticeNode specific), force global
        if (item.origin === 'system') newVis = 'global';

        await Model.updateOne({ _id: item._id }, { visibility: newVis });
    }
    console.log(`Updated ${modelName} visibility.`);
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await randomizeVisibility(PracticeNode, 'PracticeNode');
        await randomizeVisibility(FlashcardSet, 'FlashcardSet');
        await randomizeVisibility(QuootArena, 'QuootArena');

        console.log('Reseeding complete.');
        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
