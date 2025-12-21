
const { Word } = require('../models/word');



const getAllWords = async (req, res) => {
  try {
    const words = await Word.find();
    res.status(200).json({
      words,
    });
  } catch (err) {
    console.error("Error in getAllWords:", err.message);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

module.exports = { getAllWords };

