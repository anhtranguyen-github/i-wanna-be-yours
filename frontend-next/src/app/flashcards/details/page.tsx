"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlayCircle,
    faArrowLeft,
    faArrowRight,
    faList,
    faPen,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";
import { fetchDeckById } from "@/services/deckService";
import { Deck } from "@/types/decks";
import { useUser } from "@/context/UserContext";

// --- Types ---
interface Sentence {
    sentence_original: string;
    sentence_simplified?: string;
    sentence_romaji: string;
    sentence_english: string;
    sentence_audio: string;
    sentence_picture?: string;
}

interface Question {
    id: string;
    vocabulary_original: string; // or kanji
    vocabulary_simplified: string; // or reading
    vocabulary_english: string; // or translation
    vocabulary_audio: string; // or audio
    word_type?: string;
    sentences: Sentence[];
    // Kanji specific optional fields
    kanji?: string;
    reading?: string;
    audio?: string;
    exampleWord?: string;
    exampleReading?: string;
    translation?: string;
}

// --- Helper Functions ---
const mapDeckToQuestions = (deck: Deck): Question[] => {
    return deck.cards.map(card => {
        const sentenceObj = card.extra_data?.sentence_obj;
        // Prioritize structured sentence object, fall back to flat string
        const sentences: Sentence[] = [];

        if (sentenceObj) {
            sentences.push({
                sentence_original: sentenceObj.sentence_original,
                sentence_simplified: sentenceObj.sentence_simplified,
                sentence_romaji: sentenceObj.sentence_romaji,
                sentence_english: sentenceObj.sentence_english,
                sentence_audio: sentenceObj.sentence_audio,
                sentence_picture: sentenceObj.sentence_picture
            });
        }

        if (sentences.length === 0 && card.extra_data?.example_sentence) {
            sentences.push({
                sentence_original: card.extra_data.example_sentence,
                sentence_romaji: "",
                sentence_english: "",
                sentence_audio: ""
            });
        }

        return {
            id: card._id,
            vocabulary_original: card.front, // Japanese Word/Kanji
            vocabulary_simplified: card.sub_detail || "", // Reading
            vocabulary_english: card.back, // Meaning
            vocabulary_audio: card.extra_data?.audio || "",
            word_type: card.extra_data?.word_type,
            sentences: sentences,
            // Kanji mappings
            kanji: card.front,
            reading: card.sub_detail,
            translation: card.back,
            audio: card.extra_data?.audio,
            exampleWord: card.extra_data?.example_word,
            exampleReading: card.extra_data?.example_reading
        };
    });
};

// --- Components ---

const EditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: Question;
    onSave: (newData: Partial<Question>) => Promise<void>;
}> = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({ ...data });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                    <h3 className="text-xl font-bold dark:text-white">Edit Card</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Front (Word)</label>
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.vocabulary_original}
                            onChange={e => setFormData({ ...formData, vocabulary_original: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Simplified (Reading)</label>
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.vocabulary_simplified}
                            onChange={e => setFormData({ ...formData, vocabulary_simplified: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meaning</label>
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.vocabulary_english}
                            onChange={e => setFormData({ ...formData, vocabulary_english: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-brand-salmon text-white rounded-lg hover:brightness-110">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const SentenceSection: React.FC<{ sentences: Sentence[] }> = ({ sentences }) => {
    const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});

    const toggleOpenState = (index: number) => {
        setOpenStates((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const playSentenceAudio = (audioUrl: string) => {
        if (!audioUrl) return;
        new Audio(audioUrl).play();
    };

    if (!sentences || sentences.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 text-sm italic">
                No example sentences available.
            </div>
        );
    }

    return (
        <div className="text-center space-y-4">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Example Sentence
            </div>
            {sentences.map((sentence, index) => (
                <div key={index} className="space-y-2 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => playSentenceAudio(sentence.sentence_audio)}
                            className={`flex-shrink-0 mt-1 ${sentence.sentence_audio ? 'text-brand-salmon hover:text-brand-salmon/80' : 'text-gray-300 cursor-not-allowed'}`}
                            disabled={!sentence.sentence_audio}
                        >
                            <FontAwesomeIcon icon={faPlayCircle} className="w-6 h-6" />
                        </button>
                        <div className="flex-grow text-left">
                            <div className="text-lg font-medium text-gray-800 dark:text-white leading-relaxed">
                                {sentence.sentence_original}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {sentence.sentence_english || "No translation"}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default function FlashcardDeckPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    // State
    const [deck, setDeck] = useState<Deck | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const [settings, setSettings] = useState({
        mode: 'basic', // 'basic' | 'learn'
        shuffle: false,
        defaultSide: 'front'
    });

    const { user } = useUser();
    const userId = user?.id ? String(user.id) : "test_user";

    // Fetch Data
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchDeckById(id)
            .then(fetchedDeck => {
                setDeck(fetchedDeck);
                const mappedQuestions = mapDeckToQuestions(fetchedDeck);
                setQuestions(mappedQuestions);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to fetch deck.");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (questions.length > 0) {
            let q = [...questions];
            if (settings.shuffle) {
                // Fisher-Yates shuffle
                for (let i = q.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [q[i], q[j]] = [q[j], q[i]];
                }
            }
            setDisplayQuestions(q);
            setCurrentQuestionIndex(0);
            setHasRevealed(false);
            setIsFlipped(settings.defaultSide === 'back');
        }
    }, [questions, settings.shuffle, settings.defaultSide]);

    useEffect(() => {
        setHasRevealed(false);
        setIsFlipped(settings.defaultSide === 'back');
    }, [currentQuestionIndex]);


    // Handlers
    const flipCard = () => {
        if (!isFlipped && !hasRevealed) {
            setHasRevealed(true);
        }
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        setIsFlipped(false); // Reset flip
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev === displayQuestions.length - 1 ? 0 : prev + 1);
        }, 150); // Slight delay for smooth transition
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev === 0 ? displayQuestions.length - 1 : prev - 1);
        }, 150);
    };

    const logStudyActivity = async (count: number) => {
        try {
            await axios.post(`/s-api/v1/study-plan/log-activity`, {
                user_id: userId,
                type: "flashcard_review",
                quantity: count,
                duration_seconds: 0 // Placeholder, roughly instantaneous
            });
        } catch (e) {
            console.error("Failed to log study activity", e);
        }
    }

    const handleSaveEdit = async (newData: Partial<Question>) => {
        try {
            // Use editingQuestion if set, otherwise current
            const targetQ = editingQuestion || displayQuestions[currentQuestionIndex];
            const currentCard = deck?.cards.find(c => c._id === targetQ.id);

            if (!currentCard) return;

            const payload: any = {
                userId,
                // Existing identity fields to find the card
                collectionName: currentCard.type === 'kanji' ? 'kanji' : 'words',
                p_tag: currentCard.extra_data?.p_tag,
                s_tag: currentCard.extra_data?.s_tag,
                // Search keys
                vocabulary_original: currentCard.front,
                kanji: currentCard.front,

                // UPDATES
                ...newData
            };

            await axios.post(`/f-api/v1/flashcard`, payload);

            // Update local state
            const updateList = (list: Question[]) => {
                return list.map(q => q.id === targetQ.id ? { ...q, ...newData } as Question : q);
            };

            setDisplayQuestions(prev => updateList(prev));
            setQuestions(prev => updateList(prev));

            setIsEditOpen(false);
            setEditingQuestion(null);

        } catch (e) {
            console.error("Failed to save edit", e);
            alert("Failed to save changes. Please try again.");
        }
    };

    const handleDifficulty = async (difficulty: string) => {
        const current = displayQuestions[currentQuestionIndex];
        const currentCard = deck?.cards.find(c => c._id === current.id);

        if (!current || !currentCard) return;

        try {
            const payload: any = {
                userId,
                difficulty,
                collectionName: currentCard.type === 'kanji' ? 'kanji' : 'words',
                p_tag: currentCard.extra_data?.p_tag,
                s_tag: currentCard.extra_data?.s_tag
            };
            if (currentCard.type === 'kanji') {
                payload.kanji = current.kanji;
            } else {
                payload.vocabulary_original = current.vocabulary_original;
            }

            await axios.post(`/f-api/v1/flashcard`, payload);

            // Log successful review for adaptive plan
            await logStudyActivity(1);

        } catch (e) {
            console.error("Failed to save flashcard", e);
        }

        handleNext();
    };

    const playAudio = (url?: string) => {
        if (url) {
            new Audio(url).play();
        }
    };


    if (loading) return <div className="p-12 text-center text-gray-400 animate-pulse">Loading deck...</div>;
    if (error || !deck) return <div className="p-12 text-center text-red-500 bg-red-50 rounded-lg mx-auto max-w-lg mt-10">{error || "Deck not found"}</div>;
    if (!displayQuestions.length) return <div className="p-12 text-center text-gray-500">Deck is empty.</div>;

    const currentQuestion = displayQuestions[currentQuestionIndex];
    const isKanji = deck.tags.includes('kanji') || !!currentQuestion.kanji;

    // --- RENDER ---

    // Inline Styles for 3D Transform to guarantee cross-browser support
    const cardStyle: React.CSSProperties = {
        transformStyle: "preserve-3d",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)"
    };

    // Explicitly hide backface
    const faceStyle: React.CSSProperties = {
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden", // Safari support
        position: "absolute",
        inset: 0,
    };

    const backFaceStyle: React.CSSProperties = {
        ...faceStyle,
        transform: "rotateY(180deg)"
    };

    const FrontCard = () => (
        <div
            className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 cursor-pointer hover:shadow-xl transition-shadow relative"
            onClick={flipCard}
        >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tap to reveal</div>
            <div className={`font-bold text-gray-800 dark:text-white mb-8 text-center leading-tight ${isKanji ? 'text-9xl font-noto-sans-jp' : 'text-5xl md:text-6xl'}`}>
                {isKanji ? currentQuestion.kanji : currentQuestion.vocabulary_original}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); playAudio(isKanji ? currentQuestion.audio : currentQuestion.vocabulary_audio); }}
                className="p-4 rounded-full bg-brand-salmon/10 hover:bg-brand-salmon/20 text-brand-salmon transition-colors"
                aria-label="Play Audio"
            >
                <FontAwesomeIcon icon={faPlayCircle} className="w-8 h-8" />
            </button>
        </div>
    );

    const BackCard = () => (
        <div
            className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden relative cursor-pointer"
            onClick={flipCard}
        >
            {/* Header */}
            <div className="flex-shrink-0 p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center text-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                    {isKanji ? currentQuestion.kanji : currentQuestion.vocabulary_simplified}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 italic">
                    {isKanji ? currentQuestion.reading : currentQuestion.vocabulary_english}
                </div>
                {isKanji && <div className="text-md text-gray-500 mt-1">{currentQuestion.translation}</div>}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {isKanji ? (
                    <div className="space-y-4 text-center">
                        <div className="text-sm text-gray-500 uppercase tracking-wide">Common Compound</div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg inline-block text-left">
                            <div className="text-xl font-bold text-gray-800 dark:text-white">{currentQuestion.exampleWord}</div>
                            <div className="text-gray-600 dark:text-gray-300">{currentQuestion.exampleReading}</div>
                        </div>
                    </div>
                ) : (
                    <SentenceSection sentences={currentQuestion.sentences} />
                )}
            </div>

            {/* Bottom Audio Button for Back */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                <button
                    onClick={(e) => { e.stopPropagation(); playAudio(isKanji ? currentQuestion.audio : currentQuestion.vocabulary_audio); }}
                    className="flex items-center gap-2 text-brand-salmon hover:text-brand-salmon/80 font-medium"
                >
                    <FontAwesomeIcon icon={faPlayCircle} /> Listen Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
            <EditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} data={editingQuestion || currentQuestion} onSave={handleSaveEdit} />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* 1. Header Section */}
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {deck.title}
                    </h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {displayQuestions.length} Cards · {settings.mode === 'learn' ? 'SRS Learn Mode' : 'Basic Review'}
                    </p>
                </div>

                {/* 2. Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <button
                        onClick={() => setSettings(s => ({ ...s, mode: 'learn' }))}
                        className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-center
                    ${settings.mode === 'learn'
                                ? 'bg-brand-salmon text-white ring-2 ring-brand-salmon ring-offset-2 dark:ring-offset-gray-900'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Study Mode
                    </button>
                    <button
                        onClick={() => setSettings(s => ({ ...s, mode: 'basic' }))}
                        className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all text-center
                    ${settings.mode === 'basic'
                                ? 'bg-brand-salmon text-white ring-2 ring-brand-salmon ring-offset-2 dark:ring-offset-gray-900'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Basic Mode
                    </button>
                </div>

                {/* 3. Flashcard Display Area */}
                <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] md:aspect-[3/2] min-h-[400px] perspective-1000">
                    <div className="w-full h-full relative" style={cardStyle}>
                        {/* Front */}
                        <div style={faceStyle}>
                            <FrontCard />
                        </div>
                        {/* Back */}
                        <div style={backFaceStyle}>
                            <BackCard />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* SRS Ratings (Only if revealed) */}
                    {(hasRevealed && settings.mode === 'learn') ? (
                        <div className="flex justify-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                            <button onClick={() => handleDifficulty("hard")} className="flex-1 py-3 px-4 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors">
                                😓 Hard
                            </button>
                            <button onClick={() => handleDifficulty("medium")} className="flex-1 py-3 px-4 bg-yellow-100 text-yellow-700 font-bold rounded-xl hover:bg-yellow-200 transition-colors">
                                🤔 Medium
                            </button>
                            <button onClick={() => handleDifficulty("easy")} className="flex-1 py-3 px-4 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors">
                                😊 Easy
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <button onClick={handlePrev} className="p-3 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                            </button>

                            <div className="text-sm text-gray-400 font-medium">
                                {isFlipped ? "Tap card to flip back" : "Tap card to reveal"}
                            </div>

                            <button onClick={handleNext} className="p-3 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faArrowRight} size="lg" />
                            </button>
                        </div>
                    )}

                    <div className="text-center text-sm font-medium text-gray-400">
                        Card {currentQuestionIndex + 1} of {displayQuestions.length}
                    </div>

                </div>


                {/* 4. Terms List Toggle */}
                <div className="max-w-2xl mx-auto pt-8 border-t border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setShowTerms(!showTerms)}
                        className="w-full py-3 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-salmon dark:hover:text-brand-salmon transition-colors font-semibold"
                    >
                        <FontAwesomeIcon icon={faList} />
                        {showTerms ? "Hide Terms in this set" : "Show Terms in this set"}
                        {showTerms ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>

                    {showTerms && (
                        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[600px] overflow-y-auto">
                            {displayQuestions.map((q, i) => (
                                <div key={q.id || i} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center group">
                                    <span className="font-bold text-gray-800 dark:text-white text-lg w-1/3">
                                        {isKanji ? q.kanji : q.vocabulary_original}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300 w-1/3 text-center">
                                        {isKanji ? q.reading : q.vocabulary_simplified}
                                    </span>
                                    <div className="w-1/3 flex justify-end items-center gap-4">
                                        <span className="text-gray-500 dark:text-gray-400 text-right">
                                            {isKanji ? q.translation : q.vocabulary_english}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingQuestion(q);
                                                setIsEditOpen(true);
                                            }}
                                            className="text-gray-300 hover:text-brand-salmon transition-colors opacity-0 group-hover:opacity-100"
                                            title="Edit Term"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
