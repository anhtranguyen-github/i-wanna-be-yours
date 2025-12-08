"use client";

import { useState } from "react";
import { useEffect } from "react";
import { getUserFromCookies } from "@/utils/helperFunctions";

import CloneButton from "@/components/CloneButton";

import ComplexFlashcardModalKanjiFlask from "@/components/ComplexFlashcardModalKanjiFlask";
import ComplexFlashcardModalVocabFlaskSentenceMining from "@/components/ComplexFlashcardModalVocabFlaskSentenceMining";
import ComplexFlashcardModalVocabFlask from "@/components/ComplexFlashcardModalVocabFlask";
import ComplexFlashcardModalGrammarFlask from "@/components/ComplexFlashcardModalGrammarFlask";

import { useUser } from "@/context/UserContext";
import LoginButton from "@/components/LoginButton";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  //const [userId, setuserId] = useState(null);
  const { user, loading } = useUser();
  const userId = user?.id ? String(user.id) : "";
  const loggedIn = !!user;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // useEffect(() => {
  //   const fetchuserId = async () => {
  //     const { userId, jwt } = getUserFromCookies();
  //     setuserId(userId);
  //   };

  //   fetchuserId();
  // }, []);

  // ----------------- AUTOMATIC CLONING ON FIRST VISIT -----------------

  // This useEffect checks if a cookie named "collectionsCloned" is present.
  // If not, and if the user is logged in, it triggers cloning.
  useEffect(() => {
    // Only run this effect if the user is logged in and userId is available.
    if (!loggedIn || !userId) return;

    // Check if the cookie exists (you can adjust the check as needed)
    if (document.cookie.indexOf("collectionsCloned=true") === -1) {
      handleCloneAll()
        .then(() => {
          // Set a cookie that lasts for about 10 years
          const date = new Date();
          // 10 years in milliseconds = 10 * 365 * 24 * 60 * 60 * 1000
          date.setTime(date.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
          const expires = "expires=" + date.toUTCString();
          document.cookie = "collectionsCloned=true; " + expires + "; path=/";
        })
        .catch((error) => {
          console.error("Error cloning collections on first visit:", error);
        });
    }
  }, [loggedIn, userId]);



















  // While we're still loading the login state from context, show a spinner or nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Simple spinner, or skeleton UI */}
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  //If the user is not logged in, display the modal
  if (!loading && !loggedIn) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        {/* Modal container */}
        <div className="bg-white rounded-md shadow-md p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Please Log In</h2>
          <p className="mb-4">
            You need to be logged in to access this feature.
          </p>
          <div className="flex justify-end">
            <LoginButton />
          </div>
        </div>
      </div>
    );
  }


  // New "Clone All" function with complex logic for kanji parts
  const handleCloneAll = async () => {
    const cloneOperations: Promise<any>[] = [];

    // --- Kanji cloning with parts ---
    const kanjiLevels = ["JLPT_N5", "JLPT_N4", "JLPT_N3"]; //, "JLPT_N2", "JLPT_N1"];
    // Define which levels have parts (you can adjust this mapping as needed)
    const kanjiPartsMapping: Record<string, string[]> = {
      JLPT_N3: ["part_1", "part_2", "part_3", "part_4", "part_5", "part_6"],
      JLPT_N4: ["part_1", "part_2", "part_3"],
      JLPT_N5: ["part_1"],
      // For JLPT_N2 and JLPT_N1, if no parts are defined, we’ll do one call.
    };

    kanjiLevels.forEach((level) => {
      // If parts are defined for this level, clone each part separately
      if (kanjiPartsMapping[level] && kanjiPartsMapping[level].length > 0) {
        kanjiPartsMapping[level].forEach((part) => {
          const url = `/f-api/v1/clone-static-collection-kanji`;
          const data = {
            userId,
            collection: "kanji",
            p_tag: level,
            s_tag: part,
          };
          cloneOperations.push(
            fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            }).then((res) => {
              if (!res.ok) {
                throw new Error(`Error cloning kanji for ${level} - ${part}`);
              }
              return res.json();
            })
          );
        });
      } else {
        // Otherwise, clone once for that level
        const url = `/f-api/v1/clone-static-collection-kanji`;
        const data = { userId, collection: "kanji", p_tag: level };
        cloneOperations.push(
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }).then((res) => {
            if (!res.ok) {
              throw new Error(`Error cloning kanji for ${level}`);
            }
            return res.json();
          })
        );
      }
    });

    // --- Vocabulary cloning (words) ---
    const wordsLevels = ["essential_600_verbs", "suru_essential_600_verbs"];
    wordsLevels.forEach((level) => {
      const url = `/f-api/v1/clone-static-collection-words`;
      const data = {
        userId,
        collection: "words",
        p_tag: level,
      };
      cloneOperations.push(
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).then((res) => {
          if (!res.ok) throw new Error(`Error cloning words for ${level}`);
          return res.json();
        })
      );
    });

    // --- Grammar cloning ---
    const grammarLevels = ["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"];
    grammarLevels.forEach((level) => {
      const url = `/f-api/v1/clone-static-collection-grammars`;
      const data = {
        userId,
        collection: "grammars",
        p_tag: level,
      };
      cloneOperations.push(
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).then((res) => {
          if (!res.ok) throw new Error(`Error cloning grammars for ${level}`);
          return res.json();
        })
      );
    });

    try {
      const results = await Promise.all(cloneOperations);
      console.log("All clone operations succeeded:", results);
      alert("All SRS Flashcard collections cloned successfully!");
    } catch (error) {
      console.error("One or more clone operations failed:", error);
      alert("Error cloning one or more collections. Please check the console for details.");
    }
  };












  return (
    <div className="bg-brand-cream text-brand-dark dark:bg-gray-900 dark:text-white min-h-screen p-4">
      {/* Sentence Mining Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">
          My Sentence Mining Flashcards
        </h2>
        <div className="">
          <ComplexFlashcardModalVocabFlaskSentenceMining
            userId={userId}
            collectionName="vocabulary"
            p_tag="sentence_mining"
            s_tag="verbs-1"
          />
        </div>
      </section>

      {/* Grammar JLPT N3 Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">Grammar Flashcards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"].map(
            (part, index) => (
              <div key={index} className="">
                <ComplexFlashcardModalGrammarFlask
                  userId={userId}
                  collectionName="grammars"
                  p_tag={part}
                  s_tag="all"
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* Kanji JLPT N3 Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">
          Kanji JLPT N3 (with one reading)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {["part_1", "part_2", "part_3", "part_4", "part_5", "part_6"].map(
            (part, index) => (
              <div key={index} className="">
                <ComplexFlashcardModalKanjiFlask
                  userId={userId}
                  collectionName="kanji"
                  p_tag="JLPT_N3"
                  s_tag={part}
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* Kanji JLPT N4 Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">
          Kanji JLPT N4 (with one reading)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {["part_1", "part_2", "part_3"].map((part, index) => (
            <div key={index} className="">
              <ComplexFlashcardModalKanjiFlask
                userId={userId}
                collectionName="kanji"
                p_tag="JLPT_N4"
                s_tag={part}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Kanji JLPT N5 Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">
          Kanji JLPT N5 (with one reading)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {["part_1"].map((part, index) => (
            <div key={index} className="">
              <ComplexFlashcardModalKanjiFlask
                userId={userId}
                collectionName="kanji"
                p_tag="JLPT_N5"
                s_tag={part}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Essential Japanese Verbs Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">Essential Japanese Verbs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[
            "verbs-1",
            "verbs-2",
            "verbs-3",
            "verbs-4",
            "verbs-5",
            "verbs-6",
            "verbs-7",
            "verbs-8",
          ].map((part, index) => (
            <div key={index} className="">
              <ComplexFlashcardModalVocabFlask
                userId={userId}
                collectionName="words"
                p_tag="essential_600_verbs"
                s_tag={part}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Essential Suru Japanese Verbs Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">
          Essential Suru Japanese Verbs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[
            "verbs-1",
            "verbs-2",
            "verbs-3",
            "verbs-4",
            "verbs-5",
            "verbs-6",
          ].map((part, index) => (
            <div key={index} className="">
              <ComplexFlashcardModalVocabFlask
                userId={userId}
                collectionName="words"
                p_tag="suru_essential_600_verbs"
                s_tag={part}
              />
            </div>
          ))}
        </div>
      </section>





      {/* Clone JLPT Collections Section */}
      <section className="mb-12 border-t-2 border-brand-dark pt-8">
        <h1 className="text-3xl font-extrabold mb-6 text-brand-dark">Clone JLPT Collections</h1>
        <p className="text-brand-dark mb-2">
          Cloning means that we just assign knowledge level tracking tags for
          given kanji/vocab/grammar for given user.
        </p>
        <p className="text-brand-dark mb-8">So this is type of curriculum indexing for given user.</p>




        {/* New “Clone All Collections” Button */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold mt-4 mb-4 text-brand-dark">Clone Everything</h2>
          <button
            onClick={handleCloneAll}
            className="clay-button bg-brand-green hover:bg-brand-green/80 text-brand-dark font-bold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Clone All Collections
          </button>
        </section>






        <p className="mt-4 text-xl font-bold text-brand-dark">Clone Kanji</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 mb-8">
          {["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"].map(
            (level) => (
              <CloneButton
                key={level}
                collection="kanji"
                level={level}
                userId={userId}
              />
            )
          )}
        </div>

        <p className="text-xl font-bold text-brand-dark">Clone Vocabulary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {["essential_600_verbs", "suru_essential_600_verbs"].map((level) => (
            <CloneButton
              key={level}
              collection="words"
              level={level}
              userId={userId}
            />
          ))}
        </div>

        <p className="text-xl font-bold text-brand-dark">Clone Grammar</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 mb-8">
          {["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"].map(
            (level) => (
              <CloneButton
                key={level}
                collection="grammars"
                level={level}
                userId={userId}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}






























