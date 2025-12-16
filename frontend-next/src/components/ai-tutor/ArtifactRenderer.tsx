"use client";

import React, { useState } from "react";
import {
    FlashcardArtifact,
    QuizArtifact,
    VocabularyArtifact,
    Artifact,
} from "@/types/aiTutorTypes";
import {
    BookOpen,
    Save,
    Play,
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    RotateCw,
    Bookmark,
    Zap,
    FileText,
} from "lucide-react";

// =============================================================================
// FLASHCARD ARTIFACT RENDERER
// =============================================================================

interface FlashcardRendererProps {
    artifact: FlashcardArtifact;
    onSave?: () => void;
}

export function FlashcardRenderer({ artifact, onSave }: FlashcardRendererProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const cards = artifact.cards || [];
    const currentCard = cards[currentIndex];

    const handleSave = () => {
        setIsSaved(true);
        onSave?.();
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    if (cards.length === 0) {
        return <div className="text-slate-500">No flashcards available</div>;
    }

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-white/50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800">{artifact.title}</span>
                    {artifact.level && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            {artifact.level}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSaved
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                >
                    {isSaved ? <Check size={14} /> : <Save size={14} />}
                    {isSaved ? "Saved" : "Save"}
                </button>
            </div>

            {/* Card Display */}
            <div className="p-6">
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`
                        relative w-full min-h-[200px] bg-white rounded-xl shadow-lg cursor-pointer
                        transition-all duration-300 transform hover:shadow-xl
                        ${isFlipped ? "bg-emerald-50" : ""}
                    `}
                >
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">
                                {isFlipped ? "Answer" : "Question"}
                            </p>
                            <p className={`text-lg font-medium ${isFlipped ? "text-emerald-700" : "text-slate-800"}`}>
                                {isFlipped ? currentCard.back : currentCard.front}
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-3 right-3">
                        <RotateCw size={16} className="text-slate-300" />
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm text-slate-500">
                        {currentIndex + 1} / {cards.length}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === cards.length - 1}
                        className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// QUIZ ARTIFACT RENDERER
// =============================================================================

interface QuizRendererProps {
    artifact: QuizArtifact;
    onStart?: () => void;
    onSave?: () => void;
}

export function QuizRenderer({ artifact, onStart, onSave }: QuizRendererProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const questions = artifact.questions || [];

    const handleSave = () => {
        setIsSaved(true);
        onSave?.();
    };

    const handleSelectAnswer = (questionIndex: number, optionId: string) => {
        if (showResults) return;
        setSelectedAnswers({ ...selectedAnswers, [questionIndex]: optionId });
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const correctCount = questions.filter(
        (q, i) => selectedAnswers[i] === q.correctAnswer
    ).length;

    if (questions.length === 0) {
        return <div className="text-slate-500">No questions available</div>;
    }

    // Preview mode (not started)
    if (!isStarted) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden">
                <div className="px-4 py-3 bg-white/50 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {artifact.quizType === "exam" ? (
                            <FileText size={18} className="text-blue-600" />
                        ) : (
                            <Zap size={18} className="text-blue-600" />
                        )}
                        <span className="font-semibold text-blue-800">{artifact.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSaved
                                ? "bg-blue-100 text-blue-600"
                                : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                }`}
                        >
                            {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>

                <div className="p-6 text-center">
                    <div className="mb-4">
                        {artifact.level && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full mr-2">
                                {artifact.level}
                            </span>
                        )}
                        {artifact.skill && (
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                {artifact.skill}
                            </span>
                        )}
                    </div>

                    <p className="text-slate-600 mb-4">{artifact.description}</p>

                    <div className="flex justify-center gap-6 text-sm text-slate-500 mb-6">
                        <span>📝 {questions.length} questions</span>
                        {artifact.timeLimitMinutes && (
                            <span>⏱️ {artifact.timeLimitMinutes} min</span>
                        )}
                    </div>

                    <button
                        onClick={() => setIsStarted(true)}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Play size={18} />
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    // Quiz in progress or results
    const question = questions[currentQuestion];

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden">
            <div className="px-4 py-3 bg-white/50 border-b border-blue-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    Question {currentQuestion + 1} / {questions.length}
                </span>
                {showResults && (
                    <span className="text-sm font-bold text-emerald-600">
                        Score: {correctCount}/{questions.length}
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* Question */}
                <div className="mb-4">
                    <p className="text-lg font-medium text-slate-800">{question.content}</p>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-6">
                    {question.options.map((opt) => {
                        const isSelected = selectedAnswers[currentQuestion] === opt.id;
                        const isCorrect = opt.id === question.correctAnswer;

                        let optionClass = "bg-white border-slate-200 hover:border-blue-400";
                        if (showResults) {
                            if (isCorrect) {
                                optionClass = "bg-emerald-100 border-emerald-500";
                            } else if (isSelected && !isCorrect) {
                                optionClass = "bg-red-100 border-red-500";
                            }
                        } else if (isSelected) {
                            optionClass = "bg-blue-100 border-blue-500";
                        }

                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleSelectAnswer(currentQuestion, opt.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${optionClass}`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                                        {opt.id.toUpperCase()}
                                    </span>
                                    <span className="text-sm">{opt.text}</span>
                                    {showResults && isCorrect && (
                                        <Check size={16} className="ml-auto text-emerald-600" />
                                    )}
                                    {showResults && isSelected && !isCorrect && (
                                        <X size={16} className="ml-auto text-red-600" />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Explanation (after submit) */}
                {showResults && (
                    <div className="mb-4 p-3 bg-blue-100 rounded-lg text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : !showResults ? (
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setIsStarted(false);
                                setShowResults(false);
                                setSelectedAnswers({});
                                setCurrentQuestion(0);
                            }}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// VOCABULARY ARTIFACT RENDERER
// =============================================================================

interface VocabularyRendererProps {
    artifact: VocabularyArtifact;
    onSave?: () => void;
}

export function VocabularyRenderer({ artifact, onSave }: VocabularyRendererProps) {
    const [isSaved, setIsSaved] = useState(false);
    const items = artifact.items || [];

    const handleSave = () => {
        setIsSaved(true);
        onSave?.();
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
            <div className="px-4 py-3 bg-white/50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-600" />
                    <span className="font-semibold text-amber-800">{artifact.title}</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${isSaved
                        ? "bg-amber-100 text-amber-600"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                >
                    {isSaved ? <Check size={14} /> : <Save size={14} />}
                    {isSaved ? "Saved" : "Save"}
                </button>
            </div>

            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-amber-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="font-bold text-amber-800">{item.word}</span>
                                <span className="text-slate-500 ml-2">– {item.definition}</span>
                            </div>
                        </div>
                        {item.example && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{item.example}"</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// EXAM ARTIFACT RENDERER (Navigate to exam page)
// =============================================================================

interface ExamRendererProps {
    artifact: Artifact;
    onLaunch?: () => void;
    onSave?: () => void;
}

export function ExamRenderer({ artifact, onLaunch, onSave }: ExamRendererProps) {
    const [isSaved, setIsSaved] = useState(false);
    const metadata = artifact.metadata || {};
    const data = artifact.data || {};

    const handleSave = () => {
        setIsSaved(true);
        onSave?.();
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200 overflow-hidden">
            <div className="px-4 py-3 bg-white/50 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-purple-600" />
                    <span className="font-semibold text-purple-800">{artifact.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {metadata.level && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {metadata.level}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6 text-center">
                <p className="text-slate-600 mb-4">{data.description || 'Full practice exam'}</p>

                <div className="flex justify-center gap-6 text-sm text-slate-500 mb-6">
                    <span>📝 {metadata.questionCount || '?'} questions</span>
                    {metadata.timeLimitMinutes && (
                        <span>⏱️ {metadata.timeLimitMinutes} min</span>
                    )}
                    {metadata.sections && (
                        <span>📚 {metadata.sections.length} sections</span>
                    )}
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSaved
                                ? "bg-purple-100 text-purple-600"
                                : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                            }`}
                    >
                        {isSaved ? <><Check size={14} className="inline mr-1" /> Saved</> : <><Bookmark size={14} className="inline mr-1" /> Save</>}
                    </button>
                    <button
                        onClick={onLaunch}
                        className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <Play size={18} />
                        Start Exam
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// FLASHCARD SINGLE RENDERER (Add to deck functionality)
// =============================================================================

interface FlashcardSingleRendererProps {
    artifact: Artifact;
    onAddToDeck?: (deckId: string) => void;
    onCreateNewDeck?: () => void;
}

export function FlashcardSingleRenderer({ artifact, onAddToDeck, onCreateNewDeck }: FlashcardSingleRendererProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const data = artifact.data || {};
    const cards = data.cards || [];
    const card = cards[0];
    const metadata = artifact.metadata || {};

    if (!card) {
        return <div className="text-slate-500">No card data</div>;
    }

    return (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 overflow-hidden">
            <div className="px-4 py-3 bg-white/50 border-b border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-teal-600" />
                    <span className="font-semibold text-teal-800">{artifact.title}</span>
                    {metadata.level && (
                        <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                            {metadata.level}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Card */}
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`
                        relative w-full min-h-[180px] bg-white rounded-xl shadow-lg cursor-pointer
                        transition-all duration-300 transform hover:shadow-xl
                        ${isFlipped ? "bg-teal-50" : ""}
                    `}
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-xs text-slate-400 mb-2">
                            {isFlipped ? "Answer" : "Front"}
                        </p>
                        <p className={`text-xl font-medium ${isFlipped ? "text-teal-700" : "text-slate-800"}`}>
                            {isFlipped ? card.back : card.front}
                        </p>
                        {isFlipped && card.reading && (
                            <p className="text-sm text-slate-500 mt-2">({card.reading})</p>
                        )}
                        {isFlipped && card.example && (
                            <p className="text-sm text-slate-400 mt-2 italic">"{card.example}"</p>
                        )}
                    </div>
                    <div className="absolute bottom-3 right-3">
                        <RotateCw size={16} className="text-slate-300" />
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3 justify-center">
                    {artifact.actions?.canAddToExistingDeck && (
                        <button
                            onClick={() => onAddToDeck?.('select')}
                            className="px-4 py-2 bg-white border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
                        >
                            + Add to Deck
                        </button>
                    )}
                    {artifact.actions?.canCreateNewDeck && (
                        <button
                            onClick={onCreateNewDeck}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                        >
                            Create New Deck
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// FLASHCARD DECK RENDERER (Save to library)
// =============================================================================

interface FlashcardDeckRendererProps {
    artifact: Artifact;
    onSave?: () => void;
}

export function FlashcardDeckRenderer({ artifact, onSave }: FlashcardDeckRendererProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSaved, setIsSaved] = useState(artifact.savedToLibrary || false);

    const data = artifact.data || {};
    const cards = data.cards || [];
    const currentCard = cards[currentIndex];
    const metadata = artifact.metadata || {};

    const handleSave = () => {
        setIsSaved(true);
        onSave?.();
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    if (cards.length === 0) {
        return <div className="text-slate-500">No flashcards available</div>;
    }

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-white/50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800">{artifact.title}</span>
                    {metadata.level && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            {metadata.level}
                        </span>
                    )}
                    <span className="text-xs text-slate-500">{cards.length} cards</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSaved
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                >
                    {isSaved ? <Check size={14} /> : <Save size={14} />}
                    {isSaved ? "Saved" : "Save to Library"}
                </button>
            </div>

            {/* Card Display */}
            <div className="p-6">
                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`
                        relative w-full min-h-[200px] bg-white rounded-xl shadow-lg cursor-pointer
                        transition-all duration-300 transform hover:shadow-xl
                        ${isFlipped ? "bg-emerald-50" : ""}
                    `}
                >
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">
                                {isFlipped ? "Answer" : "Question"}
                            </p>
                            <p className={`text-lg font-medium ${isFlipped ? "text-emerald-700" : "text-slate-800"}`}>
                                {isFlipped ? currentCard.back : currentCard.front}
                            </p>
                            {isFlipped && currentCard.reading && (
                                <p className="text-sm text-slate-500 mt-2">({currentCard.reading})</p>
                            )}
                        </div>
                    </div>

                    <div className="absolute bottom-3 right-3">
                        <RotateCw size={16} className="text-slate-300" />
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm text-slate-500">
                        {currentIndex + 1} / {cards.length}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === cards.length - 1}
                        className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN ARTIFACT DISPATCHER
// =============================================================================

interface ArtifactRendererProps {
    artifact: Artifact;
    onSave?: (artifact: Artifact) => void;
}

export function ArtifactRenderer({ artifact, onSave }: ArtifactRendererProps) {
    const handleSave = () => onSave?.(artifact);

    switch (artifact.type) {
        case "flashcard_single":
            return (
                <FlashcardSingleRenderer
                    artifact={artifact}
                    onAddToDeck={(deckId) => {
                        console.log('Add to deck:', deckId);
                        // TODO: open deck selector modal
                    }}
                    onCreateNewDeck={() => {
                        console.log('Create new deck');
                        handleSave();
                    }}
                />
            );

        case "flashcard_deck":
            return (
                <FlashcardDeckRenderer
                    artifact={artifact}
                    onSave={handleSave}
                />
            );

        case "flashcard":
            // Legacy flashcard type - convert to deck format
            const legacyData = artifact.data as any;
            return (
                <FlashcardRenderer
                    artifact={{
                        title: artifact.title,
                        cards: legacyData.cards || [],
                        level: artifact.metadata?.level,
                        skill: artifact.metadata?.skill,
                    }}
                    onSave={handleSave}
                />
            );

        case "quiz":
            const quizData = artifact.data as any;
            return (
                <QuizRenderer
                    artifact={{
                        title: artifact.title,
                        description: quizData.description,
                        quizType: 'quiz',
                        level: artifact.metadata?.level,
                        skill: artifact.metadata?.skill,
                        questions: quizData.questions || [],
                    }}
                    onSave={handleSave}
                />
            );

        case "exam":
            return (
                <ExamRenderer
                    artifact={artifact}
                    onLaunch={() => {
                        console.log('Launch exam');
                        // TODO: Navigate to /jlpt/:examId
                    }}
                    onSave={handleSave}
                />
            );

        case "vocabulary":
            const vocabData = artifact.data as any;
            return (
                <VocabularyRenderer
                    artifact={{
                        title: artifact.title,
                        items: vocabData.items || [],
                    }}
                    onSave={handleSave}
                />
            );

        default:
            return (
                <div className="p-4 bg-slate-100 rounded-lg">
                    <p className="text-sm text-slate-500 mb-2">Artifact: {artifact.type}</p>
                    <p className="font-medium text-slate-700">{artifact.title}</p>
                    {artifact.metadata && (
                        <div className="mt-2 text-xs text-slate-400">
                            {Object.entries(artifact.metadata).map(([k, v]) => (
                                <span key={k} className="mr-2">{k}: {String(v)}</span>
                            ))}
                        </div>
                    )}
                </div>
            );
    }
}

