"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Search, Info, Cpu, History, Network } from "lucide-react";
import { useUser } from "@/context/UserContext";

import ParseTree from "@/components-parser/ParseTree";
import GrammarExplanationSimple from "@/components-parser/GrammarExplanationSimple";
import { AdaptiveScanner } from "@/components/neural/AdaptiveScanner";
import { GuestTeaser } from "@/components/neural/GuestTeaser";

const gptGrammarUrl = "/d-api/v1/grammar";

const GrammarGraphPage = () => {
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState<any>(null);
  const [sentence, setSentence] = useState("");
  const [language, setLanguage] = useState("Japanese");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const exampleSentences: Record<string, string> = {
    Japanese: "私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。",
    Korean: "저는 비 오는 일요일 오후에 둠 메탈을 듣는 것을 좋아해요.",
    English: "I like listening to doom metal on rainy Sunday afternoons.",
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const querySentence = params.get("sentence");
      const queryLanguage = params.get("language");

      if (queryLanguage) {
        setLanguage(queryLanguage.charAt(0).toUpperCase() + queryLanguage.slice(1).toLowerCase());
      }

      if (querySentence) {
        setSentence(querySentence);
      } else {
        setSentence(exampleSentences[language] || exampleSentences["Japanese"]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim() || loading) return;

    setLoading(true);
    try {
      const response = await axios.post("/d-api/v1/parse-tree", {
        text: sentence, // Key adjusted to match new backend
        language,
      });

      setData(response.data);
      setMetadata({
        model: "qwen3:1.7b",
        provider: "Hanachan Neural Core",
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error fetching parse tree:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-beige/20 pb-24">
      <div className="sticky top-0 z-40 bg-neutral-beige/95 backdrop-blur-md border-b border-neutral-gray/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/tools" className="p-2 hover:bg-neutral-gray/10 rounded-lg transition-colors">
            <span className="sr-only">Back</span>
            <svg className="w-5 h-5 text-neutral-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-black text-neutral-ink uppercase tracking-widest font-display">Grammar Graph</h1>
            <p className="text-xs text-neutral-ink/60 font-bold">Syntactic structural analysis</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">
        {/* Guest Lock */}
        {!authLoading && !user && <GuestTeaser toolName="Grammar Graph" />}

        {/* Control Panel */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-neutral-gray/20 shadow-xl shadow-primary/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-1">
                  Syntactic Input
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-ink focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-jp text-lg placeholder:text-neutral-400"
                    placeholder="Enter sentence for deep analysis..."
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-1">
                  Target Lexicon
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-4 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-ink focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option>Japanese</option>
                  <option>Korean</option>
                  <option>English</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !user}
              className="w-full bg-primary hover:bg-primary-strong disabled:opacity-50 text-white font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transform active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Structure...
                </>
              ) : (
                <>
                  <Cpu size={16} />
                  Execute Deconstruction
                </>
              )}
            </button>
          </form>
        </section>

        {/* Result Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <AdaptiveScanner isScanning={loading} mode="deep">
              <div className="min-h-[600px] bg-white rounded-[2.5rem] border border-neutral-gray/20 shadow-xl shadow-primary/5 p-8 flex items-center justify-center overflow-hidden relative">
                {/* Subtle grid background for graph area */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                {data ? (
                  <ParseTree data={data} />
                ) : (
                  <div className="text-center space-y-4 z-10">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Network size={32} className="text-neutral-300" />
                    </div>
                    <div className="text-neutral-400 font-bold text-xs tracking-widest uppercase">Waiting for input</div>
                    <p className="text-neutral-500 text-xs">Enter a sentence above to generate a syntactic map.</p>
                  </div>
                )}
              </div>
            </AdaptiveScanner>
          </div>

          <div className="space-y-6">
            {/* Metadata Card */}
            {metadata && (
              <div className="bg-white border border-neutral-gray/20 rounded-[2rem] p-6 shadow-lg shadow-neutral-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <History size={14} className="text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Telemetry</h3>
                </div>
                <div className="font-mono text-[10px] space-y-3">
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-400">MODEL</span>
                    <span className="text-primary-strong font-bold">{metadata.model}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span className="text-neutral-400">CORE</span>
                    <span className="text-primary-strong font-bold">{metadata.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">STAMP</span>
                    <span className="text-neutral-600">{metadata.timestamp}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation Card */}
            <div className="bg-white border border-neutral-gray/20 rounded-[2rem] p-6 shadow-lg shadow-neutral-200/50 h-fit">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Analysis</h3>
              </div>
              <div className="text-neutral-ink">
                <GrammarExplanationSimple sentence={sentence} url={gptGrammarUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarGraphPage;
