"use client";

import React, { useState } from 'react';
import { Languages, Send, Sparkles, ShieldAlert } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { NeuralLabLayout } from '@/components/neural/NeuralLabLayout';
import { AdaptiveScanner } from '@/components/neural/AdaptiveScanner';
import { GuestTeaser } from '@/components/neural/GuestTeaser';
import UnifiedGptComponent from '@/components-parser/UnifiedGptComponent';

const TranslatePage = () => {
  const { user, loading: authLoading } = useUser();
  const [inputText, setInputText] = useState(
    "日本語または韓国語のテキストを入力してください。\n일본어 또는 한국어 텍스트를 입력하세요."
  );
  const [isThinking, setIsThinking] = useState(false);

  const gptTranslateUrl = '/d-api/v1/translate';

  return (
    <NeuralLabLayout
      title="Text Translate"
      subtitle="Spectral Linguistic Bridge. High-nuance translation between Japanese, Korean, and English utilizing qwen3 neural logic."
    >
      <div className="space-y-8 relative">
        {/* Guest Lock */}
        {!authLoading && !user && <GuestTeaser toolName="Text Translate" />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Side */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                Source Polyglot
              </label>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase font-black tracking-widest">
                <Languages size={12} />
                Auto-Detecting
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-cyan-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="relative w-full h-[400px] p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-200 font-jp text-lg focus:outline-none focus:border-cyan-500/50 transition-all resize-none shadow-2xl"
                placeholder="Enter text to translate..."
              />
            </div>
          </section>

          {/* Output Side */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                Intelligence Output
              </label>
              <div className="flex items-center gap-2 text-[10px] text-cyan-500/50 uppercase font-black tracking-widest">
                <Sparkles size={12} />
                Neural Qwen3
              </div>
            </div>

            <AdaptiveScanner isScanning={isThinking} mode="fast">
              <div className="min-h-[400px] bg-neutral-900/50 border border-neutral-800 rounded-2xl p-2 shadow-2xl overflow-hidden">
                <UnifiedGptComponent
                  japaneseText={inputText}
                  url={gptTranslateUrl}
                  task="translate"
                />
              </div>
            </AdaptiveScanner>
          </section>
        </div>

        {/* Accuracy Disclaimer */}
        <div className="max-w-4xl mx-auto bg-cyan-950/20 border border-cyan-500/20 p-6 rounded-2xl flex gap-4 items-start translate-y-8">
          <ShieldAlert className="text-cyan-400 shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-cyan-100 uppercase tracking-widest">Lexical Accuracy Disclaimer</h4>
            <p className="text-[11px] text-cyan-400/70 leading-relaxed font-light">
              Translations are processed via local neural networks (qwen3:1.7b) and may contain structural hallucinations. Do not rely on this output for critical medical, legal, or high-stakes documentation.
            </p>
          </div>
        </div>
      </div>
    </NeuralLabLayout>
  );
};

export default TranslatePage;
