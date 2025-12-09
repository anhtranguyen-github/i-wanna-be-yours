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
        <div className="min-h-screen bg-brand-cream text-brand-dark p-4 md:p-8">
            {/* HEADER */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight">
                        Japanese Text Parser
                    </h1>
                    <p className="text-brand-dark/70 mt-1 font-medium">Reading Assistant & Analyzer</p>
                </div>
                {userId && <div className="mt-2 md:mt-0 px-4 py-2 bg-white rounded-full border-2 border-brand-dark font-bold text-sm shadow-sm">
                    User: {userId}
                </div>}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Input & Main Output (8 cols) */}
                <div className="lg:col-span-8 flex flex-col space-y-8">

                    {/* MODE SWITCHER */}
                    <div className="bg-white rounded-2xl border-2 border-brand-dark shadow-hard overflow-hidden">
                        <div className="flex border-b-2 border-brand-dark">
                            <button
                                onClick={() => setParserMode('text')}
                                className={`flex-1 py-4 text-center font-black text-lg uppercase tracking-wide transition-colors ${parserMode === 'text' ? 'bg-brand-blue text-white' : 'bg-brand-cream hover:bg-brand-blue/10'}`}
                            >
                                Custom Text Input
                            </button>
                            <div className="w-[2px] bg-brand-dark"></div>
                            <button
                                onClick={() => setParserMode('youtube')}
                                className={`flex-1 py-4 text-center font-black text-lg uppercase tracking-wide transition-colors ${parserMode === 'youtube' ? 'bg-brand-blue text-white' : 'bg-brand-cream hover:bg-brand-blue/10'}`}
                            >
                                YouTube Analysis
                            </button>
                        </div>

                        <div className="p-6">
                            {parserMode === 'text' && (
                                <form onSubmit={handleSubmit}>
                                    <Disclaimer />
                                    <div className="mt-4">
                                        <TextFormattingOptions inputMode={inputMode} handleModeChange={handleModeChange} />
                                    </div>
                                    <textarea
                                        value={inputText}
                                        onChange={handleInputChange}
                                        className="w-full h-48 p-4 rounded-xl border-2 border-brand-dark text-lg font-jp focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition-shadow resize-y"
                                        placeholder="Enter Japanese text here..."
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold text-lg hover:translate-y-[-2px] hover:shadow-lg active:translate-y-[1px] transition-all"
                                        >
                                            Analyze Text
                                        </button>
                                    </div>
                                </form>
                            )}

                            {parserMode === 'youtube' && (
                                <div className="space-y-6">
                                    <SubtitleInfo />
                                    <YouTubeUrlInputForm
                                        inputUrl={inputUrl}
                                        setInputUrl={setInputUrl}
                                        setFinalInputUrl={setFinalInputUrl}
                                    />
                                    {finalInputUrl && (
                                        <YouTubeComponent
                                            videoUrl={finalInputUrl}
                                            onSubtitleUpdate={handleSubtitleUpdate}
                                        />
                                    )}
                                    <SubtitleUploader url={inputUrl} />

                                    {/* Current subtitle parser section */}
                                    <div className="bg-brand-cream/50 p-4 rounded-xl border-2 border-brand-dark/10">
                                        <p className="font-bold mb-2">Current Subtitle Analysis:</p>
                                        {userId ? (
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
                                        ) : (
                                            <p className="text-red-500 font-bold">Please log in to use the live parser.</p>
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
                    <div className="">
                        <Tabs>
                            <Tab label="Mecab Parser">
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
                            </Tab>
                            <Tab label="Kuroshiro">
                                <KuroShiroPropsConverter text={inputText} url={convertAllUrl} />
                            </Tab>
                            <Tab label="Translate">
                                <UnifiedGptComponent japaneseText={inputText} url={gptTranslateUrl} task="translate" />
                            </Tab>
                            <Tab label="Side-by-Side">
                                <UnifiedGptComponent japaneseText={inputText} url={gptTranslateSbSUrl} task="translate" />
                            </Tab>
                            <Tab label="Summary">
                                <UnifiedGptComponent japaneseText={inputText} url={gptSummaryUrl} task="summarize" />
                            </Tab>
                            <Tab label="Sentiment">
                                <UnifiedGptComponent japaneseText={inputText} url={gptSentimentUrl} task="analyzeSentiment" />
                            </Tab>
                        </Tabs>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="sticky top-8 max-h-[90vh] overflow-y-auto custom-scrollbar pt-1">
                        <Tabs>
                            <Tab label="Word Details">
                                {clickedWordDetails ? (
                                    <WordDetailsSidebar
                                        clickedWordDetails={clickedWordDetails}
                                        userId={userId}
                                        url0={userVocabUrl}
                                        url1={simpleVocabUrl}
                                        setRevisionCount={setRevisionCount}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-10 text-brand-dark/50 min-h-[300px]">
                                        <div className="text-6xl mb-4 opacity-20">?</div>
                                        <p className="text-center font-bold">Click a word in the parser to see details here.</p>
                                    </div>
                                )}
                            </Tab>
                            <Tab label="Create Flashcard">
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
                            </Tab>
                            <Tab label="Grammar">
                                <GrammarExplanation
                                    word={clickedWord}
                                    sentence={clickedWordSentence}
                                    url={gptGrammarUrl}
                                />
                            </Tab>
                            <Tab label="Meta">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-bold border-b-2 border-brand-dark mb-2">Hovered</h3>
                                        <DisplayHoveredWord hoveredWord={hoveredWord} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold border-b-2 border-brand-dark mb-2">Sentence</h3>
                                        <DisplaySentence sentence={hoveredSentence} />
                                        <DisplaySentenceV2 sentence={hoveredSentence} url={furiganaUrl} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold border-b-2 border-brand-dark mb-2">Translation</h3>
                                        <DisplayWord word={clickedWord} sentence={clickedWordSentence} url={deeplUrl} />
                                    </div>
                                </div>
                            </Tab>
                            <Tab label="Kanji">
                                <KanjiDisplay word={clickedWord || ""} url0={extractKanjiUrl} url1={kanjiUrl} />
                            </Tab>
                            <Tab label="Radicals">
                                <RadicalInfo word={clickedWord || ""} url={radicalUrl} />
                            </Tab>
                        </Tabs>
                    </div>
                </div>

            </div>
        </div>
    );
}
