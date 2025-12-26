import React, { useState } from "react";
import { Headphones } from "lucide-react";

import TextWithTranslation from "@/components/TextWithTranslation";
import AudioPlayer from "@/components/AudioPlayer";

// Define the structure of the JSON data as TypeScript types
interface SentenceData {
  japanese: string;
  romanization: string;
  translation: string;
  audioPath: string;
  audioPathEn: string;
}

interface ReadingData {
  key: string;
  title: string;
  titleRomaji: string;
  titleJp: string;
  p_tag: string;
  s_tag: string;
  textAudio: string;
  textAudio_1: string;
  textAudioEn: string;
  textAudioEn_1: string;
  japaneseText: string[];
  romanizedText: string[];
  englishTranslation: string[];
  readingVocabulary: string[];
  readingVocabularyEn: string[];
  readingGrammar: string[];
  readingGrammarEn: string[];
  sentencePayload: SentenceData[];
}

type ReadingComponentProps = {
  data: ReadingData;
};

type Tab = {
  name: string;
  key: string;
};

const ReadingComponent: React.FC<ReadingComponentProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState("japaneseText");
  const [isEnglishSpeaker, setisEnglishSpeaker] = useState(true);

  const tabs: Tab[] = [
    { name: "Japanese", key: "japaneseText" },
    { name: "Romanized", key: "romanizedText" },
    { name: "English", key: "englishTranslation" },
    { name: "Combined", key: "combined" },
    { name: "Vocabulary", key: "readingVocabulary" },
    { name: "Grammar", key: "readingGrammar" },
    { name: "Sentences", key: "sentencePayload" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border  p-8 md:p-12 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-foreground font-display leading-tight">{data.title}</h1>
          <div className="space-y-1">
            <p className="text-xs font-black text-neutral-ink uppercase tracking-widest font-display">{data.titleRomaji}</p>
            <p className="text-2xl font-bold text-reading font-jp">{data.titleJp}</p>
          </div>
        </div>
        <button
          onClick={() => setisEnglishSpeaker(!isEnglishSpeaker)}
          className="flex items-center gap-3 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-black rounded-xl transition-all active:scale-95  font-display uppercase tracking-widest text-[10px]"
        >
          {isEnglishSpeaker ? (
            <>
              <span className="w-2 h-2 rounded-full bg-reading animate-pulse"></span>
              日本語で表示
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Show in English
            </>
          )}
        </button>
      </div>

      {/* Audio Player Section */}
      <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 ">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-reading/10 text-reading rounded-xl">
            <Headphones size={20} />
          </div>
          <h2 className="text-xs font-black text-foreground uppercase tracking-widest font-display">Listen to the Story</h2>
        </div>
        <AudioPlayer src={isEnglishSpeaker ? data.textAudio : data.textAudioEn} />
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 bg-muted rounded-2xl border border-border/50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 min-w-[100px] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all font-display rounded-xl ${activeTab === tab.key
              ? "bg-card text-reading "
              : "text-neutral-ink hover:text-foreground"
              }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4 min-h-[300px] animate-in fade-in duration-500">
        {activeTab === "japaneseText" && (
          <div className="space-y-8 py-4">
            {data.japaneseText.map((text, index) => (
              <p
                key={index}
                className="text-2xl font-bold text-foreground leading-[1.8] font-jp"
              >
                {text}
              </p>
            ))}
          </div>
        )}

        {activeTab === "romanizedText" && (
          <div className="space-y-6 py-4">
            {data.romanizedText.map((text, index) => (
              <p key={index} className="text-lg font-bold text-neutral-ink leading-relaxed italic">
                {text}
              </p>
            ))}
          </div>
        )}

        {activeTab === "englishTranslation" && (
          <div className="space-y-6 py-4">
            {data.englishTranslation.map((text, index) => (
              <p key={index} className="text-lg font-bold text-foreground leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        )}

        {activeTab === "combined" && (
          <div className="grid grid-cols-1 gap-8 py-4">
            <div className="bg-muted/20 p-8 rounded-2xl border border-border/50">
              <h2 className="text-xs font-black text-reading/50 uppercase tracking-[0.2em] font-display mb-6">Japanese</h2>
              <div className="space-y-4">
                {data.japaneseText.map((paragraph, index) => (
                  <p key={index} className="text-xl font-bold text-foreground leading-relaxed font-jp">{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="bg-muted/20 p-8 rounded-2xl border border-border/50">
              <h2 className="text-xs font-black text-neutral-ink uppercase tracking-[0.2em] font-display mb-6">Translation</h2>
              <div className="space-y-4">
                {data.englishTranslation.map((paragraph, index) => (
                  <p key={index} className="text-lg font-bold text-neutral-ink leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "readingVocabulary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {(isEnglishSpeaker ? data.readingVocabulary : data.readingVocabularyEn).map((entry, index) => {
              const [firstWord, ...rest] = entry.split(" ");
              return (
                <div key={index} className="p-6 bg-muted/20 rounded-2xl border border-border/50 group/item hover:bg-reading/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl font-black text-reading font-jp group-hover/item:scale-110 transition-transform">
                      {firstWord}
                    </span>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-bold text-foreground leading-relaxed">
                        {rest.join(" ")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "readingGrammar" && (
          <div className="space-y-6 py-4">
            {(isEnglishSpeaker ? data.readingGrammar : data.readingGrammarEn).map((rule, index) => {
              const [firstWord, ...rest] = rule.split(" ");
              return (
                <div key={index} className="p-8 bg-card rounded-2xl border border-border  relative overflow-hidden group/grammar hover:border-reading/30 transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-reading/20 group-hover:bg-reading transition-colors"></div>
                  <div className="space-y-4 ml-2">
                    <span className="text-2xl font-black text-reading font-jp block">
                      {firstWord}
                    </span>
                    <p className="text-base font-bold text-foreground leading-relaxed">
                      {rest.join(" ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "sentencePayload" && (
          <div className="py-4">
            <TextWithTranslation
              sentences={data.sentencePayload}
              isEnglishSpeaker={isEnglishSpeaker}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingComponent;