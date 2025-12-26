"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    PlayCircle,
    ArrowLeft,
    ArrowRight,
    List,
    Pen,
    X,
    ChevronDown,
    ChevronUp,
    Brain,
    Settings,
    Library,
    History,
    Sparkles,
    Volume2
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { fetchDeckById } from "@/services/deckService";
import { Deck } from "@/types/decks";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

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
    vocabulary_original: string;
    vocabulary_simplified: string;
    vocabulary_english: string;
    vocabulary_audio: string;
    word_type?: string;
    sentences: Sentence[];
    kanji?: string;
    reading?: string;
    audio?: string;
    exampleWord?: string;
    exampleReading?: string;
    translation?: string;
}

const mapDeckToQuestions = (deck: Deck): Question[] => {
    return deck.cards.map(card => {
        const sentenceObj = card.extra_data?.sentence_obj;
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
            vocabulary_original: card.front,
            vocabulary_simplified: card.sub_detail || "",
            vocabulary_english: card.back,
            vocabulary_audio: card.extra_data?.audio || "",
            word_type: card.extra_data?.word_type,
            sentences: sentences,
            kanji: card.front,
            reading: card.sub_detail,
            translation: card.back,
            audio: card.extra_data?.audio,
            exampleWord: card.extra_data?.example_word,
            exampleReading: card.extra_data?.example_reading
        };
    });
};

const EditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: Question;
    onSave: (newData: Partial<Question>) => Promise<void>;
}> = ({ isOpen, onClose, data, onSave }) => {
    const [formData, setFormData] = useState({ ...data });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/80  animate-in fade-in duration-300">
            <div className="bg-card rounded-[3rem]  border border-border/50 w-full max-w-xl p-10 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="flex justify-between items-center relative z-10">
                    <h3 className="text-2xl font-black text-foreground font-display tracking-tight italic">Triage <span className="text-primary italic-none not-italic">Node</span></h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
                        <X size={24} className="text-neutral-ink" />
                    </button>
                </div>

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink font-display mb-2 ml-1">Spectral Front (Word)</label>
                        <input className="w-full px-6 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-jp font-bold"
                            value={formData.vocabulary_original}
                            onChange={e => setFormData({ ...formData, vocabulary_original: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink font-display mb-2 ml-1">Logic Pattern (Reading)</label>
                        <input className="w-full px-6 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-jp font-bold"
                            value={formData.vocabulary_simplified}
                            onChange={e => setFormData({ ...formData, vocabulary_simplified: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-ink font-display mb-2 ml-1">Semantic Bridge (Meaning)</label>
                        <input className="w-full px-6 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all font-bold"
                            value={formData.vocabulary_english}
                            onChange={e => setFormData({ ...formData, vocabulary_english: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6 gap-4 relative z-10">
                    <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-ink hover:text-foreground font-display transition-colors">Cancel</button>
                    <button onClick={() => onSave(formData)} className="px-10 py-4 bg-primary text-primary-foreground font-black font-display text-[10px] uppercase tracking-widest rounded-2xl  hover:opacity-95 transition-all">Submit Calibration</button>
                </div>
            </div>
        </div>
    );
};

const SentenceSection: React.FC<{ sentences: Sentence[] }> = ({ sentences }) => {
    const playSentenceAudio = (audioUrl: string) => {
        if (!audioUrl) return;
        new Audio(audioUrl).play();
    };

    if (!sentences || sentences.length === 0) {
        return (
            <div className="p-8 text-center text-neutral-ink text-xs font-black uppercase tracking-widest font-display italic">
                No active contexts identified.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.3em] font-display text-center mb-6">
                Operational Contexts
            </div>
            {sentences.map((sentence, index) => (
                <div key={index} className="group/s bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:border-primary/30 hover:bg-white transition-all duration-500  hover:">
                    <div className="flex items-start gap-6">
                        <button
                            onClick={() => playSentenceAudio(sentence.sentence_audio)}
                            className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${sentence.sentence_audio ? 'bg-primary/5 text-primary hover:bg-primary/10 ' : 'text-slate-200 cursor-not-allowed shadow-none'}`}
                            disabled={!sentence.sentence_audio}
                        >
                            <Volume2 size={24} />
                        </button>
                        <div className="flex-grow pt-1">
                            <div className="text-2xl font-jp font-bold text-neutral-ink leading-[1.6] tracking-tight group-hover/s:text-primary transition-colors">
                                {sentence.sentence_original}
                            </div>
                            <div className="text-sm font-bold text-neutral-ink mt-4 italic tracking-tight leading-relaxed">
                                {sentence.sentence_english || "Semantic gap detected."}
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

    const [deck, setDeck] = useState<Deck | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const [settings, setSettings] = useState({
        mode: 'basic',
        shuffle: false,
        defaultSide: 'front'
    });

    const { user } = useUser();
    const userId = user?.id ? String(user.id) : "test_user";

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
                setError("Protocol synchronization failed.");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (questions.length > 0) {
            let q = [...questions];
            if (settings.shuffle) {
                for (let i = q.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [q[i], q[j]] = [q[j], q[i]];
                }
            }
            setDisplayQuestions(q);
            setCurrentQuestionIndex(0);
        }
    }, [questions, settings.shuffle]);

    useEffect(() => {
        setHasRevealed(false);
        setIsFlipped(settings.defaultSide === 'back');
    }, [currentQuestionIndex, settings.defaultSide]);

    const flipCard = () => {
        if (!isFlipped && !hasRevealed) setHasRevealed(true);
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev === displayQuestions.length - 1 ? 0 : prev + 1);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentQuestionIndex(prev => prev === 0 ? displayQuestions.length - 1 : prev - 1);
        }, 150);
    };

    const handleSaveEdit = async (newData: Partial<Question>) => {
        try {
            const targetQ = editingQuestion || displayQuestions[currentQuestionIndex];
            const currentCard = deck?.cards.find(c => c._id === targetQ.id);
            if (!currentCard) return;

            const payload: any = {
                userId,
                collectionName: currentCard.type === 'kanji' ? 'kanji' : 'words',
                p_tag: currentCard.extra_data?.p_tag,
                s_tag: currentCard.extra_data?.s_tag,
                vocabulary_original: currentCard.front,
                kanji: currentCard.front,
                ...newData
            };

            await axios.post(`/f-api/v1/flashcard`, payload);

            const updateList = (list: Question[]) => {
                return list.map(q => q.id === targetQ.id ? { ...q, ...newData } as Question : q);
            };

            setDisplayQuestions(prev => updateList(prev));
            setQuestions(prev => updateList(prev));
            setIsEditOpen(false);
            setEditingQuestion(null);
        } catch (e) {
            console.error("Failed to save edit", e);
        }
    };

    const playAudio = (url?: string) => {
        if (url) new Audio(url).play();
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">Accessing Synaptic Registry...</p>
        </div>
    );

    if (error || !deck) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-8  border border-destructive/20 rotate-12">
                <X size={48} />
            </div>
            <h2 className="text-3xl font-black text-foreground font-display tracking-tight mb-4 italic leading-none">{error || "Cluster Link Severed"}</h2>
            <Link href="/flashcards" className="px-10 py-5 bg-foreground text-background font-black font-display text-[10px] uppercase tracking-widest rounded-2xl  transition-all active:scale-95">Re-establish Link</Link>
        </div>
    );

    if (!displayQuestions.length) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8 italic font-bold text-neutral-ink opacity-40">
            Synaptic cluster is currently devoid of logic nodes.
        </div>
    );

    const currentQuestion = displayQuestions[currentQuestionIndex];
    const isKanji = deck.tags.includes('kanji') || !!currentQuestion.kanji;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
            <EditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} data={editingQuestion || currentQuestion} onSave={handleSaveEdit} />

            {/* Header Area */}
            <header className="bg-card  border-b border-border/50 px-8 py-10 sticky top-0 z-50 ">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6 group">
                        <Link href="/flashcards" className="w-14 h-14 bg-muted hover:bg-card border border-border/30 rounded-2xl flex items-center justify-center transition-all  active:scale-90 group/back">
                            <ArrowLeft size={24} className="text-neutral-ink group-hover/back:text-primary transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-foreground font-display tracking-tight leading-none mb-2 italic">
                                {deck.title}
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                                Registry: {displayQuestions.length} Active Nodes // Tier: {deck.tags.find(t => t.startsWith('n'))?.toUpperCase() || 'X'}
                            </p>
                        </div>
                    </div>

                    <div className="flex p-1.5 bg-muted/40 rounded-[2rem] border border-border/30 ">
                        <button
                            onClick={() => setSettings(s => ({ ...s, mode: 'basic' }))}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest font-display transition-all duration-500 ${settings.mode === 'basic' ? 'bg-card text-foreground ' : 'text-neutral-ink hover:text-foreground'}`}
                        >
                            Static Scan
                        </button>
                        <button
                            onClick={() => setSettings(s => ({ ...s, mode: 'learn' }))}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest font-display transition-all duration-500 ${settings.mode === 'learn' ? 'bg-primary text-primary-foreground ' : 'text-neutral-ink hover:text-foreground'}`}
                        >
                            Neural Study
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-8 py-16">
                {/* Tactical Card Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-16 items-start">

                    <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] md:aspect-[3/2] perspective-2500 group">
                        <div
                            className="w-full h-full relative transform-gpu transition-all duration-1000 transform-style-3d cursor-pointer"
                            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                            onClick={flipCard}
                        >
                            {/* FRONT FACE */}
                            <div className="absolute inset-0 backface-hidden bg-white rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 p-16 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-primary/5 overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[90px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

                                <div className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.4em] mb-12 font-display italic group-hover:text-primary transition-colors">Spectral Signature</div>

                                <div className={`font-black text-neutral-ink text-center leading-none tracking-tighter italic ${isKanji ? 'text-[10rem] font-jp' : 'text-7xl md:text-8xl'}`}>
                                    {isKanji ? currentQuestion.kanji : currentQuestion.vocabulary_original}
                                </div>

                                <div className="mt-auto flex items-center gap-4 text-slate-200 group-hover:text-primary/20 transition-colors duration-700">
                                    <Sparkles size={24} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] font-display">Synchronizing...</span>
                                </div>
                            </div>

                            {/* REAR FACE */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col overflow-hidden group/back">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                                <div className="bg-slate-50/50 p-12 border-b border-slate-100 text-center relative z-10 transition-colors group-hover/back:bg-white">
                                    <div className="text-4xl md:text-5xl font-black font-display text-neutral-ink leading-tight tracking-tight mb-4 italic">
                                        {isKanji ? currentQuestion.kanji : currentQuestion.vocabulary_simplified}
                                    </div>
                                    <div className="text-lg md:text-xl font-bold text-neutral-ink italic tracking-tight">
                                        {isKanji ? currentQuestion.reading : currentQuestion.vocabulary_english}
                                    </div>
                                    {isKanji && <div className="text-sm font-black text-primary uppercase tracking-[0.2em] mt-6 font-display italic">{currentQuestion.translation}</div>}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative z-10">
                                    {isKanji ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">Compound Pattern</div>
                                            <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] w-full max-w-sm">
                                                <div className="text-4xl font-jp font-black text-neutral-ink mb-4 tracking-tighter italic">{currentQuestion.exampleWord}</div>
                                                <div className="text-lg font-bold text-neutral-ink italic">{currentQuestion.exampleReading}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-neutral-ink">
                                            <SentenceSection sentences={currentQuestion.sentences} />
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); playAudio(isKanji ? currentQuestion.audio : currentQuestion.vocabulary_audio); }}
                                    className="p-8 border-t border-slate-100 flex items-center justify-center gap-4 text-neutral-ink hover:text-primary transition-all font-display font-black text-[10px] uppercase tracking-[0.3em] italic bg-slate-50/50 hover:bg-white"
                                >
                                    <Volume2 size={20} /> Listen to Frequency
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Matrix Controls */}
                    <div className="max-w-2xl mx-auto w-full space-y-12">
                        <div className="flex items-center justify-between gap-8 px-4">
                            <button onClick={handlePrev} className="w-20 h-20 bg-card rounded-[2rem] border border-border/50 flex items-center justify-center text-neutral-ink hover:text-primary hover:border-primary/20 transition-all  active:scale-90 group/prev">
                                <ArrowLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="text-3xl font-black text-foreground font-display leading-none mb-1 italic group-hover:text-primary transition-colors">{currentQuestionIndex + 1}</div>
                                <div className="text-[9px] font-black text-neutral-ink uppercase tracking-[0.3em] font-display">Current Node</div>
                            </div>

                            <button onClick={handleNext} className="w-20 h-20 bg-card rounded-[2rem] border border-border/50 flex items-center justify-center text-neutral-ink hover:text-primary hover:border-primary/20 transition-all  active:scale-90 group/next">
                                <ArrowRight size={32} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Terms Explorer Toggle */}
                        <div className="pt-10 border-t border-border/20">
                            <button
                                onClick={() => setShowTerms(!showTerms)}
                                className="w-full py-6 flex items-center justify-center gap-4 text-neutral-ink hover:text-primary transition-all font-display font-black text-[10px] uppercase tracking-[0.25em] italic bg-card/30 rounded-[2rem] border border-border/10  hover:border-primary/10"
                            >
                                <List size={20} />
                                {showTerms ? "Retract Index Matrix" : "Expand Cluster Index"}
                                {showTerms ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {showTerms && (
                                <div className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    {displayQuestions.map((q, i) => (
                                        <div key={q.id || i} className="group/item flex items-center gap-6 p-6 bg-card/50 rounded-[2rem] border border-border/30 hover:border-primary/30 transition-all duration-300 relative overflow-hidden  ">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-2xl opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                            <div className="w-20 font-jp font-black text-3xl text-foreground opacity-90 group-hover/item:text-primary transition-colors italic">
                                                {isKanji ? q.kanji : q.vocabulary_original}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display mb-1">Logic Mapping</div>
                                                <div className="font-bold text-neutral-ink italic text-lg leading-none">
                                                    {isKanji ? q.reading : q.vocabulary_simplified}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="text-[10px] font-black text-neutral-ink uppercase tracking-widest font-display mb-1">Semantic Bridge</div>
                                                <div className="font-bold text-neutral-ink italic leading-none truncate max-w-[150px]">
                                                    {isKanji ? q.translation : q.vocabulary_english}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingQuestion(q);
                                                    setIsEditOpen(true);
                                                }}
                                                className="w-12 h-12 rounded-[1.25rem] bg-muted/50 border border-border/30 text-neutral-ink hover:text-primary hover:border-primary/20 hover:bg-card flex items-center justify-center transition-all  active:scale-90"
                                            >
                                                <Pen size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <div className={`border-4 border-t-transparent rounded-full ${className}`}></div>
);
