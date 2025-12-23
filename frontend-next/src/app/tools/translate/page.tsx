'use client';

// pages/translate.js

import { useState } from 'react';
import UnifiedGptComponent from '@/components-parser/UnifiedGptComponent';  // Adjust the path as necessary

const TranslatePage = () => {
  const [inputText, setInputText] = useState(
    "日本語または韓国語のテキストを入力してください。\n일본어 또는 한국어 텍스트를 입력하세요."
  );

  const gptTranslateUrl = '/d-api/v1/translate';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase tracking-[0.2em] mb-4">
            Text <span className="text-primary">Translate</span>
          </h1>
          <p className="text-slate-500 font-medium">Linguistic Bridge for Japanese & Korean</p>
        </div>

        <div className="clay-card bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Source Polyglot</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-emerald-100 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="relative w-full h-48 p-8 rounded-[2rem] bg-white border border-slate-100 text-lg font-jp focus:outline-none focus:ring-0 focus:border-primary/30 transition-all shadow-inner text-slate-800"
                placeholder="Enter text to translate..."
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 ml-2 mb-6 block">Intelligence Output</label>
            <UnifiedGptComponent
              japaneseText={inputText}
              url={gptTranslateUrl}
              task="translate"
            />
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <div className="flex gap-3">
              <div className="p-2 bg-white rounded-lg text-primary shadow-sm h-fit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
                  <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Lexical Accuracy Disclaimer</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Translations are processed via neural networks and may contain structural nuances. Do not use for high-stakes medical or legal documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatePage;
