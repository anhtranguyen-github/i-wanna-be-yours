"use client";

import Link from "next/link";
import React from "react";
import { useState, useEffect, useMemo } from "react";

import { Flame, Eye, EyeOff } from "lucide-react";
import PageTimer from "@/components/PageTimer";

export default function Home() {
  const [globalTotalClicks, setGlobalTotalClicks] = useState<number>(0);

  useEffect(() => {
    const updateGlobalTotalClicks = () => {
      if (typeof window !== "undefined") {
        const storedGlobalClicks = localStorage.getItem("globalTotalClicks");
        const totalClicks = storedGlobalClicks
          ? parseInt(storedGlobalClicks)
          : 0;
        setGlobalTotalClicks(totalClicks);
      }
    };

    // Initial load
    updateGlobalTotalClicks();

    // Listen for the custom 'globalClicksUpdated' event
    window.addEventListener("globalClicksUpdated", updateGlobalTotalClicks);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener(
        "globalClicksUpdated",
        updateGlobalTotalClicks
      );
    };
  }, []);

  return (
    <div className="container mx-auto py-16 px-6 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase tracking-[0.2em] mb-4">Quick <span className="text-primary italic">Vocab</span></h1>
        <div className="max-w-3xl mx-auto bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-slate-600 font-medium text-sm leading-relaxed relative z-10 italic">
            &quot;Rapid vocabulary refresh for JLPT N5-N1. Scroll through the cards to anchor your memory. Click to reveal meaning and hear pronunciation.&quot;
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-primary/5">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Flame className="w-8 h-8 fill-primary" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{globalTotalClicks}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</p>
          </div>
        </div>
        <PageTimer />
      </div>

      <TabComponent />
    </div>
  );
}

interface HiraganaCardProps {
  kanji: string;
  reading: string;
  en: string;
  k_audio: string;
  showReadings: boolean;
}

const HiraganaCard: React.FC<HiraganaCardProps> = ({
  kanji,
  reading,
  en,
  k_audio,
  showReadings,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const [flipCount, setFlipCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedFlipCount = localStorage.getItem(`flipCount_${kanji}`);
      return storedFlipCount ? parseInt(storedFlipCount) : 0;
    }
    return 0;
  });

  const [streak, setStreak] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedStreak = localStorage.getItem(`streak_${kanji}`);
      return storedStreak ? parseInt(storedStreak) : 0;
    }
    return 0;
  });

  const [lastFlipDate, setLastFlipDate] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const storedLastFlipDate = localStorage.getItem(`lastFlipDate_${kanji}`);
      return storedLastFlipDate ? storedLastFlipDate : null;
    }
    return null;
  });

  const [achievements, setAchievements] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const storedAchievements = localStorage.getItem(`achievements_${kanji}`);
      return storedAchievements ? JSON.parse(storedAchievements) : [];
    }
    return [];
  });

  const [recentAchievement, setRecentAchievement] = useState("");
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`flipCount_${kanji}`, flipCount.toString());
      localStorage.setItem(`streak_${kanji}`, streak.toString());
      localStorage.setItem(`lastFlipDate_${kanji}`, lastFlipDate || "");
      localStorage.setItem(`achievements_${kanji}`, JSON.stringify(achievements));
    }
  }, [flipCount, streak, lastFlipDate, achievements, kanji]);

  const playAudio = () => {
    const audioElement = new Audio(k_audio);
    audioElement.play();
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
    const newFlipCount = flipCount + 1;
    setFlipCount(newFlipCount);
    playAudio();
    updateGlobalTotalClicks();
    checkAchievements(newFlipCount);

    const today = new Date().toDateString();
    if (lastFlipDate !== today) {
      setStreak(streak + 1);
      setLastFlipDate(today);
    }
  };

  const updateGlobalTotalClicks = () => {
    if (typeof window !== "undefined") {
      const storedGlobalClicks = localStorage.getItem("globalTotalClicks");
      const newGlobalClicks = storedGlobalClicks ? parseInt(storedGlobalClicks) + 1 : 1;
      localStorage.setItem("globalTotalClicks", newGlobalClicks.toString());
      window.dispatchEvent(new Event("globalClicksUpdated"));
    }
  };

  const checkAchievements = (flipCount: number) => {
    const newAchievements = [...achievements];
    if (flipCount >= 100 && !achievements.includes("First 100 Flips!")) {
      newAchievements.push("First 100 Flips!");
      setAchievements(newAchievements);
      triggerAchievement("First 100 Flips!");
    }
  };

  const triggerAchievement = (achievement: string) => {
    setRecentAchievement(achievement);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3000);
  };

  const masteryLevel = Math.min(Math.floor(flipCount / 10), 10);

  return (
    <div className="w-48 h-56 group perspective-1000" onClick={handleCardClick}>
      <div className={`relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>

        {/* Front */}
        <div className={`absolute inset-0 backface-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm group-hover:shadow-md transition-all flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-slate-50/50`}>
          <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-center opacity-40">
            <span className="text-[8px] font-black uppercase tracking-widest">{flipCount} F</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{streak} D</span>
          </div>

          {showReadings && (
            <h5 className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">
              [{reading}]
            </h5>
          )}
          <h5 className="text-3xl font-black text-slate-900 font-jp text-center leading-tight">
            {kanji}
          </h5>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (masteryLevel / 2) ? 'bg-primary' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary/5 border border-primary/20 rounded-[2rem] shadow-sm flex flex-col items-center justify-center p-6 text-center">
          <h5 className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">
            [{reading}]
          </h5>
          <h5 className="text-xl font-black text-slate-900 font-jp mb-2">{kanji}</h5>
          <p className="text-xs font-medium text-slate-600 leading-relaxed overflow-hidden line-clamp-4">
            {en}
          </p>

          <Link
            href={`https://www.japandict.com/?s=${encodeURIComponent(kanji)}`}
            passHref
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 p-2 rounded-xl bg-white border border-primary/10 text-primary hover:bg-primary/10 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M240-400q-33 0-56.5-23.5T160-480t23.5-56.5T240-560t56.5 23.5T320-480t-23.5 56.5T240-400m240 0q-33 0-56.5-23.5T400-480t23.5-56.5T480-560t56.5 23.5T560-480t-23.5 56.5T480-400m240 0q-33 0-56.5-23.5T640-480t23.5-56.5T720-560t56.5 23.5T800-480t-23.5 56.5T720-400" />
            </svg>
          </Link>
        </div>
      </div>

      {showAchievement && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-2xl z-50 animate-in slide-in-from-right-8 fade-in shadow-2xl animate-out fade-out slide-out-to-right-8 duration-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Achievement Unlocked!</p>
          <p className="font-bold text-sm tracking-tight">{recentAchievement}</p>
        </div>
      )}
    </div>
  );
};

const TabComponent = () => {
  const [activeJLPTTab, setActiveJLPTTab] = useState<string | null>(null);
  const [activeVocabTab, setActiveVocabTab] = useState<number | null>(null);
  const [showReadings, setShowReadings] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedJLPTTab = localStorage.getItem("activeJLPTTab");
      const storedVocabTab = localStorage.getItem("activeVocabTab");
      setActiveJLPTTab(storedJLPTTab || "JLPT_N3");
      setActiveVocabTab(storedVocabTab ? parseInt(storedVocabTab, 10) : 100);
    }
  }, []);

  const vocabSetsByLevel: Record<string, number[]> = useMemo(() => ({
    JLPT_N5: [100, 200, 300, 400, 500, 600, 700],
    JLPT_N4: [100, 200, 300, 400, 500, 600, 700],
    JLPT_N3: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900],
    JLPT_N2: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900],
    JLPT_N1: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500],
  }), []);

  const jlptLevels = ["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1"];
  const vocabSets = useMemo(() => vocabSetsByLevel[activeJLPTTab || "JLPT_N3"] || [], [activeJLPTTab, vocabSetsByLevel]);

  useEffect(() => {
    if (activeJLPTTab && vocabSets.length > 0 && activeVocabTab !== null) {
      if (!vocabSets.includes(activeVocabTab)) setActiveVocabTab(100);
    }
  }, [activeJLPTTab, vocabSets, activeVocabTab]);

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-8 overflow-auto max-w-full">
        {jlptLevels.map((level) => (
          <button
            key={level}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeJLPTTab === level ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            onClick={() => setActiveJLPTTab(level)}
          >
            {level.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-12 max-w-4xl">
        {vocabSets.map((set) => (
          <button
            key={set}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeVocabTab === set ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
            onClick={() => setActiveVocabTab(set)}
          >
            {set}
          </button>
        ))}
      </div>

      <div className="w-full flex justify-end mb-8">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm"
          onClick={() => setShowReadings(!showReadings)}
        >
          {showReadings ? <EyeOff size={14} /> : <Eye size={14} />}
          {showReadings ? "Hide Hints" : "Show Hints"}
        </button>
      </div>

      <div className="w-full">
        <KanjiTable
          p_tag={activeJLPTTab || "JLPT_N3"}
          s_tag={`${activeVocabTab || 100}`}
          showReadings={showReadings}
        />
      </div>
    </div>
  );
};

interface KanjiItem {
  vocabulary_original: string;
  vocabulary_simplified: string;
  vocabulary_english: string;
  vocabulary_audio: string;
}

interface KanjiTableProps {
  p_tag: string;
  s_tag: string;
  showReadings: boolean;
}

const KanjiTable: React.FC<KanjiTableProps> = ({ p_tag, s_tag, showReadings }) => {
  const [kanjiData, setKanjiData] = useState<KanjiItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!p_tag || !s_tag) return;
      setLoading(true);
      try {
        const apiUrl = `/e-api/v1/tanos_words?p_tag=${p_tag}&s_tag=${s_tag}`;
        const response = await fetch(`${apiUrl}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const { words } = await response.json();
        setKanjiData(words);
      } catch (error) {
        console.error("Error fetching vocab data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [p_tag, s_tag]);

  if (loading) return (
    <div className="flex flex-col items-center py-40 animate-pulse">
      <div className="w-16 h-16 bg-primary/20 rounded-[2.5rem] mb-6" />
      <div className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Lexicon...</div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-wrap justify-center gap-8">
        {kanjiData.map((item, index) => (
          <HiraganaCard
            key={index}
            kanji={item.vocabulary_original}
            reading={item.vocabulary_simplified}
            en={item.vocabulary_english}
            k_audio={item.vocabulary_audio}
            showReadings={showReadings}
          />
        ))}
      </div>
    </div>
  );
};
