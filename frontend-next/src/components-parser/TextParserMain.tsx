"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

// Components
import DictionaryEntryWrapper from "@/components-parser/DictionaryEntryWrapper";
import KanjiDisplay from "@/components-parser/KanjiDisplay";
import CreateReadingFlashcard from "@/components-parser/CreateReadingFlashcard";
import RadicalInfo from "@/components-parser/RadicalInfo";
import UnifiedGptComponent from "@/components-parser/UnifiedGptComponent";
import KuroShiroPropsConverter from "@/components-parser/KuroShiroPropsConverter";
import WordDetailsSidebar from "@/components-parser/WordDetailsSidebar";
import DisplayHoveredWord from "@/components-parser/DisplayHoveredWord";
import DisplaySentence from "@/components-parser/DisplaySentence";
import DisplaySentenceV2 from "@/components-parser/DisplaySentenceV2";
import DisplayWord from "@/components-parser/DisplayWord";
import JapaneseTextParser from "@/components-parser/JapaneseTextParser";
import GrammarExplanation from "@/components-parser/GrammarExplanation";
import ExampleVideos from "@/components-parser/ExampleVideos";
import SubtitleInfo from "@/components-parser/SubtitleInfo";
import Disclaimer from "@/components-parser/Disclaimer";
import YouTubeUrlInputForm from "@/components-parser/YouTubeUrlInputForm";
import SubtitlesAccordion from "@/components-parser/SubtitlesAccordion";
import TextFormattingOptions from "@/components-parser/TextFormattingOptions";
import YouTubeComponent from "@/components-parser/YouTubeComponent";
import SubtitleUploader from "@/components-parser/SubtitleUploader";
import Tabs from "@/components-parser/Tabs";
import Tab from "@/components-parser/Tab";
import { useUser } from "@/context/UserContext";

interface Word {
    original: string;
    dictionary: string;
    furigana: string;
    status: string;
}

interface WordDetails {
    original: string;
    dictionary: string;
    furigana: string;
    status: string;
}

interface TextParserMainProps {
    initialMode?: 'text' | 'youtube';
}

export default function TextParserMain({ initialMode = 'text' }: TextParserMainProps) {
    // --- Global State & Params ---
    const searchParams = useSearchParams();
    const typeParam = searchParams.get("type");
    const urlParam = searchParams.get("url");
    const { user } = useUser();
    const userId = user?.id ? user.id.toString() : null;

    // --- Parser State ---
    // Default to initialMode
    const [parserMode, setParserMode] = useState<'text' | 'youtube'>(initialMode);

    // --- Text Input State ---
    const [inputText, setInputText] = useState(
        `
    Example Japanese text (Iroha poem):
    
    いろは歌

    色は匂えど
    散りぬるを
    我が世誰ぞ
    常ならん
    有為の奥山
    今日越えて
    浅き夢見じ
    酔いもせず
  `
    );
    const [revisionCount, setRevisionCount] = useState(0);
    const [inputMode, setInputMode] = useState(`lyrics`); // 'book' or 'lyrics'

    // --- YouTube State ---
    const [inputUrl, setInputUrl] = useState<string>("");
    const [finalInputUrl, setFinalInputUrl] = useState<string>("");
    const [japaneseSubtitles, setJapaneseSubtitles] = useState([]);
    const [japaneseSubtitlesPlainText, setJapaneseSubtitlesPlainText] = useState("");
    const [englishSubtitles, setEnglishSubtitles] = useState([]);
    const [englishSubtitlesPlainText, setEnglishSubtitlesPlainText] = useState("");
    const [currentJapaneseSubtitle, setCurrentJapaneseSubtitle] = useState<string>("");
    const [currentEnglishSubtitle, setCurrentEnglishSubtitle] = useState<string>("");
    const [currentCustomSubtitle, setCurrentCustomSubtitle] = useState<string>("");

    // --- Interaction State ---
    const [clickedWord, setClickedWord] = useState<string | null>(null);
    const [clickedWordDictForm, setClickedWordDictForm] = useState<string | null>(null);
    const [hoveredWord, setHoveredWord] = useState<string | null>(null);
    const [hoveredSentence, setHoveredSentence] = useState<Word[] | null>(null);
    const [clickedWordSentence, setClickedWordSentence] = useState<Word[] | null>(null);
    const [clickedWordDetails, setClickedWordDetails] = useState<WordDetails | null>(null);

    // --- Side Effects ---
    useEffect(() => {
        // If typeParam is explicitly present (legacy link), respect it, but only if it differs?
        // Actually, we want to respect the prop first if it's "youtube".
        // But if we are on the base page and ?type=youtube is present, we should switch?
        // User wants clean routes. So we assume they arrive at the correct route.
        // However, if we want to support old links:
        if (typeParam === "youtube") {
            setParserMode("youtube");
        }
        // Note: Do not override if no param, keep initialMode.

        if (typeParam === "youtube" && urlParam) {
            setInputUrl(urlParam);
        }
    }, [typeParam, urlParam]);

    useEffect(() => {
        if (finalInputUrl) {
            fetchSubtitles(finalInputUrl, "ja", setJapaneseSubtitles, setJapaneseSubtitlesPlainText);
            fetchSubtitles(finalInputUrl, "en", setEnglishSubtitles, setEnglishSubtitlesPlainText);
        }
    }, [finalInputUrl]);

    useEffect(() => {
        if (japaneseSubtitlesPlainText) {
            setInputText(japaneseSubtitlesPlainText); // Sync subtitles to main text for parsers
        }
    }, [japaneseSubtitlesPlainText]);


    // --- API Endpoints ---
    const extractKanjiUrl = "/d-api/v1/extract-kanji";
    const kanjiUrl = "/d-api/v1/kanji";
    // const mecabApiUrl = "/d-api/v1/parse-split"; 
    const convertAllUrl = "/d-api/v1/convert/all";
    const deeplUrl = "/d-api/v1/deepl-translate";
    const simpleVocabUrl = "/d-api/v1/simple-vocabulary";
    const convertHiraganaUrl = "/d-api/v1/convert/hiragana";
    const furiganaUrl = "/d-api/v1/convert/all";
    const radicalUrl = "/d-api/v1/radical-info";
    const gptGrammarUrl = "/d-api/v1/grammar";
    const gptTranslateUrl = "/d-api/v1/translate";
    const gptTranslateSbSUrl = "/d-api/v1/translate-side-by-side";
    const gptSummaryUrl = "/d-api/v1/summary";
    const gptSentimentUrl = "/d-api/v1/sentiment";
    const userVocabUrl = "/f-api/v1/user-vocabulary";
    const storeVocabUrl = "/f-api/v1/store-vocabulary-data";


    // --- Handlers ---
    const handleModeChange = (event: any) => setInputMode(event.target.value);
    const handleInputChange = (e: any) => setInputText(e.target.value);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setRevisionCount((prev) => prev + 1);
    };

    const handleSubtitleUpdate = (ja: string, en: string, custom: string) => {
        setCurrentJapaneseSubtitle(ja);
        setCurrentEnglishSubtitle(en);
        setCurrentCustomSubtitle(custom);
    };

    const fetchSubtitles = async (url: string, lang: string, setSub: any, setPlain: any) => {
        try {
            const response = await axios.get(`/d-api/v1/get-transcript?url=${url}&lang=${lang}`);
            const formatted = response.data.transcript ? response.data.transcript.map((sub: any) => ({
                time: new Date(sub.offset * 1000).toISOString().substr(11, 8),
                text: sub.text,
            })) : [];
            setSub(formatted);
            setPlain(formatted.map((s: any) => s.text).join("\n"));
        } catch (error) {
            console.error(`Failed to fetch ${lang} subtitles:`, error);
        }
    };


    // --- UI ---
    // Layout Logic: 
    // - Small screens: Stacked (Input -> Output -> Details)
    // - Large screens: 2 columns (Input+Output | Details Sticky)

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            {/* HEADER */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase tracking-[0.1em]">
                        Text <span className="text-primary">Parser</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Advanced Reading Intelligence & Linguistic Analysis</p>
                </div>
                {userId && (
                    <div className="px-6 py-2.5 bg-white rounded-2xl border border-slate-200 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Intelligence Agent: {userId}
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Input & Main Output (8 cols) */}
                <div className="lg:col-span-8 flex flex-col space-y-8">

                    {/* MODE SWITCHER */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5 overflow-hidden">
                        <div className="flex bg-slate-50/50 p-2 gap-2">
                            <button
                                onClick={() => setParserMode('text')}
                                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${parserMode === 'text' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                            >
                                Custom Lexicon
                            </button>
                            <button
                                onClick={() => setParserMode('youtube')}
                                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${parserMode === 'youtube' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                            >
                                YouTube Intelligence
                            </button>
                        </div>

                        <div className="p-10">
                            {parserMode === 'text' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Disclaimer />
                                    <div className="">
                                        <TextFormattingOptions inputMode={inputMode} handleModeChange={handleModeChange} />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-emerald-100 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                                        <textarea
                                            value={inputText}
                                            onChange={handleInputChange}
                                            className="relative w-full h-64 p-8 rounded-[2rem] bg-white border border-slate-100 text-lg font-jp focus:outline-none focus:ring-0 focus:border-primary/30 transition-all resize-y shadow-inner text-slate-800"
                                            placeholder="Paste Japanese text for deep analysis..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                        >
                                            Deconstruct Text
                                        </button>
                                    </div>
                                </form>
                            )}

                            {parserMode === 'youtube' && (
                                <div className="space-y-8">
                                    <SubtitleInfo />
                                    <YouTubeUrlInputForm
                                        inputUrl={inputUrl}
                                        setInputUrl={setInputUrl}
                                        setFinalInputUrl={setFinalInputUrl}
                                    />
                                    {finalInputUrl && (
                                        <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl">
                                            <YouTubeComponent
                                                videoUrl={finalInputUrl}
                                                onSubtitleUpdate={handleSubtitleUpdate}
                                            />
                                        </div>
                                    )}
                                    <SubtitleUploader url={inputUrl} />

                                    {/* Current subtitle parser section */}
                                    <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                                        <p className="font-black text-[10px] uppercase tracking-[0.15em] text-primary/60 mb-6 relative z-10">Live Stream Analysis:</p>
                                        {userId ? (
                                            <div className="relative z-10">
                                                <JapaneseTextParser
                                                    inputText={currentJapaneseSubtitle}
                                                    inputMode={inputMode}
                                                    revisionCount={revisionCount}
                                                    userId={userId}
                                                    setClickedWord={setClickedWord}
                                                    setClickedWordDictForm={setClickedWordDictForm}
                                                    setHoveredWord={setHoveredWord}
                                                    setHoveredSentence={setHoveredSentence}
                                                    setClickedWordSentence={setClickedWordSentence}
                                                    setClickedWordDetails={setClickedWordDetails}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-red-500 font-black text-sm relative z-10">Authentication Required for Live Parser.</p>
                                        )}
                                    </div>

                                    <SubtitlesAccordion
                                        japaneseSubtitlesPlainText={japaneseSubtitlesPlainText}
                                        englishSubtitlesPlainText={englishSubtitlesPlainText}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* OUTPUT TABS Area */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                        <Tabs>
                            <Tab label="Mecab Parser">
                                <div className="p-4 leading-relaxed bg-slate-50/50 rounded-2xl min-h-[400px]">
                                    <JapaneseTextParser
                                        inputText={inputText}
                                        inputMode={inputMode}
                                        revisionCount={revisionCount}
                                        userId={userId}
                                        setClickedWord={setClickedWord}
                                        setClickedWordDictForm={setClickedWordDictForm}
                                        setHoveredWord={setHoveredWord}
                                        setHoveredSentence={setHoveredSentence}
                                        setClickedWordSentence={setClickedWordSentence}
                                        setClickedWordDetails={setClickedWordDetails}
                                    />
                                </div>
                            </Tab>
                            <Tab label="Kuroshiro">
                                <div className="p-4"><KuroShiroPropsConverter text={inputText} url={convertAllUrl} /></div>
                            </Tab>
                            <Tab label="Translate">
                                <div className="p-4"><UnifiedGptComponent japaneseText={inputText} url={gptTranslateUrl} task="translate" /></div>
                            </Tab>
                            <Tab label="Side-by-Side">
                                <div className="p-4"><UnifiedGptComponent japaneseText={inputText} url={gptTranslateSbSUrl} task="translate" /></div>
                            </Tab>
                            <Tab label="Summary">
                                <div className="p-4"><UnifiedGptComponent japaneseText={inputText} url={gptSummaryUrl} task="summarize" /></div>
                            </Tab>
                            <Tab label="Sentiment">
                                <div className="p-4"><UnifiedGptComponent japaneseText={inputText} url={gptSentimentUrl} task="analyzeSentiment" /></div>
                            </Tab>
                        </Tabs>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-8 max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-primary/5 p-8">
                        <Tabs>
                            <Tab label="Lexicon">
                                {clickedWordDetails ? (
                                    <WordDetailsSidebar
                                        clickedWordDetails={clickedWordDetails}
                                        userId={userId}
                                        url0={userVocabUrl}
                                        url1={simpleVocabUrl}
                                        setRevisionCount={setRevisionCount}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-300 min-h-[400px]">
                                        <div className="text-8xl mb-8 opacity-10">?</div>
                                        <p className="text-center font-black text-[10px] uppercase tracking-widest leading-loose">Select a word in the parser<br />to initialize deep analysis</p>
                                    </div>
                                )}
                            </Tab>
                            <Tab label="Flashcard">
                                <div className="p-4 pt-8">
                                    <CreateReadingFlashcard
                                        word={clickedWord}
                                        wordDictForm={clickedWordDictForm}
                                        sentence={clickedWordSentence}
                                        userId={userId}
                                        url0={deeplUrl}
                                        url1={simpleVocabUrl}
                                        url2={convertHiraganaUrl}
                                        url3={storeVocabUrl}
                                        url4={gptTranslateUrl}
                                    />
                                </div>
                            </Tab>
                            <Tab label="Grammar">
                                <div className="p-4 pt-8">
                                    <GrammarExplanation
                                        word={clickedWord}
                                        sentence={clickedWordSentence}
                                        url={gptGrammarUrl}
                                    />
                                </div>
                            </Tab>
                            <Tab label="Telemetry">
                                <div className="space-y-10 p-4 pt-8">
                                    <section>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 pb-2 border-b border-slate-50">Hover State</h3>
                                        <DisplayHoveredWord hoveredWord={hoveredWord} />
                                    </section>
                                    <section>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 pb-2 border-b border-slate-50">Structural Flow</h3>
                                        <DisplaySentence sentence={hoveredSentence} />
                                        <div className="mt-4 opacity-75">
                                            <DisplaySentenceV2 sentence={hoveredSentence} url={furiganaUrl} />
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 pb-2 border-b border-slate-50">Semantic Mapping</h3>
                                        <DisplayWord word={clickedWord} sentence={clickedWordSentence} url={deeplUrl} />
                                    </section>
                                </div>
                            </Tab>
                            <Tab label="Kanji">
                                <div className="p-4 pt-8"><KanjiDisplay word={clickedWord || ""} url0={extractKanjiUrl} url1={kanjiUrl} /></div>
                            </Tab>
                            <Tab label="Radicals">
                                <div className="p-4 pt-8"><RadicalInfo word={clickedWord || ""} url={radicalUrl} /></div>
                            </Tab>
                        </Tabs>
                    </div>
                </div>

            </div>
        </div>
    );
}
