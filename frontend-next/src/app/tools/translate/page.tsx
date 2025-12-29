"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Languages, Send, Sparkles, ShieldAlert } from 'lucide-react';
import { useUser } from '@/context/UserContext';
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
    <div className="min-h-screen bg-neutral-beige/20 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-beige/95 backdrop-blur-md border-b border-neutral-gray/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/tools" className="p-2 hover:bg-neutral-gray/10 rounded-lg transition-colors">
            <span className="sr-only">Back</span>
            <svg className="w-5 h-5 text-neutral-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-black text-neutral-ink uppercase tracking-widest font-display">Text Translate</h1>
            <p className="text-xs text-neutral-ink/60 font-bold">Linguistic Bridge</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">
        {/* Guest Lock */}
        {!authLoading && !user && <GuestTeaser toolName="Text Translate" />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Side */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Source Polyglot
              </label>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 uppercase font-black tracking-widest">
                <Languages size={12} />
                Auto-Detecting
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="relative w-full h-[400px] p-8 bg-white border border-neutral-gray/20 rounded-[2.5rem] text-neutral-ink font-jp text-lg focus:outline-none focus:border-primary/30 transition-all resize-none shadow-xl shadow-primary/5 placeholder:text-neutral-300"
                placeholder="Enter text to translate..."
              />
            </div>
          </section>

          {/* Output Side */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Intelligence Output
              </label>
              <div className="flex items-center gap-2 text-[10px] text-primary/50 uppercase font-black tracking-widest">
                <Sparkles size={12} />
                Neural Qwen3
              </div>
            </div>

            <AdaptiveScanner isScanning={isThinking} mode="fast">
              <div className="min-h-[400px] bg-white border border-neutral-gray/20 rounded-[2.5rem] p-2 shadow-xl shadow-primary/5 overflow-hidden">
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
        <div className="max-w-4xl mx-auto bg-white border border-neutral-gray/20 p-6 rounded-2xl flex gap-4 items-start translate-y-8 shadow-sm">
          <ShieldAlert className="text-primary shrink-0 mt-1" size={20} />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-neutral-ink uppercase tracking-widest">Lexical Accuracy Disclaimer</h4>
            <p className="text-[11px] text-neutral-ink/60 leading-relaxed font-bold">
              Translations are processed via local neural networks (qwen3:1.7b) and may contain structural hallucinations. Do not rely on this output for critical medical, legal, or high-stakes documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatePage;
