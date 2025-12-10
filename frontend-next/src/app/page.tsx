import type { Metadata } from "next";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";

import hanabira_text_parser_tokenization from "@public/img/screenshots/hanabira_text_parser_tokenization.png";
import hanabira_youtube_parser from "@public/img/screenshots/hanabira_youtube_parser.png";
import hanabira_jlpt_vocab from "@public/img/screenshots/hanabira_jlpt_vocab.png";
import hanabira_quick_kanji from "@public/img/screenshots/hanabira_quick_kanji.png";
import hanabira_grammar from "@public/img/screenshots/hanabira_grammar.png";
import hanabira_grammar_graph from "@public/img/screenshots/hanabira_grammar_graph.png";
import hanabira_word_relations from "@public/img/screenshots/hanabira_word_relations_dark.png";

import EmailForm from "@/components/EmailForm";
import {
  InboxIcon,
  SparklesIcon,
  ArrowUturnLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentChartBarIcon,
  HeartIcon,
  PencilSquareIcon,
  UsersIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Hanabira.org - Playful Japanese Learning Portal",
  description:
    "Hanabira.org is a Japanese learning portal focused on immersive learning experiences. Join us to enhance your Japanese language skills through effective immersion techniques. Free, Open-Source, allows for Self-Hosting.",
};

const features = [
  {
    name: "YouTube Immersion",
    description: "Enhance learning with engaging video content.",
    icon: InboxIcon,
    color: "bg-brand-blue",
    href: "/tools/text-parser/youtube"
  },
  {
    name: "Text Parser",
    description: "Easily split and tokenize custom texts.",
    icon: DocumentChartBarIcon,
    color: "bg-brand-green",
    href: "/tools/text-parser"
  },
  {
    name: "Grammar Explanation",
    description: "Quick and clear grammar points with examples.",
    icon: ArrowUturnLeftIcon,
    color: "bg-brand-peach",
    href: "/knowledge-base/grammar"
  },
  {
    name: "Vocabulary SRS Cards",
    description: "Effective spaced repetition flashcards with audio.",
    icon: PencilSquareIcon,
    color: "bg-brand-indigo",
    href: "/tools/quick-vocab"
  },
  {
    name: "Vocabulary Mining",
    description: "Discover new words and sentences seamlessly.",
    icon: SparklesIcon,
    color: "bg-brand-softBlue",
    href: "/tools/word-relations"
  },
  {
    name: "Kanji Mnemonics",
    description: "Simplified kanji learning techniques.",
    icon: ChatBubbleLeftEllipsisIcon,
    color: "bg-brand-orange",
    href: "/tools/quick-kanji"
  }
];

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <main>
        {/* Hero Section */}
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-12 sm:pt-16 lg:py-24 bg-gradient-to-br from-slate-50 to-brand-sky/10">
          <div className="container mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-24 items-center">
            <div className="max-w-2xl">
              <div>
                <a href="#" className="inline-flex space-x-4">
                  <span className="rounded-full bg-brand-salmon/10 px-3 py-1 text-sm font-semibold text-brand-salmon border border-brand-salmon">
                    What is new
                  </span>
                  <span className="inline-flex items-center space-x-1 text-sm font-bold text-brand-emerald hover:text-brand-salmon transition-colors">
                    <span>Just shipped Public Alpha v0.3.8</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </a>
              </div>

              <div className="mt-6 sm:max-w-xl">
                <h1 className="text-4xl font-display font-black tracking-tight text-brand-dark sm:text-6xl text-shadow-clay">
                  Your path to <span className="text-brand-salmon">Japanese</span> & <span className="text-brand-sky">Korean</span> fluency
                </h1>

                <div className="mt-6 space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-500">
                    日本語理解への道
                  </h2>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-500">
                    한국어 이해를 위한 길입니다
                  </h2>
                </div>

                <p className="mt-6 text-xl text-gray-600 font-medium">
                  Prepare for JLPT/TOPIK with hanabira.org. Free, Open-Source, and Self-Hostable.
                </p>

                <div className="mt-8 flex gap-4">
                  <a href="/login" className="btnPrimary">Get Started</a>
                  <a href="https://github.com/tristcoil/hanabira.org" target="_blank" className="btnSecondary">GitHub</a>
                </div>
              </div>

              {/* Quick Features List */}
              <div className="mt-12">
                <h3 className="font-bold text-brand-dark text-xl mb-6 flex items-center gap-2">
                  <span className="bg-brand-sky w-8 h-8 rounded-full flex items-center justify-center text-brand-dark">✨</span>
                  Key Features:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="clay-card p-4 flex items-start space-x-3 hover:scale-105 cursor-pointer transition-transform">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${feature.color} flex items-center justify-center shadow-inner`}>
                        <feature.icon className="h-6 w-6 text-brand-dark" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{feature.name}</p>
                        <p className="text-sm text-gray-600 leading-snug">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 max-w-xl">
                <EmailForm />
              </div>

              <div className="mt-8 p-4 bg-brand-dark rounded-clay text-white shadow-clay">
                <p className="font-bold text-lg mb-2">Easily Self-Host with Docker:</p>
                <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono text-brand-green">
                    git clone https://github.com/tristcoil/hanabira.org.git{'\n'}
                    cd hanabira.org{'\n'}
                    docker-compose up
                  </code>
                </pre>
              </div>
            </div>

            {/* Right Side Image */}
            <div className="hidden lg:block relative">
              <div className="clay-card p-4 bg-white border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  alt="hanabira_text_parser_tokenization"
                  className="w-full h-auto rounded-xl shadow-inner"
                  src={hanabira_text_parser_tokenization}
                  priority
                />
              </div>
              <div className="absolute -bottom-10 -left-10 clay-card p-4 bg-white border-4 border-white -rotate-3 hover:rotate-0 transition-transform duration-500 w-2/3 z-10">
                <Image
                  alt="hanabira grammar graph"
                  className="w-full h-auto rounded-xl"
                  src={hanabira_grammar_graph}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Sections */}
        {/* We can keep the detailed sections but style them with claymorphism containers */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-display font-bold text-brand-dark mb-4">Deep Dive into Learning</h2>
              <p className="text-xl text-gray-600">Explore our advanced tools designed to make Japanese immersion effective and fun.</p>
            </div>

            {/* Feature 1: Text Parser */}
            <div className="clay-card p-8 lg:p-12 mb-12 bg-white flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="inline-block p-3 rounded-2xl bg-brand-green shadow-clay-sm mb-6 rotate-3">
                  <DocumentChartBarIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">Master Japanese Texts</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Input any Japanese text and get instant tokenization, dictionary lookups, and grammar analysis. Perfect for reading practice.
                </p>
                <a href="/tools/text-parser" className="clay-button bg-brand-green text-brand-dark px-6 py-3 inline-block hover:bg-brand-green/80">Try Text Parser</a>
              </div>
              <div className="lg:w-1/2">
                <Image src={hanabira_text_parser_tokenization} alt="Text Parser" className="rounded-xl shadow-clay-md hover:scale-105 transition-transform" />
              </div>
            </div>

            {/* Feature 2: Youtube */}
            <div className="clay-card p-8 lg:p-12 mb-12 bg-white flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="inline-block p-3 rounded-2xl bg-brand-orange shadow-clay-sm mb-6 -rotate-3">
                  <InboxIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">YouTube Immersion</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Learn directly from your favorite YouTubers. Parse subtitles, click words for definitions, and save them for review.
                </p>
                <a href="/tools/text-parser/youtube" className="clay-button bg-brand-orange text-white px-6 py-3 inline-block hover:bg-brand-orange/80">Start Immersion</a>
              </div>
              <div className="lg:w-1/2">
                <Image src={hanabira_youtube_parser} alt="YouTube Parser" className="rounded-xl shadow-clay-md hover:scale-105 transition-transform" />
              </div>
            </div>

            {/* Feature 3: Grammar Graph */}
            <div className="clay-card p-8 lg:p-12 mb-12 bg-white flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="inline-block p-3 rounded-2xl bg-brand-peach shadow-clay-sm mb-6 rotate-2">
                  <ArrowUturnLeftIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">Visual Grammar Graphs</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Don't just read grammar—see it! Our AI-powered graphs visualize sentence structures to help you understand complex syntax.
                </p>
                <a href="/tools/grammar-graph" className="clay-button bg-brand-peach text-brand-dark px-6 py-3 inline-block hover:bg-brand-peach/80">Explore Grammar</a>
              </div>
              <div className="lg:w-1/2">
                <Image src={hanabira_grammar_graph} alt="Grammar Graph" className="rounded-xl shadow-clay-md hover:scale-105 transition-transform" />
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
