import type { Metadata } from "next";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";

import hanachan_text_parser_tokenization from "../../../public/img/screenshots/hanabira_text_parser_tokenization.png";
import hanachan_youtube_parser from "../../../public/img/screenshots/hanabira_youtube_parser.png";
import hanachan_grammar_graph from "../../../public/img/screenshots/hanabira_grammar_graph.png";

import EmailForm from "@/components/EmailForm";
import { FeatureIconGrid, defaultFeatures } from "@/components/shared/FeatureIconGrid";
import { CTAButton } from "@/components/shared/CTAButton";
import {
    DocumentChartBarIcon,
    InboxIcon,
    ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
    title: "hanachan.org - Playful Japanese Learning Portal",
    description:
        "hanachan.org is a Japanese learning portal focused on immersive learning experiences. Join us to enhance your Japanese language skills through effective immersion techniques. Free, Open-Source, allows for Self-Hosting.",
};

export default function LandingPage() {
    return (
        <div className="bg-background min-h-screen">
            <main>
                {/* Hero Section */}
                <div className="relative overflow-hidden pt-12 sm:pt-16 lg:py-24 bg-gradient-to-br from-slate-50 to-brand-softBlue/20">
                    <div className="container mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-24 items-center">
                        <div className="max-w-2xl">
                            <div>
                                <a href="#" className="inline-flex space-x-4">
                                    <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-semibold text-brand-green border border-brand-green">
                                        What is new
                                    </span>
                                    <span className="inline-flex items-center space-x-1 text-sm font-bold text-brand-green hover:text-brand-dark transition-colors">
                                        <span>Just shipped Public Alpha v0.3.8</span>
                                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                </a>
                            </div>

                            <div className="mt-6 sm:max-w-xl">
                                <h1 className="text-4xl font-display font-black tracking-tight text-brand-dark sm:text-6xl">
                                    Your path to <span className="text-brand-green">Japanese</span> & <span className="text-brand-peach">Korean</span> fluency
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
                                    Prepare for JLPT/TOPIK with hanachan.org. Free, Open-Source, and Self-Hostable.
                                </p>

                                <div className="mt-8 flex gap-4">
                                    <CTAButton variant="primary" href="/chat">
                                        Get Started
                                    </CTAButton>
                                    <CTAButton variant="secondary" href="https://github.com/tristcoil/hanachan.org">
                                        GitHub
                                    </CTAButton>
                                </div>
                            </div>

                            {/* Quick Features List */}
                            <div className="mt-12">
                                <h3 className="font-bold text-brand-dark text-xl mb-6 flex items-center gap-2">
                                    <span className="bg-brand-green w-8 h-8 rounded-full flex items-center justify-center text-white">✨</span>
                                    Key Features:
                                </h3>
                                <FeatureIconGrid features={defaultFeatures} maxItems={6} />
                            </div>

                            <div className="mt-12 max-w-xl">
                                <EmailForm />
                            </div>

                            <div className="mt-8 p-4 bg-brand-dark rounded-2xl text-white">
                                <p className="font-bold text-lg mb-2">Easily Self-Host with Docker:</p>
                                <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto">
                                    <code className="text-sm font-mono text-brand-green">
                                        git clone https://github.com/tristcoil/hanachan.org.git{'\n'}
                                        cd hanachan.org{'\n'}
                                        docker-compose up
                                    </code>
                                </pre>
                            </div>
                        </div>

                        {/* Right Side Image */}
                        <div className="hidden lg:block relative">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 rotate-2 hover:rotate-0 transition-transform duration-500">
                                <Image
                                    alt="hanachan_text_parser_tokenization"
                                    className="w-full h-auto rounded-xl"
                                    src={hanachan_text_parser_tokenization}
                                    priority
                                />
                            </div>
                            <div className="absolute -bottom-10 -left-10 bg-white p-4 rounded-2xl border border-slate-200 -rotate-3 hover:rotate-0 transition-transform duration-500 w-2/3 z-10">
                                <Image
                                    alt="hanachan grammar graph"
                                    className="w-full h-auto rounded-xl"
                                    src={hanachan_grammar_graph}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deep Dive Sections */}
                <section className="py-20 relative overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl font-display font-bold text-brand-dark mb-4">Deep Dive into Learning</h2>
                            <p className="text-xl text-gray-600">Explore our advanced tools designed to make Japanese immersion effective and fun.</p>
                        </div>

                        {/* Feature 1: Text Parser */}
                        <div className="bg-white p-8 lg:p-12 mb-12 rounded-2xl border border-slate-100 flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2">
                                <div className="inline-block p-3 rounded-2xl bg-brand-green mb-6 rotate-3">
                                    <DocumentChartBarIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">Master Japanese Texts</h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    Input any Japanese text and get instant tokenization, dictionary lookups, and grammar analysis. Perfect for reading practice.
                                </p>
                                <CTAButton variant="primary" href="/tools/text-parser">
                                    Try Text Parser
                                </CTAButton>
                            </div>
                            <div className="lg:w-1/2">
                                <Image src={hanachan_text_parser_tokenization} alt="Text Parser" className="rounded-xl border border-slate-200 hover:scale-105 transition-transform" />
                            </div>
                        </div>

                        {/* Feature 2: Youtube */}
                        <div className="bg-white p-8 lg:p-12 mb-12 rounded-2xl border border-slate-100 flex flex-col lg:flex-row-reverse items-center gap-12">
                            <div className="lg:w-1/2">
                                <div className="inline-block p-3 rounded-2xl bg-brand-peach mb-6 -rotate-3">
                                    <InboxIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">YouTube Immersion</h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    Learn directly from your favorite YouTubers. Parse subtitles, click words for definitions, and save them for review.
                                </p>
                                <CTAButton variant="primary" href="/tools/text-parser/youtube">
                                    Start Immersion
                                </CTAButton>
                            </div>
                            <div className="lg:w-1/2">
                                <Image src={hanachan_youtube_parser} alt="YouTube Parser" className="rounded-xl border border-slate-200 hover:scale-105 transition-transform" />
                            </div>
                        </div>

                        {/* Feature 3: Grammar Graph */}
                        <div className="bg-white p-8 lg:p-12 mb-12 rounded-2xl border border-slate-100 flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2">
                                <div className="inline-block p-3 rounded-2xl bg-brand-blue mb-6 rotate-2">
                                    <ArrowUturnLeftIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-brand-dark mb-4">Visual Grammar Graphs</h3>
                                <p className="text-lg text-gray-600 mb-6">
                                    Don't just read grammar—see it! Our AI-powered graphs visualize sentence structures to help you understand complex syntax.
                                </p>
                                <CTAButton variant="primary" href="/tools/grammar-graph">
                                    Explore Grammar
                                </CTAButton>
                            </div>
                            <div className="lg:w-1/2">
                                <Image src={hanachan_grammar_graph} alt="Grammar Graph" className="rounded-xl border border-slate-200 hover:scale-105 transition-transform" />
                            </div>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
}
