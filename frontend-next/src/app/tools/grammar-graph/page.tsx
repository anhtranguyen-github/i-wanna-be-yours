"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Info, Cpu, History } from "lucide-react";
import { useUser } from "@/context/UserContext";

import ParseTree from "@/components-parser/ParseTree";
import GrammarExplanationSimple from "@/components-parser/GrammarExplanationSimple";
import { NeuralLabLayout } from "@/components/neural/NeuralLabLayout";
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
        provider: "Hanabira Neural Core",
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error fetching parse tree:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeuralLabLayout
      title="Grammar Graph"
      subtitle="Neural Parsing Engine for Multilingual Syntactic Structural Analysis. Deconstruct any sentence into its fundamental linguistic vectors."
    >
      <div className="space-y-8 relative">
        {/* Guest Lock */}
        {!authLoading && !user && <GuestTeaser toolName="Grammar Graph" />}

        {/* Control Panel */}
        <section className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">
                  Syntactic Input
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-600 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-6 py-4 bg-black border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-jp text-lg"
                    placeholder="Enter sentence for deep analysis..."
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 ml-1">
                  Target Lexicon
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-4 px-4 bg-black border border-neutral-800 rounded-xl text-neutral-300 focus:outline-none focus:border-cyan-500/50"
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
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-black font-black uppercase text-xs tracking-[0.2em] py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Initializng Scan...
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
              <div className="min-h-[600px] bg-black/40 rounded-xl p-8 flex items-center justify-center">
                {data ? (
                  <ParseTree data={data} />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-neutral-700 font-mono text-sm tracking-widest uppercase">Waiting for input...</div>
                    <p className="text-neutral-800 text-xs">Enter a sentence above to generate a syntactic map.</p>
                  </div>
                )}
              </div>
            </AdaptiveScanner>
          </div>

          <div className="space-y-6">
            {/* Metadata Card */}
            {metadata && (
              <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <History size={14} className="text-cyan-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Telemetry</h3>
                </div>
                <div className="font-mono text-[10px] space-y-2">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-500">MODEL</span>
                    <span className="text-cyan-400">{metadata.model}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-neutral-500">CORE</span>
                    <span className="text-cyan-400">{metadata.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">STAMP</span>
                    <span className="text-neutral-300">{metadata.timestamp}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation Card */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-cyan-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Analysis</h3>
              </div>
              <GrammarExplanationSimple sentence={sentence} url={gptGrammarUrl} />
            </div>
          </div>
        </div>
      </div>
    </NeuralLabLayout>
  );
};

export default GrammarGraphPage;
