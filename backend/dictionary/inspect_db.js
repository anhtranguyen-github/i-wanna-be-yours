const mongoose = require('mongoose');

async function checkDatabase() {
    const mongoDB = 'mongodb://localhost:27017/jmdictDatabase';
    try {
        await mongoose.connect(mongoDB);
        console.log("--- JMDictionary Database Status ---");

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`Collection: ${col.name} | Count: ${count}`);

            const sample = col.name === 'kanjis'
                ? await mongoose.connection.db.collection(col.name).findOne({ literal: '家' })
                : await mongoose.connection.db.collection(col.name).findOne({ expression: '家族' });
            console.log(`Sample from ${col.name}:`, JSON.stringify(sample, null, 2));
            console.log("-----------------------------------");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
}

checkDatabase();
