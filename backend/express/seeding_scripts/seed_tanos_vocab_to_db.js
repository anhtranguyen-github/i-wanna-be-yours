// tanos vocabulary db seding
// for now seeds just vocabulary, sentences might be added in future iterations

// db is created if it does not exist
// Script seeds database with words
// seeding is done simply with insertMany calls

// middleware scripts that provide data from actual json files
const words_data = require("./wordsTanos");

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ----------------- DB schema definitions ------------------------

// parent object
const wordSchema = new Schema({
  vocabulary_original: { type: String, unique: false, required: true }, // we have repeating words, they differ by p_tag in api searches
  vocabulary_simplified: String,
  vocabulary_english: { type: String, unique: false, required: false },  // TODO: huh, some are missing, you need to review source data
  vocabulary_audio: String,
  word_type: { type: String, unique: false, required: false },
  p_tag: String, // parent tag 'JLPT_N3'
  s_tag: String, // sub tag '100'
  //sentences: [{ type: Schema.Types.ObjectId, ref: "Sentence" }],
});

// ----------------- end of DB schema definitions -----------------

// ----------------- Function definitions ------------------

const connectToDb = async () => {
  const dbHost = "localhost";
  const dbPort = 27017;
  const dbName = "zenRelationshipsAutomated";

  try {
    await mongoose.connect(
      "mongodb://" + dbHost + ":" + dbPort + "/" + dbName,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Mongo Connection Open.");
  } catch (err) {
    console.log("Mongo Connection ERROR!!!!");
    console.log(err);
  }
};

// ----------------- end of function definitions ------------------

// ----------------- model compilation ------------------------
const Word = mongoose.model("tanosWord", wordSchema);

// block that connects to db
// inserts words, inserts sentences, creates word-sentence relationships
// has to be async block, since we need to await pretty much all actions
(async () => {
  try {
    await connectToDb();

    // Check if the collection exists and drop if so
    try {
      // Using a simple check via the native driver capability exposed by mongoose to avoid casting errors if empty
      // or just attempting to drop.
      // 'tanoswords' is the collection name derived from model 'tanosWord' (mongoose lowercases and pluralizes)
      await mongoose.connection.db.dropCollection('tanoswords');
      console.log("Dropped tanoswords collection.");
    } catch (e) {
      if (e.codeName === 'NamespaceNotFound') {
        console.log("Collection tanoswords does not exist, proceeding to seed.");
      } else {
        console.log("Note on collection drop: " + e.message);
      }
    }

    // improved seeding with error handling
    const insertedData = await Word.insertMany(words_data);
    console.log(`Data insertion successful. Count: ${insertedData.length}`);

    // Log unique p_tags
    const uniqueTags = [...new Set(insertedData.map(item => item.p_tag))];
    console.log("Unique p_tags inserted:", uniqueTags);

  } catch (err) {
    console.log(err);
    // mongoose.connection.close();      // do not close connection to db on error, we have mess in some relationships, we will skip them for now
    console.log("error caught, closed db connection");
  } finally {
    mongoose.connection.close();
    console.log("finally block - closing db conn");
  }
})();
