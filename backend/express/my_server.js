const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyJWT } = require('./middleware/auth');

const { connectDB } = require("./config/db");
const { wordRoutes } = require("./routes/wordRoutes");

//const { getAllWords } = require('./controllers/wordsController');

// import models, so we can form relationships in db searches
const { Word } = require("./models/word");
const { TanosWord } = require("./models/wordTanos");
const { Sentence } = require("./models/sentence");
const { Kanji } = require("./models/kanji");
const { Reading } = require("./models/reading");

const { Grammar } = require("./models/grammar"); // japanese

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- Map p_tag values to respective models (Japanese only) ---
const modelMapping = {
  JLPT_: Grammar,
};

// --- Sanitization Middleware ---
const sanitizeString = (val) => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0]; // Take first if array
  return undefined; // Ignore objects/others
};

const sanitizeInput = (req, res, next) => {
  if (req.query) {
    for (let key in req.query) {
      req.query[key] = sanitizeString(req.query[key]);
    }
  }
  next();
};

// -----------  General prep and vars  ------------------ //
const router = express.Router();
const port = process.env.PORT || 8000; // port our backend is running on
const originPort = 3000; // port the frontend app is running on
const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(sanitizeInput);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/e-api/", limiter);

const corsOptions = require("./config/cors");
app.use(cors(corsOptions));

// connect to DB before we expose our API Express endpoints
connectDB();

// --- Auth Routes ---
const authRoutes = require("./routes/authRoutes");
app.use("/e-api/v1/auth", authRoutes);

// --- JLPT Routes (Deprecated - use practiceRoutes) ---
// const jlptRoutes = require("./routes/jlptRoutes");
// app.use("/e-api/v1/jlpt", jlptRoutes);

// --- Practice Routes (Unified) ---
const practiceRoutes = require("./routes/practiceRoutes");
app.use("/e-api/v1/practice", practiceRoutes);

// --- Quoot Routes (Dedicated) ---
const quootRoutes = require("./routes/quootRoutes");
app.use("/e-api/v1/quoot", quootRoutes);

// --- Flashcard Routes (Dedicated) ---
const flashcardRoutes = require("./routes/flashcardRoutes");
app.use("/e-api/v1/flashcards", flashcardRoutes);

// --- User Routes ---
const userRoutes = require("./routes/userRoutes");
app.use("/e-api/v1/users", userRoutes);

// --- Record Routes ---
const recordRoutes = require("./routes/recordRoutes");
app.use("/e-api/v1/records", recordRoutes);

// --- Flask Proxy ---
// Route all /e-api/v1/f/ requests to the Flask service on port 5100
app.use("/e-api/v1/f", verifyJWT, createProxyMiddleware({
  target: 'http://localhost:5100',
  changeOrigin: true,
  pathRewrite: {
    '^/e-api/v1/f': '', // remove /e-api/v1/f from the path
  },
  onProxyReq: (proxyReq, req, res) => {
    // We can inject additional headers if needed
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.id || req.user.userId);
    }
  }
}));

// ---------------- Function Definitions ------------------ //
const getAllWords = async (req, res) => {
  try {
    // parameters from request
    const pTag = req.query.p_tag;
    const sTag = req.query.s_tag;
    console.log("p_tag: " + pTag);
    console.log("s_tag: " + sTag);

    let words;

    if (pTag && sTag) {
      // Find subset of words based on both p_tag and s_tag
      words = await Word.find({ p_tag: pTag, s_tag: sTag }).populate("sentences");
    } else if (pTag && !sTag) {
      // Find subset of words based on only p_tag when s_tag is not provided
      words = await Word.find({ p_tag: pTag }).populate("sentences");
    } else {
      // Find all words when no parameters provided
      words = await Word.find({}).populate("sentences");
    }

    // if (pTag && sTag) {
    //   // find subset of words based on parameters
    //   words = await Word.find({ p_tag: pTag, s_tag: sTag }).populate(
    //     "sentences"
    //   );
    // } else {
    //   // find all words when no parameters provided
    //   words = await Word.find({}).populate("sentences");
    // }

    console.log("words payload: " + words);

    res.status(200).json({
      words,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    // any cleanup actions
  }
};

const getAllTanosWords = async (req, res) => {
  try {
    // parameters from request
    const pTag = req.query.p_tag;
    const sTag = req.query.s_tag;
    console.log("p_tag: " + pTag);
    console.log("s_tag: " + sTag);

    let words;
    if (pTag && sTag) {
      // find subset of words based on parameters
      // words = await TanosWord.find({ p_tag: pTag, s_tag: sTag }).populate(
      //   "sentences"
      // );

      words = await TanosWord.find({ p_tag: pTag, s_tag: sTag });
    } else {
      // find all words when no parameters provided
      // words = await TanosWord.find({}).populate("sentences"); // we do not have sentences yet
      words = await TanosWord.find({});
    }

    console.log("words payload: " + words);

    res.status(200).json({
      words,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    // any cleanup actions
  }
};

const getAllGrammars = async (req, res) => {
  try {
    const pTag = req.query.p_tag;
    const sTag = req.query.s_tag;

    console.log("p_tag: " + pTag);
    console.log("s_tag: " + sTag);

    // Choose the model based on pTag
    let GrammarModel = null;
    for (const [key, model] of Object.entries(modelMapping)) {
      if (pTag && pTag.includes(key)) {
        GrammarModel = model;
        break;
      }
    }

    // Fallback or error if no appropriate model found
    if (!GrammarModel) {
      return res.status(400).json({
        error: "Invalid p_tag or no model available for provided p_tag",
      });
    }

    let grammars;
    if (pTag && sTag) {
      grammars = await GrammarModel.find({ p_tag: pTag, s_tag: sTag });
    } else if (pTag && !sTag) {
      grammars = await GrammarModel.find({ p_tag: pTag });
    } else {
      grammars = await GrammarModel.find({});
    }

    console.log("grammars payload: " + grammars);

    res.status(200).json({ grammars });
  } catch (err) {
    console.error("Error in getAllGrammars:", err.message);
    res.status(500).json({ error: "An internal server error occurred." });
  } finally {
    // Any cleanup actions
  }
};

// --------------------- API ENDPOINTS --------------------- //
app.get("/e-api/v1/words", (req, res) => {
  //res.send('Hello World!')
  // call like to get subset of words, call without params to get all words
  //curl -X GET http://localhost:8000/e-api/v1/words
  //curl -X GET 'http://localhost:8000/e-api/v1/words?p_tag=JLPT_N3&s_tag=100'    //must use quotes
  //curl -X GET 'http://localhost:8000/e-api/v1/words?p_tag=essential_600_verbs&s_tag=verbs-1'         //must use quotes
  //curl -X GET 'http://localhost:8000/e-api/v1/words?p_tag=suru_essential_600_verbs&s_tag=verbs-1'    //must use quotes

  console.log("received GET request");
  getAllWords(req, res);
});

app.get("/e-api/v1/tanos_words", (req, res) => {
  //res.send('Hello World!')
  // call like to get subset of words, call without params to get all words
  //curl -X GET http://localhost:8000/e-api/v1/tanos_words
  //curl -X GET 'http://localhost:8000/e-api/v1/tanos_words?p_tag=JLPT_N3&s_tag=100'    //must use quotes

  console.log("received GET request");
  getAllTanosWords(req, res);
});

app.get("/e-api/v1/grammars", (req, res) => {
  //res.send('Hello World!')
  // call like to get subset of words, call without params to get all words
  //curl -X GET 'http://localhost:8000/e-api/v1/grammars?p_tag=JLPT_N3&s_tag=10'    //must use quotes
  //curl -X GET 'http://localhost:8000/e-api/v1/grammars?p_tag=JLPT_N3'    //must use quotes

  console.log("received GET request");
  getAllGrammars(req, res);
});

app.get("/e-api/v1/grammar-titles", async (req, res) => {
  // gives list of all grammar titles for a given JLPT level
  // curl -X GET 'http://localhost:8000/e-api/v1/grammar-titles?p_tag=JLPT_N3&type=encoded'

  // for URL encoding of grammar titles with spaces
  // curl -X GET 'http://localhost:8000/e-api/v1/grammar-titles?p_tag=JLPT_N3&type=encoded'

  try {
    const pTag = req.query.p_tag;
    const type = req.query.type;

    if (!pTag) {
      return res.status(400).json({ error: "p_tag parameter is required." });
    }

    // Choose the model based on pTag
    let GrammarModel = null;
    for (const [key, model] of Object.entries(modelMapping)) {
      if (pTag.includes(key)) {
        GrammarModel = model;
        break;
      }
    }

    // Fallback or error if no appropriate model found
    if (!GrammarModel) {
      return res.status(400).json({
        error: "Invalid p_tag or no model available for provided p_tag",
      });
    }

    // Fetch grammar titles using the selected model
    const grammars = await GrammarModel.find({ p_tag: pTag }, "title");

    // Process titles based on type
    let titles;
    if (type === "encoded") {
      titles = grammars.map((grammar) => encodeURIComponent(grammar.title));
    } else {
      titles = grammars.map((grammar) => grammar.title);
    }

    res.status(200).json({ titles });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching grammar titles." });
  }
});

// Define the new endpoint to fetch grammar details based on the title
app.post("/e-api/v1/grammar-details", async (req, res) => {
  //gives only one grammar payload for given grammar title key
  // intended to populate one grammar page with only one grammar point
  //curl -X POST -H "Content-Type: application/json" -d '{"title": "決して～ない (kesshite ~ nai)"}' http://localhost:8000/e-api/v1/grammar-details

  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title parameter is required." });
    }

    const grammar = await Grammar.findOne({ title });

    if (!grammar) {
      return res.status(404).json({ error: "Grammar not found." });
    }

    res.status(200).json({ grammar });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching grammar details." });
  }
});

// Other language endpoints removed - Japanese only

// ------------ kanji ---------------

// GET endpoint to retrieve Kanji based on p_tag and optionally s_tag
// curl "http://localhost:8000/e-api/v1/kanji?p_tag=JLPT_N3&s_tag=part_1"
// curl "http://localhost:8000/e-api/v1/kanji?p_tag=JLPT_N3" - for only p_tag
app.get("/e-api/v1/kanji", async (req, res) => {
  try {
    const { p_tag, s_tag } = req.query; // extracting p_tag and s_tag from the query parameters

    // Check if p_tag is provided
    if (!p_tag) {
      return res.status(400).json({ error: "p_tag is required" });
    }

    // Build the query object based on provided parameters
    let query = { p_tag };
    if (s_tag) query.s_tag = s_tag;

    // Find kanji data based on the query
    const kanjiData = await Kanji.find(query);

    if (kanjiData.length === 0) {
      return res
        .status(404)
        .json({ error: "Kanji data not found for the given parameters" });
    }

    res.status(200).json(kanjiData);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve Kanji data" });
  }
});

// ------------ reading ---------------

// GET endpoint to retrieve a reading by its 'id' using a query parameter
// curl -i -X GET 'http://localhost:8000/api/reading?key=reading_1'
app.get("/e-api/v1/reading", async (req, res) => {
  try {
    const { key } = req.query; // Extract the key from the query parameters
    console.log(key);

    const reading = await Reading.findOne({ key: key }); // Use findOne to search by the key

    console.log(reading);

    if (!reading) {
      return res.status(404).json({ error: "Reading not found" });
    }

    res.status(200).json(reading);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reading" });
  }
});

// ------------ Tanos N5-N1 vocabulary ---------------

// ------------ Batch Fetch ---------------

// POST endpoint to fetch multiple items by their IDs
// Expects: { "kanji": ["id1", ...], "words": ["id2", ...], "grammars": ["id3", ...] }
app.post("/e-api/v1/batch-fetch", async (req, res) => {
  try {
    const { kanji, words, grammars } = req.body;
    const response = {};

    if (kanji && kanji.length > 0) {
      response.kanji = await Kanji.find({ _id: { $in: kanji } });
    }

    if (words && words.length > 0) {
      // Check both standard Word and TanosWord collections
      const standardWords = await Word.find({ _id: { $in: words } }).populate("sentences");
      const tanosWords = await TanosWord.find({ _id: { $in: words } });
      response.words = [...standardWords, ...tanosWords];
    }

    if (grammars && grammars.length > 0) {
      response.grammars = await Grammar.find({ _id: { $in: grammars } });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Batch fetch error:", error);
    res.status(500).json({ error: "Failed to batch fetch items" });
  }
});

// -------------------------------------------------------- //
// start the Express server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// --------------------- OLD CODE ---------------------------
