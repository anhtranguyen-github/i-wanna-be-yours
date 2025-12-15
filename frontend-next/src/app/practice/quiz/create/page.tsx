'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    ChevronLeft, Plus, Trash2, Save, Loader2,
    GraduationCap, BookOpen, AlertCircle, Check,
    GripVertical, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { createQuiz } from '@/services/quizService';

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'mixed'];
const CATEGORIES = ['vocabulary', 'grammar', 'kanji', 'reading', 'mixed'];
const QUESTION_TYPES = [
    { value: 'vocab_reading', label: 'Vocabulary Reading', category: 'vocabulary' },
    { value: 'vocab_synonym', label: 'Vocabulary Synonym', category: 'vocabulary' },
    { value: 'kanji_reading', label: 'Kanji Reading', category: 'kanji' },
    { value: 'kanji_meaning', label: 'Kanji Meaning', category: 'kanji' },
    { value: 'grammar_fill_blank', label: 'Grammar Fill-in-blank', category: 'grammar' },
    { value: 'reading_comprehension', label: 'Reading Comprehension', category: 'reading' },
];

interface QuizQuestion {
    id: string;
    question_type: string;
    prompt: string;
    options: string[];
    correct_answer: string;
    points: number;
}

export default function CreateQuizPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    // Quiz metadata
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [jlptLevel, setJlptLevel] = useState('N5');
    const [category, setCategory] = useState('vocabulary');
    const [timeLimit, setTimeLimit] = useState<number | null>(null);
    const [isPublic, setIsPublic] = useState(false);

    // Questions
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

    // UI State
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Add new question
    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: `q-${Date.now()}`,
            question_type: 'vocab_reading',
            prompt: '',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 1,
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionIndex(questions.length);
    };

    // Update question
    const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    // Update option
    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = value;
        setQuestions(updated);
    };

    // Remove question
    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        if (activeQuestionIndex === index) {
            setActiveQuestionIndex(null);
        } else if (activeQuestionIndex && activeQuestionIndex > index) {
            setActiveQuestionIndex(activeQuestionIndex - 1);
        }
    };

    // Move question
    const moveQuestion = (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= questions.length) return;

        const updated = [...questions];
        [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
        setQuestions(updated);
        setActiveQuestionIndex(toIndex);
    };

    // Validate quiz
    const validateQuiz = (): string | null => {
        if (!title.trim()) return 'Please enter a quiz title';
        if (questions.length === 0) return 'Please add at least one question';

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.prompt.trim()) return `Question ${i + 1}: Please enter a prompt`;
            if (q.options.some(o => !o.trim())) return `Question ${i + 1}: Please fill all options`;
            if (!q.correct_answer) return `Question ${i + 1}: Please select correct answer`;
        }

        return null;
    };

    // Save quiz
    const handleSave = async () => {
        const validationError = validateQuiz();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!user) {
            setError('Please log in to create a quiz');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const quizData = {
                author_id: String(user.id),
                title,
                description,
                origin: 'manual' as const,
                jlpt_level: jlptLevel,
                category,
                time_limit_seconds: timeLimit || undefined,
                is_public: isPublic,
                questions: questions.map(q => ({
                    question_type: q.question_type,
                    content: {
                        prompt: q.prompt,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        scoring_rule: 'binary',
                    },
                    points: q.points,
                    learning_points: [],
                })),
            };

            const result = await createQuiz(quizData);
            setSuccess('Quiz created successfully!');

            // Redirect to quiz page after short delay
            setTimeout(() => {
                router.push(`/practice/quiz/${result.id}`);
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to create quiz');
        } finally {
            setSaving(false);
        }
    };

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-cream">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-brand-cream py-12">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <div className="clay-card p-12">
                        <GraduationCap className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                        <h2 className="text-2xl font-black text-brand-dark mb-4">Login Required</h2>
                        <p className="text-gray-500 mb-6">Please log in to create personal quizzes.</p>
                        <Link href="/login?redirect=/practice/quiz/create" className="btnPrimary">
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-cream pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/practice/quiz"
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-brand-dark">Create Personal Quiz</h1>
                                <p className="text-sm text-gray-500">Build your own custom quiz</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btnPrimary flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Quiz
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="max-w-5xl mx-auto px-4 pt-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                        <AlertCircle size={20} />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
                    </div>
                </div>
            )}

            {success && (
                <div className="max-w-5xl mx-auto px-4 pt-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-600">
                        <Check size={20} />
                        {success}
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Quiz Settings */}
                    <div className="space-y-6">
                        <div className="clay-card p-6">
                            <h2 className="font-bold text-brand-dark mb-4">Quiz Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="My Quiz"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What is this quiz about?"
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            JLPT Level
                                        </label>
                                        <select
                                            value={jlptLevel}
                                            onChange={(e) => setJlptLevel(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {JLPT_LEVELS.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 capitalize"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={timeLimit ? timeLimit / 60 : ''}
                                        onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) * 60 : null)}
                                        placeholder="No limit"
                                        min={1}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-700">Make Public</div>
                                        <div className="text-xs text-gray-500">Others can take this quiz</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Question List */}
                        <div className="clay-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-brand-dark">Questions ({questions.length})</h2>
                                <button
                                    onClick={addQuestion}
                                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {questions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No questions yet</p>
                                    <button
                                        onClick={addQuestion}
                                        className="mt-3 text-blue-500 font-medium hover:underline"
                                    >
                                        Add first question
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {questions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setActiveQuestionIndex(idx)}
                                            className={`
                                                w-full text-left p-3 rounded-xl border-2 transition-all
                                                ${activeQuestionIndex === idx
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                                <span className="flex-1 truncate text-sm">
                                                    {q.prompt || 'Untitled question'}
                                                </span>
                                                {q.prompt && q.correct_answer && (
                                                    <Check size={14} className="text-green-500" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Question Editor */}
                    <div className="lg:col-span-2">
                        {activeQuestionIndex !== null && questions[activeQuestionIndex] ? (
                            <div className="clay-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-bold text-brand-dark">
                                        Question {activeQuestionIndex + 1}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moveQuestion(activeQuestionIndex, 'up')}
                                            disabled={activeQuestionIndex === 0}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveQuestion(activeQuestionIndex, 'down')}
                                            disabled={activeQuestionIndex === questions.length - 1}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={() => removeQuestion(activeQuestionIndex)}
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Question Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Question Type
                                        </label>
                                        <select
                                            value={questions[activeQuestionIndex].question_type}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { question_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {QUESTION_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Prompt */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Question Prompt *
                                        </label>
                                        <textarea
                                            value={questions[activeQuestionIndex].prompt}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { prompt: e.target.value })}
                                            placeholder="Enter your question here..."
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-lg"
                                        />
                                    </div>

                                    {/* Options */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Answer Options * (click to mark correct)
                                        </label>
                                        <div className="space-y-3">
                                            {questions[activeQuestionIndex].options.map((option, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuestion(activeQuestionIndex, { correct_answer: option })}
                                                        className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all
                                                            ${questions[activeQuestionIndex].correct_answer === option && option
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                            }
                                                        `}
                                                    >
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            updateOption(activeQuestionIndex, optIdx, e.target.value);
                                                            // Update correct answer if this was the correct one
                                                            if (questions[activeQuestionIndex].correct_answer === option) {
                                                                updateQuestion(activeQuestionIndex, { correct_answer: e.target.value });
                                                            }
                                                        }}
                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Click the letter button to mark the correct answer
                                        </p>
                                    </div>

                                    {/* Points */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Points
                                        </label>
                                        <input
                                            type="number"
                                            value={questions[activeQuestionIndex].points}
                                            onChange={(e) => updateQuestion(activeQuestionIndex, { points: parseInt(e.target.value) || 1 })}
                                            min={1}
                                            max={10}
                                            className="w-24 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="clay-card p-12 text-center">
                                <BookOpen className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                                <h3 className="text-xl font-bold text-gray-400 mb-2">
                                    {questions.length === 0
                                        ? 'Start by adding questions'
                                        : 'Select a question to edit'
                                    }
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    {questions.length === 0
                                        ? 'Click the + button to add your first question'
                                        : 'Click on a question in the list to edit it'
                                    }
                                </p>
                                {questions.length === 0 && (
                                    <button
                                        onClick={addQuestion}
                                        className="btnPrimary inline-flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add Question
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
