"use client";

import React, { useState, useEffect, useRef } from "react";

interface Word {
  original: string;
  dictionary: string;
  furigana: string;
  status: string;
}

interface WordDetails {
  original: string;
  dictionary: string;
  furigana: string;
  status: string;
}

interface JapaneseTextParserProps {
  inputText: string | null;
  inputMode: string;
  revisionCount: number;
  userId: string | null;
  setClickedWord: React.Dispatch<React.SetStateAction<string | null>>;
  setClickedWordDictForm: React.Dispatch<React.SetStateAction<string | null>>;
  setHoveredWord: React.Dispatch<React.SetStateAction<string | null>>;
  setHoveredSentence: React.Dispatch<React.SetStateAction<Word[] | null>>;
  setClickedWordSentence: React.Dispatch<React.SetStateAction<Word[] | null>>;
  setClickedWordDetails: React.Dispatch<React.SetStateAction<WordDetails | null>>;
}

const JapaneseTextParser: React.FC<JapaneseTextParserProps> = ({
  inputText,
  inputMode,
  revisionCount,
  userId,
  setClickedWord,
  setClickedWordDictForm,
  setHoveredWord,
  setHoveredSentence,
  setClickedWordSentence,
  setClickedWordDetails,
}) => {

  const [parsedData, setParsedData] = useState<string | null>(null); // State to store parsed data
  const [enhancedData, setEnhancedData] = useState<any | null>(null); // State to store enhanced data

  const mecabApiUrl = "/d-api/v1/parse-split";
  const userVocabApiUrl = "/f-api/v1/enhance-vocabulary";
  //const [userId] = useState("testuserId"); // Define userId


  console.log('userId:')
  console.log(userId)

  // --- text enhancement --- //

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchData = async () => {
      //if (!inputText) return;
      if (!inputText || !userId || !userId.trim()) return; // Guard clause for inputText and userId

      try {
        const response = await fetch(mecabApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: inputText, mode: inputMode }),
        });

        const data = await response.json();
        setParsedData(data);
        enhanceData(data);
      } catch (error) {
        console.error("Error fetching parsed data:", error);
      }
    };

    fetchData();
  }, [inputText, inputMode, revisionCount, userId]);

  const enhanceData = async (parsedData: any) => {
    const response = await fetch(userVocabApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: userId, data: parsedData }), // Include userId and parsed data
    });
    const enhancedData = await response.json();
    setEnhancedData(enhancedData);
  };

  // Function to handle clicking on a word
  const handleClickWord = (word: any) => {
    // Search for the clicked word in parsedData or enhancedData
    let clickedWordData = null;
    // let clickedWordData = {
    //   original: "彼女",
    //   dictionary: "彼女",
    //   furigana: "かのじょ",
    //   status: "xxx",
    // }; //placeholder              TODO: looks like making lots of issues

    if (Array.isArray(parsedData)) {
      const sentence = parsedData.find((sentence) =>
        sentence.find((w: any) => w.original === word)
      );
      if (sentence) {
        clickedWordData = sentence.find((w: any) => w.original === word);
      }
    }

    if (Array.isArray(enhancedData)) {
      const sentence = enhancedData.find((sentence) =>
        sentence.find((w: any) => w.original === word)
      );
      if (sentence) {
        clickedWordData = sentence.find((w: any) => w.original === word);
      }
    }

    // Set the clicked word details
    setClickedWordDetails(clickedWordData);
    console.log("clickedWordData:");
    console.log(clickedWordData);
  };

  // --- end of text enhancement --- //


  return (
    <div className="h-full bg-neutral-900/50 backdrop-blur-xl border border-white/5 font-sans text-2xl p-8 rounded-2xl shadow-2xl w-full mb-6">
      {enhancedData ? (
        enhancedData.map((words: any, sentenceIndex: any) => (
          <div
            key={sentenceIndex}
            className="p-4 rounded-xl mb-4 flex flex-wrap gap-x-1 gap-y-4 hover:bg-white/5 transition-colors duration-300 group/sentence"
            onMouseEnter={() => setHoveredSentence(words)}
            onMouseLeave={() => setHoveredSentence(null)}
          >
            {words.map((word: any, wordIndex: any) => (
              <span
                key={wordIndex}
                className="relative group/word"
                onClick={() => {
                  setClickedWord(word.original);
                  setClickedWordDictForm(word.dictionary);
                  setClickedWordSentence(words);
                  handleClickWord(word.original);
                }}
                onMouseEnter={() => setHoveredWord(word.original)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                {/* Furigana */}
                <span
                  className={`absolute -top-6 left-0 right-0 mx-auto w-auto text-center text-[10px] font-bold tracking-tighter opacity-0 group-hover/word:opacity-100 transition-all duration-300 ease-in-out text-cyan-400 z-10`}
                >
                  {word.furigana}
                </span>

                <span
                  className={`inline-flex items-center justify-center py-2 px-1.5 rounded-lg transition-all duration-300 cursor-pointer font-jp ${/^[a-zA-Z0-9'"=?!,.。、「」『』〜・（）［］〈〉《》―‥…;&:%@$#()\[\]{}\-_/\\]+$/.test(word.original)
                    ? "text-neutral-500"
                    : word.status === "known"
                      ? "text-neutral-300 hover:text-white"
                      : word.status === "unknown"
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    } hover:scale-110 hover:z-20`}
                >
                  {word.original}
                </span>

              </span>
            ))}
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-neutral-700 font-mono text-xs uppercase tracking-[0.3em] mb-2">Neural Core Idle</div>
          <p className="text-neutral-500 text-xs">Awaiting syntactic input for decomposition.</p>
        </div>
      )}
    </div>
  );
};

export default JapaneseTextParser;