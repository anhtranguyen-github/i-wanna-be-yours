"use client";

import React, { useState, useEffect, useRef } from 'react';

interface WordDetails {
  original: string;
  dictionary: string;
  furigana: string;
  status: string;
}

interface WordDetailsSidebarProps {
  clickedWordDetails: WordDetails | null;
  userId: string;
  url0: string;
  url1: string;
  setRevisionCount: any | null;
}

const WordDetailsSidebar: React.FC<WordDetailsSidebarProps> = ({
  clickedWordDetails,
  userId,
  url0,
  url1,
  setRevisionCount,
}) => {
  // url0 - python user specific backend
  // url1 simpleVocabUrl

  const word = clickedWordDetails?.dictionary;

  const [vocabularyData, setVocabularyData] = useState({
    original: "",
    hiragana: "",
    englishTranslations: [],
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = word ? `/d-api/v1/audio/v_${encodeURIComponent(word)}.mp3` : '';
  //const audioUrl = word ? `/audio/jitendex_audio/v_${encodeURIComponent(word)}.mp3` : '';
  //const audioUrl: string = `/audio/jitendex_audio/v_自衛権.mp3`; // hardcoded placeholder


  const togglePlay = async (): Promise<void> => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error(`Failed to play audio file: ${audioUrl}`, error);
      }
    }
  };


  const fetchVocabularyData = async () => {
    if (word === null) {
      console.error("No word provided for fetchVocabularyData.");
      return; // Exit the function if there is no word to fetch data for
    }

    try {
      // Ensure the word is properly URL encoded
      const wordEncoded = encodeURIComponent(word ?? "");
      const response = await fetch(`${url1}/${wordEncoded}`);
      const data = await response.json();
      if (response.ok) {
        setVocabularyData({
          original: data.original,
          hiragana: data.hiragana,
          englishTranslations: data.englishTranslations,
        });
      } else {
        console.error("Failed to fetch vocabulary data:", data.error);
        setVocabularyData({
          original: 'NaN',
          hiragana: 'NaN',
          englishTranslations: [],
        });
      }
    } catch (error) {
      console.error("Error fetching vocabulary data:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (word) {
      fetchVocabularyData();
    }
  }, [word]); // Fetch vocabulary data whenever the 'word' changes


  const handleUpdateStatus = async (status: string) => {
    if (!clickedWordDetails) return;

    const payload = {
      userId: userId,
      original: clickedWordDetails.original,
      dictionary: clickedWordDetails.dictionary,
      furigana: clickedWordDetails.furigana,
      status: status,
    };

    try {
      const response = await fetch(url0, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Word status updated to "${status}" successfully.`);
        // Optionally, you can perform any additional actions upon successful update

        // increase counter in parent so we trigger another text coloring mecab refresh
        setRevisionCount((prevCount) => prevCount + 1);


      } else {
        console.error("Failed to update word status:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating word status:", error);
    }
  };

  return (
    <div className="space-y-8">
      {clickedWordDetails ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-4xl font-black text-neutral-ink font-display">
              {clickedWordDetails.dictionary}
            </h3>
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/20 active:scale-95 transition-all shadow-sm ring-1 ring-primary/20"
            >
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-primary/40'}`} />
              {isPlaying ? "Pause" : "Play Audio"}
            </button>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onError={() => console.error(`Failed to load audio file: ${audioUrl}`)}
            />
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 pb-1 border-b border-slate-50">Semantic Intent</h4>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                {vocabularyData.englishTranslations.join(", ") || "No semantic map found."}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <h4 className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-ink mb-2">Phonetic</h4>
                <p className="text-sm font-bold text-slate-600">{clickedWordDetails.furigana}</p>
              </section>
              <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <h4 className="text-[9px] font-black uppercase tracking-[0.1em] text-neutral-ink mb-2">Lexical Index</h4>
                <p className="text-sm font-bold text-slate-600 uppercase">{clickedWordDetails.status}</p>
              </section>
            </div>

            <section className="pt-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink mb-4">External Intelligence</h4>
              <div className="flex gap-2">
                <a
                  href={`https://www.japandict.com/?s=${encodeURIComponent(clickedWordDetails.original)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-neutral-ink hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                >
                  JapanDict
                </a>
                <a
                  href={`https://jisho.org/search/${encodeURIComponent(clickedWordDetails.dictionary)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-neutral-ink hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                >
                  Jisho
                </a>
              </div>
            </section>

            <hr className="my-8 border-slate-50" />

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink mb-4">State Management</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleUpdateStatus("known")}
                  className="w-full flex items-center justify-between px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-100 active:scale-[0.98] transition-all border border-emerald-100"
                >
                  Synchronize as Known
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </button>
                <button
                  onClick={() => handleUpdateStatus("unknown")}
                  className="w-full flex items-center justify-between px-6 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-100 active:scale-[0.98] transition-all border border-amber-100"
                >
                  Mark as Critical Path
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </button>
                <button
                  onClick={() => handleUpdateStatus("seen")}
                  className="w-full flex items-center justify-between px-6 py-4 bg-sky-50 text-sky-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-100 active:scale-[0.98] transition-all border border-sky-100"
                >
                  Register as Familiar
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-slate-300 min-h-[400px]">
          <div className="text-8xl mb-8 opacity-10">?</div>
          <p className="text-center font-black text-[10px] uppercase tracking-widest leading-loose">Initialize deep analysis by<br />selecting a lexicon node</p>
        </div>
      )}
    </div>
  );
};


export default WordDetailsSidebar;