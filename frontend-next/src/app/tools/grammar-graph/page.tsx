"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

//import { useSearchParams } from "next/navigation";

import ParseTree from "@/components-parser/ParseTree";
import GrammarExplanationSimple from "@/components-parser/GrammarExplanationSimple";

const gptGrammarUrl = "/d-api/v1/grammar";

// https://localhost/grammar-graph?sentence=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&language=japanese

const HomePage = () => {
  // State to hold the parse tree data
  const [data, setData] = useState(initialData);
  // State for form inputs
  const [sentence, setSentence] = useState("");
  const [language, setLanguage] = useState(""); // Start with empty string
  const [userId, setUserId] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);

  // Metadata state
  const [metadata, setMetadata] = useState(null);

  // Example sentences for each language
  const exampleSentences = {
    Japanese: "私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。",
    Korean: "저는 비 오는 일요일 오후에 둠 메탈을 듣는 것을 좋아해요.",
    English: "I like listening to doom metal on rainy Sunday afternoons.",
  };


  // Modify the useEffect to use window.location.search
  useEffect(() => {
    // Check if window is defined (it won't be during SSR)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const querySentence = params.get("sentence");
      const queryLanguage = params.get("language");

      // Rest of your code remains the same
      // Set language
      let initialLanguage = "Korean";
      if (queryLanguage) {
        initialLanguage =
          queryLanguage.charAt(0).toUpperCase() +
          queryLanguage.slice(1).toLowerCase();
      }
      setLanguage(initialLanguage);

      // Set sentence
      if (querySentence) {
        setSentence(querySentence);
      } else {
        setSentence(exampleSentences[initialLanguage]);
      }

      // Pre-populate the user ID
      // Pre-populate the user ID, e.g., from local storage or generate a new one
      const savedUserId = localStorage.getItem("userId");
      if (savedUserId) {
        setUserId(savedUserId);
      } else {
        const newUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
        setUserId(newUserId);
        localStorage.setItem("userId", newUserId);
      }


    }
  }, []);


  // Update sentence when language changes, only if it's an example sentence
  useEffect(() => {
    const isExampleSentence =
      Object.values(exampleSentences).includes(sentence);
    if (isExampleSentence) {
      setSentence(exampleSentences[language]);
    }
  }, [language]);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sentence.length > 100) {
      alert("Sentence cannot exceed 100 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/d-api/v1/parse-tree", {
        sentence,
        language,
        userId,
      });

      // Parse the JSON string returned from the backend
      const parsedTree = JSON.parse(response.data.parseTree);

      // Update the parse tree with the new data from the backend
      setData(parsedTree);

      // Update metadata
      setMetadata({
        model: response.data.model,
        tokensUsed: response.data.tokensUsed,
        callTimestamp: response.data.callTimestamp,
      });
    } catch (error) {
      console.error("Error fetching new parse tree data:", error);
      // Handle error (e.g., show a notification)
    } finally {
      setLoading(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase tracking-[0.2em] mb-4">
            Grammar <span className="text-primary">Graph</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Neural Parsing Engine for Multilingual Syntactic Structural Analysis
          </p>
        </div>

        {/* Disclaimer Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-8 py-4 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:border-primary/20 transition-all shadow-sm"
          >
            <span>Intelligence Methodology & Safety</span>
            {isOpen ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>

          {isOpen && (
            <div className="mt-4 p-8 border border-primary/10 bg-primary/5 rounded-[2rem] text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <p className="text-slate-600 text-sm font-medium">
                Utilizing <span className="text-primary font-black uppercase tracking-wider">GPT-4o Omnimodel</span> for real-time syntactic deconstruction.
              </p>
              <p className="text-slate-400 text-[11px] italic">
                Synthetic Intelligence may exhibit structural hallucinations. Verify complex linguistic patterns with native intuition.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Form for Custom Sentence Submission */}
          <div className="flex-1 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2"
                  htmlFor="sentence"
                >
                  Syntactic Input
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-emerald-100 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                  <input
                    type="text"
                    id="sentence"
                    className="relative w-full p-6 rounded-2xl bg-white border border-slate-100 text-lg font-jp focus:outline-none focus:border-primary/30 transition-all shadow-inner text-slate-800"
                    placeholder="Enter sentence for deep analysis..."
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Target Lexicon
                </label>
                <div className="flex flex-wrap gap-3">
                  {["Japanese", "Korean", "English"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${language === lang ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : "Deconstruct Structure"}
              </button>
            </form>
          </div>

          {/* Grammar Explanation Component */}
          <div className="flex-1 lg:max-w-md bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5 overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-8 pb-4 border-b border-slate-50">Linguistic Blueprint</h3>
            <div className="custom-scrollbar">
              <GrammarExplanationSimple sentence={sentence} url={gptGrammarUrl} />
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="w-full space-y-8">
          {/* Metadata Display */}
          {!loading && metadata && (
            <div className="flex justify-end">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl space-y-2 border border-slate-800">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 mb-4">Telemetry Details</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                  <span className="text-slate-500">Processing Model:</span>
                  <span className="font-bold">{metadata.model}</span>
                  <span className="text-slate-500">Compute Tokens:</span>
                  <span className="font-bold">{metadata.tokensUsed}</span>
                  <span className="text-slate-500">Temporal Stamp:</span>
                  <span className="font-bold truncate max-w-[100px]">{metadata.callTimestamp}</span>
                </div>
              </div>
            </div>
          )}

          {/* Parse Tree Display */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[3rem]">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Mapping Syntactic Vectors</p>
              </div>
            )}
            {!loading && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-primary/5 min-h-[600px] flex justify-center items-center overflow-x-auto">
                <ParseTree data={data} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;



// ----------------------- vars ----------------------- //

const initialData = {
  type: "sentence",
  value: "저는 비 오는 일요일 오후에 둠 메탈을 듣는 것을 좋아해요.",
  translation: "I like listening to doom metal on rainy Sunday afternoons.",
  children: [
    {
      type: "noun_phrase",
      value: "저는",
      translation: "I",
      children: [
        {
          type: "pronoun",
          value: "저",
          translation: "I",
        },
        {
          type: "particle",
          value: "는",
          translation: "topic marker",
        },
      ],
    },
    {
      type: "noun_phrase",
      value: "비 오는 일요일 오후에",
      translation: "on rainy Sunday afternoons",
      children: [
        {
          type: "noun_phrase",
          value: "비 오는 일요일",
          translation: "rainy Sunday",
          children: [
            {
              type: "noun_phrase",
              value: "비 오는",
              translation: "rainy",
              children: [
                {
                  type: "noun",
                  value: "비",
                  translation: "rain",
                },
                {
                  type: "verb",
                  value: "오는",
                  translation: "coming",
                },
              ],
            },
            {
              type: "noun",
              value: "일요일",
              translation: "Sunday",
            },
          ],
        },
        {
          type: "noun",
          value: "오후",
          translation: "afternoon",
        },
        {
          type: "particle",
          value: "에",
          translation: "time/location particle",
        },
      ],
    },
    {
      type: "verb_phrase",
      value: "둠 메탈을 듣는",
      translation: "listening to doom metal",
      children: [
        {
          type: "noun",
          value: "둠 메탈",
          translation: "doom metal",
        },
        {
          type: "particle",
          value: "을",
          translation: "object marker",
        },
        {
          type: "verb",
          value: "듣는",
          translation: "listening",
        },
      ],
    },
    {
      type: "noun_phrase",
      value: "것을",
      translation: "the act of",
      children: [
        {
          type: "noun",
          value: "것",
          translation: "thing, act",
        },
        {
          type: "particle",
          value: "을",
          translation: "object marker",
        },
      ],
    },
    {
      type: "verb_phrase",
      value: "좋아해요",
      translation: "like",
      children: [
        {
          type: "verb",
          value: "좋아하다",
          translation: "like",
        },
        {
          type: "politeness_marker",
          value: "해요",
          translation: "politeness marker",
        },
      ],
    },
  ],
};

// --------------------------------------------------------------- //

// --- //

// const data =   {
//     "type": "root",
//     "value": "저는 지난 주말에 친구들과 함께 서울의 유명한 박물관을 방문하고, 그곳에서 다양한 역사적 유물과 예술 작품들을 감상한 후, 근처에 있는 맛있는 음식점에서 저녁을 먹으며 서로의 근황을 이야기했습니다.",
//     "children": [
//       {
//         "type": "subject",
//         "value": "저는",
//         "children": [
//           {
//             "type": "pronoun",
//             "value": "저",
//             "translation": "I"
//           },
//           {
//             "type": "particle",
//             "value": "는",
//             "translation": "Topic marker"
//           }
//         ]
//       },
//       {
//         "type": "adverbial",
//         "value": "지난 주말에",
//         "translation": "Last weekend",
//         "children": [
//           {
//             "type": "noun",
//             "value": "지난 주말",
//             "translation": "Last weekend"
//           },
//           {
//             "type": "particle",
//             "value": "에",
//             "translation": "At"
//           }
//         ]
//       },
//       {
//         "type": "conjunction_phrase",
//         "value": "친구들과 함께 서울의 유명한 박물관을 방문하고",
//         "translation": "Visited a famous museum in Seoul with my friends",
//         "children": [
//           {
//             "type": "noun",
//             "value": "친구들",
//             "translation": "Friends"
//           },
//           {
//             "type": "particle",
//             "value": "과",
//             "translation": "With"
//           },
//           {
//             "type": "particle",
//             "value": "함께",
//             "translation": "Together"
//           },
//           {
//             "type": "noun_phrase",
//             "value": "서울의 유명한 박물관",
//             "translation": "Famous museum in Seoul",
//             "children": [
//               {
//                 "type": "noun",
//                 "value": "서울",
//                 "translation": "Seoul"
//               },
//               {
//                 "type": "particle",
//                 "value": "의",
//                 "translation": "Of"
//               },
//               {
//                 "type": "adjective",
//                 "value": "유명한",
//                 "translation": "Famous"
//               },
//               {
//                 "type": "noun",
//                 "value": "박물관",
//                 "translation": "Museum"
//               }
//             ]
//           },
//           {
//             "type": "particle",
//             "value": "을",
//             "translation": "Object marker"
//           },
//           {
//             "type": "verb",
//             "value": "방문하고",
//             "translation": "Visited",
//             "children": [
//               {
//                 "type": "verb_stem",
//                 "value": "방문",
//                 "translation": "Visit"
//               },
//               {
//                 "type": "suffix",
//                 "value": "하고",
//                 "translation": "And"
//               }
//             ]
//           }
//         ]
//       },
//       {
//         "type": "conjunction_phrase",
//         "value": "그곳에서 다양한 역사적 유물과 예술 작품들을 감상한 후",
//         "translation": "After admiring various historical artifacts and artworks at that place",
//         "children": [
//           {
//             "type": "noun",
//             "value": "그곳",
//             "translation": "That place"
//           },
//           {
//             "type": "particle",
//             "value": "에서",
//             "translation": "At"
//           },
//           {
//             "type": "noun_phrase",
//             "value": "다양한 역사적 유물과 예술 작품들",
//             "translation": "Various historical artifacts and artworks",
//             "children": [
//               {
//                 "type": "adjective",
//                 "value": "다양한",
//                 "translation": "Various"
//               },
//               {
//                 "type": "adjective",
//                 "value": "역사적",
//                 "translation": "Historical"
//               },
//               {
//                 "type": "noun",
//                 "value": "유물",
//                 "translation": "Artifacts"
//               },
//               {
//                 "type": "particle",
//                 "value": "과",
//                 "translation": "And"
//               },
//               {
//                 "type": "noun",
//                 "value": "예술 작품들",
//                 "translation": "Artworks"
//               }
//             ]
//           },
//           {
//             "type": "verb",
//             "value": "감상한",
//             "translation": "Admiring",
//             "children": [
//               {
//                 "type": "verb_stem",
//                 "value": "감상",
//                 "translation": "Admire"
//               },
//               {
//                 "type": "suffix",
//                 "value": "한",
//                 "translation": "Past participle"
//               }
//             ]
//           },
//           {
//             "type": "suffix",
//             "value": "후",
//             "translation": "After"
//           }
//         ]
//       },
//       {
//         "type": "conjunction_phrase",
//         "value": "근처에 있는 맛있는 음식점에서 저녁을 먹으며 서로의 근황을 이야기했습니다",
//         "translation": "Had dinner at a nearby delicious restaurant while catching up with each other",
//         "children": [
//           {
//             "type": "noun",
//             "value": "근처에 있는 맛있는 음식점",
//             "translation": "Nearby delicious restaurant",
//             "children": [
//               {
//                 "type": "noun",
//                 "value": "근처",
//                 "translation": "Nearby"
//               },
//               {
//                 "type": "particle",
//                 "value": "에",
//                 "translation": "At"
//               },
//               {
//                 "type": "adjective",
//                 "value": "맛있는",
//                 "translation": "Delicious"
//               },
//               {
//                 "type": "noun",
//                 "value": "음식점",
//                 "translation": "Restaurant"
//               }
//             ]
//           },
//           {
//             "type": "particle",
//             "value": "에서",
//             "translation": "At"
//           },
//           {
//             "type": "noun",
//             "value": "저녁",
//             "translation": "Dinner"
//           },
//           {
//             "type": "verb",
//             "value": "먹으며",
//             "translation": "While eating",
//             "children": [
//               {
//                 "type": "verb_stem",
//                 "value": "먹",
//                 "translation": "Eat"
//               },
//               {
//                 "type": "suffix",
//                 "value": "으며",
//                 "translation": "While"
//               }
//             ]
//           },
//           {
//             "type": "noun_phrase",
//             "value": "서로의 근황",
//             "translation": "Each other's recent updates",
//             "children": [
//               {
//                 "type": "pronoun",
//                 "value": "서로의",
//                 "translation": "Each other's"
//               },
//               {
//                 "type": "noun",
//                 "value": "근황",
//                 "translation": "Recent updates"
//               }
//             ]
//           },
//           {
//             "type": "verb",
//             "value": "이야기했습니다",
//             "translation": "Talked",
//             "children": [
//               {
//                 "type": "verb_stem",
//                 "value": "이야기",
//                 "translation": "Talk"
//               },
//               {
//                 "type": "suffix",
//                 "value": "했습니다",
//                 "translation": "Did"
//               }
//             ]
//           }
//         ]
//       }
//     ]
//   }

// const data =  {
//     "type": "Sentence",
//     "value": "I like to listen to doom metal on rainy Sunday afternoons.",
//     "translation": "私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。",
//     "children": [
//       {
//         "type": "NounPhrase",
//         "value": "I",
//         "translation": "私",
//         "children": [
//           {
//             "type": "Pronoun",
//             "value": "I",
//             "translation": "私"
//           }
//         ]
//       },
//       {
//         "type": "VerbPhrase",
//         "value": "like to listen to doom metal on rainy Sunday afternoons",
//         "translation": "聴くのが好きです",
//         "children": [
//           {
//             "type": "Verb",
//             "value": "like",
//             "translation": "好きです"
//           },
//           {
//             "type": "InfinitivePhrase",
//             "value": "to listen to doom metal on rainy Sunday afternoons",
//             "translation": "聴く",
//             "children": [
//               {
//                 "type": "Verb",
//                 "value": "listen",
//                 "translation": "聴く"
//               },
//               {
//                 "type": "PrepositionalPhrase",
//                 "value": "to doom metal",
//                 "translation": "ドゥームメタルを",
//                 "children": [
//                   {
//                     "type": "Preposition",
//                     "value": "to",
//                     "translation": "〜を"
//                   },
//                   {
//                     "type": "NounPhrase",
//                     "value": "doom metal",
//                     "translation": "ドゥームメタル",
//                     "children": [
//                       {
//                         "type": "Noun",
//                         "value": "doom metal",
//                         "translation": "ドゥームメタル"
//                       }
//                     ]
//                   }
//                 ]
//               },
//               {
//                 "type": "PrepositionalPhrase",
//                 "value": "on rainy Sunday afternoons",
//                 "translation": "雨の日曜日の午後に",
//                 "children": [
//                   {
//                     "type": "Preposition",
//                     "value": "on",
//                     "translation": "〜に"
//                   },
//                   {
//                     "type": "NounPhrase",
//                     "value": "rainy Sunday afternoons",
//                     "translation": "雨の日曜日の午後",
//                     "children": [
//                       {
//                         "type": "Adjective",
//                         "value": "rainy",
//                         "translation": "雨の"
//                       },
//                       {
//                         "type": "Noun",
//                         "value": "Sunday",
//                         "translation": "日曜日"
//                       },
//                       {
//                         "type": "Noun",
//                         "value": "afternoons",
//                         "translation": "午後"
//                       }
//                     ]
//                   }
//                 ]
//               }
//             ]
//           }
//         ]
//       }
//     ]
//   }

// Japanese
// const data = {
//     "type": "sentence",
//     "value": "私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。",
//     "translation": "I like listening to doom metal on rainy Sunday afternoons.",
//     "children": [
//       {
//         "type": "noun_phrase",
//         "value": "私は",
//         "translation": "I",
//         "children": [
//           {
//             "type": "pronoun",
//             "value": "私",
//             "translation": "I"
//           },
//           {
//             "type": "particle",
//             "value": "は",
//             "translation": "topic marker"
//           }
//         ]
//       },
//       {
//         "type": "noun_phrase",
//         "value": "雨の日曜日の午後に",
//         "translation": "on rainy Sunday afternoons",
//         "children": [
//           {
//             "type": "noun_phrase",
//             "value": "雨の日曜日",
//             "translation": "rainy Sunday",
//             "children": [
//               {
//                 "type": "noun",
//                 "value": "雨",
//                 "translation": "rain"
//               },
//               {
//                 "type": "particle",
//                 "value": "の",
//                 "translation": "possessive particle"
//               },
//               {
//                 "type": "noun",
//                 "value": "日曜日",
//                 "translation": "Sunday"
//               }
//             ]
//           },
//           {
//             "type": "particle",
//             "value": "の",
//             "translation": "possessive particle"
//           },
//           {
//             "type": "noun",
//             "value": "午後",
//             "translation": "afternoon"
//           },
//           {
//             "type": "particle",
//             "value": "に",
//             "translation": "time/location particle"
//           }
//         ]
//       },
//       {
//         "type": "verb_phrase",
//         "value": "ドゥームメタルを聴く",
//         "translation": "listening to doom metal",
//         "children": [
//           {
//             "type": "noun",
//             "value": "ドゥームメタル",
//             "translation": "doom metal"
//           },
//           {
//             "type": "particle",
//             "value": "を",
//             "translation": "object marker"
//           },
//           {
//             "type": "verb",
//             "value": "聴く",
//             "translation": "listen"
//           }
//         ]
//       },
//       {
//         "type": "nominalizer_phrase",
//         "value": "のが",
//         "translation": "the act of",
//         "children": [
//           {
//             "type": "nominalizer",
//             "value": "の",
//             "translation": "nominalizer"
//           },
//           {
//             "type": "particle",
//             "value": "が",
//             "translation": "subject marker"
//           }
//         ]
//       },
//       {
//         "type": "adjective_phrase",
//         "value": "好きです",
//         "translation": "like",
//         "children": [
//           {
//             "type": "adjective",
//             "value": "好き",
//             "translation": "like"
//           },
//           {
//             "type": "copula",
//             "value": "です",
//             "translation": "politeness marker"
//           }
//         ]
//       }
//     ]
//   }
