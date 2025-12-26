"use client";

import Link from "next/link";
import React from "react";
import { useState, useEffect } from "react";

//http://localhost:3000/japanese/kanji_overview

// pages/index.js

export default function Home() {
  // Define your hiragana characters and their romaji
  const hiragana = [
    { kanji: "末", reading: "マツ", k_audio: "/audio/japanese/kanji/k_末.mp3" },
    {
      kanji: "若い",
      reading: "わかい",
      k_audio: "/audio/japanese/kanji/k_若い.mp3",
    },
    { kanji: "晩", reading: "バン", k_audio: "/audio/japanese/kanji/k_晩.mp3" },
    { kanji: "皿", reading: "さら", k_audio: "/audio/japanese/kanji/k_皿.mp3" },

    //... add all characters
  ];

  interface HiraganaCardProps {
    kanji: string;
    reading: string;
    k_audio: string;
  }

  const HiraganaCard: React.FC<HiraganaCardProps> = ({
    kanji,
    reading,
    k_audio,
  }) => {
    // Function to play audio
    const playAudio = () => {
      const audioElement = new Audio(k_audio);
      audioElement.play();
    };

    return (
      <div className="w-28 h-20 group perspective-1000" onClick={playAudio}>
        <div className="relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer group-hover:rotate-y-180">
          {/* Front of the Card */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-2xl  border border-slate-100 flex items-center justify-center p-2 group-hover: transition-shadow">
            <h5 className="text-3xl font-black text-neutral-ink font-jp">{kanji}</h5>
          </div>

          {/* Back of the Card */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary/5 rounded-2xl  border border-primary/20 flex flex-col items-center justify-center p-2">
            <h5 className="text-sm font-black text-primary uppercase tracking-widest">{reading}</h5>

            {/* Icon Link at the Bottom Left */}
            <Link
              href={`https://www.japandict.com/kanji/?s=${encodeURIComponent(kanji)}`}
              passHref
              className="absolute bottom-1.5 left-1.5 p-1 rounded-lg bg-white border border-primary/10 text-primary hover:bg-primary/10 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 -960 960 960"
                className="w-3.5 h-3.5"
                fill="currentColor"
              >
                <path d="M240-400q-33 0-56.5-23.5T160-480t23.5-56.5T240-560t56.5 23.5T320-480t-23.5 56.5T240-400m240 0q-33 0-56.5-23.5T400-480t23.5-56.5T480-560t56.5 23.5T560-480t-23.5 56.5T480-400m240 0q-33 0-56.5-23.5T640-480t23.5-56.5T720-560t56.5 23.5T800-480t-23.5 56.5T720-400" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Define the type for a single item of Kanji data
  interface KanjiItem {
    kanji: string;
    reading: string;
    k_audio: string;
  }

  interface KanjiTableProps {
    p_tag: string; // Explicitly stating p_tag is of any type
  }

  const KanjiTable: React.FC<KanjiTableProps> = ({ p_tag }) => {
    const [kanjiData, setKanjiData] = useState<KanjiItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        if (!p_tag) return; // If no p_tag is provided, don't attempt to fetch data

        setLoading(true);
        try {
          console.log(
            "##################################  ENV VARS  #######################################"
          );
          console.log(process.env.REACT_APP_HOST_IP);

          //const host = "localhost";
          const port = 8000;

          let apiUrl;
          if (process.env.REACT_APP_HOST_IP) {
            apiUrl = `http://${process.env.REACT_APP_HOST_IP}:8000/e-api/v1/kanji?p_tag=${p_tag}`;
          } else {
            apiUrl = `/e-api/v1/kanji?p_tag=${p_tag}`;
          }

          const response = await fetch(`${apiUrl}`);
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`); // Throw error for bad response
          }
          const data: KanjiItem[] = await response.json();
          setKanjiData(data); // Assuming the API returns the array of kanji data
        } catch (error) {
          console.error("Error fetching kanji data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [p_tag]); // Only re-run the effect if p_tag changes

    if (loading) return (
      <div className="flex flex-col items-center py-20 animate-pulse">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl mb-4" />
        <div className="text-neutral-ink font-black uppercase tracking-widest text-xs">Parsing Kanji...</div>
      </div>
    );
    if (error) return <div>Error: {error}</div>;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap justify-center gap-6">
          {kanjiData.map((item, index) => (
            <HiraganaCard
              key={index}
              kanji={item.kanji}
              reading={item.reading}
              k_audio={item.k_audio}
            />
          ))}
        </div>
      </div>
    );
  };

  const TabComponent = () => {
    const [activeTab, setActiveTab] = useState("jlpt n3");

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-12">
          {["JLPT N5", "JLPT N4", "JLPT N3"].map((tab, index) => (
            <button
              key={index}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.toLowerCase()
                ? "bg-white text-neutral-ink  ring-1 ring-slate-200"
                : "text-neutral-ink hover:text-neutral-ink hover:bg-white/50"
                }`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full">
          {activeTab === "jlpt n5" && <KanjiTable p_tag="JLPT_N5" />}
          {activeTab === "jlpt n4" && <KanjiTable p_tag="JLPT_N4" />}
          {activeTab === "jlpt n3" && <KanjiTable p_tag="JLPT_N3" />}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-16 px-6 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-black text-neutral-ink font-display tracking-tight uppercase tracking-[0.2em] mb-4">Quick <span className="text-primary">Kanji</span></h1>
        <div className="max-w-3xl mx-auto bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-slate-600 font-medium text-sm leading-relaxed relative z-10">
            &quot;We are picking a subset of kanji for each JLPT level that has one dominant reading. Use these as anchors to master reading Japanese texts with alphabetical simplicity.&quot;
          </p>
        </div>
      </div>

      <TabComponent />
    </div>
  );
}
