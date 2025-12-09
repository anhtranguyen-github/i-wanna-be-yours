"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getUserFromCookies } from "@/utils/helperFunctions";

import { useUser } from "@/context/UserContext";

const SentenceMiningTable = () => {
  const [data, setData] = useState([]);
  //const [userId, setUserId] = useState(null);
  const { user } = useUser();
  const userId = user?.id;
  const loggedIn = !!user;

  // useEffect(() => {
  //   const { userId } = getUserFromCookies();
  //   setUserId(userId);
  // }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const response = await axios.get("/f-api/v1/text-parser-words", {
        params: {
          userId: userId,
          collectionName: "vocabulary",
          p_tag: "sentence_mining",
          s_tag: "verbs-1",
        },
      });
      setData(response.data.words);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const deleteWord = async (wordId) => {
    if (!userId) return;
    try {
      await axios.delete("/f-api/v1/text-parser-words", {
        data: {
          id: wordId,
          userId: userId,
          collectionName: "vocabulary",
          p_tag: "sentence_mining",
          s_tag: "verbs-1",
        },
      });
      fetchData(); // Refresh the data after deletion
    } catch (error) {
      console.error("Error deleting word:", error);
    }
  };

  return (
    <div className="bg-brand-cream min-h-screen p-4">
      <div className="container mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-brand-dark text-center">Sentence Mining</h1>
      <div className="overflow-x-auto rounded-xl border-2 border-brand-dark shadow-hard clay-card">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-brand-blue text-white">
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">ID</th>
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Japanese Vocabulary</th>
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Simplified Vocabulary</th>
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">English Vocabulary</th>
            {/* <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Audio</th> */}
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Sentences</th>
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Notes</th>
            <th className="py-4 px-6 text-left font-bold border-b-2 border-brand-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((word, index) => (
            <tr key={index} className="hover:bg-brand-blue/10 transition-colors duration-150 border-b border-brand-dark/20 last:border-b-0">
              <td className="py-4 px-6 text-brand-dark font-medium">{word.id}</td>
              <td className="py-4 px-6 text-brand-dark font-bold text-lg">{word.vocabulary_original}</td>
              <td className="py-4 px-6 text-brand-dark">{word.vocabulary_simplified}</td>
              <td className="py-4 px-6 text-brand-dark">{word.vocabulary_english}</td>
              {/* <td className="py-2 px-4 border-b border-gray-300">
                <button
                  onClick={() => {
                    const audioElement = document.getElementById(
                      `audio-${word.vocabulary_audio}`
                    ) as HTMLAudioElement;
                    audioElement.play();
                  }}
                  className="p-2 bg-slate-500 text-white rounded-full hover:bg-slate-600 focus:outline-none"
                >
                  ▶️
                </button>
                <audio id={`audio-${word.vocabulary_audio}`} className="hidden">
                  <source src={word.vocabulary_audio} type="audio/mp3" />
                </audio>
              </td> */}
              <td className="py-4 px-6">
                {word.sentences.map((sentence, sIndex) => (
                  <div key={sIndex} className="mb-2">
                    <p className="text-brand-dark font-bold">{sentence.sentence_original}</p>
                    <p className="text-brand-dark/70 text-sm">{sentence.sentence_english}</p>
                  </div>
                ))}
              </td>
              <td className="py-4 px-6 text-brand-dark">{word.notes}</td>
              <td className="py-4 px-6">
                <button
                  onClick={() => deleteWord(word.id)}
                  className="clay-button bg-brand-peach text-brand-dark py-2 px-4 rounded-xl font-bold hover:bg-brand-peach/80 transition-all duration-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  );
};

export default SentenceMiningTable;




