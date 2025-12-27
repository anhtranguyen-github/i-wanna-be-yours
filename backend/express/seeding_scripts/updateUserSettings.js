const mongoose = require('mongoose');
const path = require('path');
const { User } = require('../models/User');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zenRelationshipsAutomated';

async function updateExistingUsers() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users. Updating...`);

        for (const user of users) {
            let updated = false;

            if (!user.settings) {
                user.settings = {
                    theme: 'system',
                    language: 'en',
                    soundEnabled: true,
                    notificationsEnabled: true,
                    dailyGoalMinutes: 30
                };
                updated = true;
            }

            if (!user.display_name) {
                user.display_name = user.email.split('@')[0];
                updated = true;
            }

            if (updated) {
                await user.save();
                console.log(`Updated user: ${user.email}`);
            }
        }

        console.log('Update complete');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateExistingUsers();
