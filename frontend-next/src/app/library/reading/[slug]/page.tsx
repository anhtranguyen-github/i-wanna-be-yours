"use client";

import useSWR from "swr";

import ReadingComponent from "@/components/ReadingComponent";

interface SentenceData {
  japanese: string;
  romanization: string;
  translation: string;
  audioPath: string;
}

interface ReadingData {
  key: string;
  title: string;
  p_tag: string;
  s_tag: string;
  textAudio: string;
  textAudio_1: string;
  japaneseText: string[];
  romanizedText: string[];
  englishTranslation: string[];
  readingVocabulary: string[];
  readingGrammar: string[];
  sentencePayload: SentenceData[];
}



export default function ReadingPage({ params }: { params: { slug: string } }) {
  const fetcher = (...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json());

  let apiUrl;
  if (process.env.REACT_APP_HOST_IP) {
    apiUrl = `http://${process.env.REACT_APP_HOST_IP}:8000/e-api/v1/reading?key=${params.slug}`;
  } else {
    apiUrl = `/e-api/v1/reading?key=${params.slug}`;
  }

  const { data: readingPayload, error } = useSWR(apiUrl, fetcher);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/library/reading"
          className="flex items-center gap-3 text-neutral-ink hover:text-primary transition-all active:scale-95 group w-fit"
        >
          <ArrowLeft size={24} />
          <span className="text-xs font-black uppercase tracking-widest font-display">Back to Stories</span>
        </Link>

        {error ? (
          <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center">
            <div className="w-24 h-24 bg-destructive/5 rounded-2xl flex items-center justify-center mb-8 ">
              <BookOpen className="w-12 h-12 text-destructive/20" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3 font-display">Failed to Load Story</h3>
            <p className="text-neutral-ink font-bold">Please try again later or check your connection.</p>
          </div>
        ) : !readingPayload ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="w-16 h-16 border-4 border-reading border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-xs font-black text-neutral-ink uppercase tracking-widest font-display">Loading Story...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReadingComponent data={readingPayload} />
          </div>
        )}
      </div>
    </div>
  );
}

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";












// Example data conforming to the ReadingData type
// const exampleData: ReadingData = {
//   key: "reading_1",
//   title: "reading 1",
//   p_tag: "JLPT_N2",
//   s_tag: "sci-fi",
//   textAudio: "/audio/japanese/reading/reading_3.mp3",
//   textAudio_1: "/audio/japanese/reading/reading_3.mp3",
//   japaneseText: [
//     "2137年、地球はほとんどの天然資源を使い果たし、",
//     "AeolisがZephyriaに",
//   ],
//   romanizedText: [
//     "2137-nen, Chikyū wa hotondo XXXXXXXXXXXXX",
//     "Aeolis ga Zephyria ni sekkin ",
//   ],
//   englishTranslation: [
//     "In the year 2137, Earth had ",
//     "As the Aeolis approached Zephyria,",
//   ],
//   readingVocabulary: [
//     "天然資源 (てんねんしげん) - Ten'nen shigen - Natural resources",
//     "救済 (きゅうさい) - Kyūsai - Relief or salvation",
//   ],
//   readingGrammar: [
//     "使い果たし - This is the conjugation of th.",
//     "駆り立てました - This is the past tense ofindicates politeness and past tense.",
//   ],
//   sentencePayload: [
//     {
//       japanese: "2137年、地球はほとんどの天然資源を使い果たし。",
//       romanization:
//         "2137-nen, Chikyū wa hotondo no tennen shigen o tsukaihatashi.",
//       translation:
//         "In 2137, Earth had exhausted most of its natural resources.",
//       audioPath: "/audio/japanese/reading_1/r_1.mp3",
//     },
//     {
//       japanese: "人類を宇宙の空間での救済を探るように駆り立てました。",
//       romanization:
//         "Jinrui o uchū no kūkan de no kyūsai o saguru yō ni karitatemashita.",
//       translation:
//         "It compelled humanity to probe the void of space in search of salvation.",
//       audioPath: "/audio/japanese/reading_1/r_2.mp3",
//     },
//   ],
// };















