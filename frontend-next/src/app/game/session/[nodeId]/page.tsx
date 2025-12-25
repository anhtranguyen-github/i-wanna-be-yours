"use client";

/**
 * Game Session Page - Premium Quizizz-like game player
 * 
 * Implements Hybrid Assessment Mode with:
 * - SRS adaptive question serving (optional)
 * - Speed-based scoring (optional)
 * - Power-up system (optional)
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Timer,
    Zap,
    Star,
    Trophy,
    ChevronRight,
    AlertTriangle,
    Loader2,
    Target,
    Flame,
    ArrowLeft,
    Pause,
    Play,
    SkipForward,
    Divide,
    Clock,
    Sparkles,
    CheckCircle2,
    XCircle,
    Brain,
    Gauge
} from "lucide-react";
import { mockExamConfigs, getQuestionsForExam } from "@/data/mockPractice";
import { useGameSession } from "@/hooks/useGameSession";
import { GameSessionConfig, PowerUpType, GameResult } from "@/types/game";
import { PracticeNode, Question } from "@/types/practice";

// =============================================================================
// GAME CONFIG SELECTION (Pre-game screen)
// =============================================================================

interface GameConfigSelectProps {
    node: PracticeNode;
    onStart: (config: Partial<GameSessionConfig>) => void;
    onBack: () => void;
}

function GameConfigSelect({ node, onStart, onBack }: GameConfigSelectProps) {
    const [srsEnabled, setSrsEnabled] = useState(false);
    const [speedScoring, setSpeedScoring] = useState(true);
    const [powerupsEnabled, setPowerupsEnabled] = useState(true);
    const [timePerQuestion, setTimePerQuestion] = useState(30);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-card rounded-[3rem] border border-border/50 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <Brain size={40} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground font-display tracking-tight mb-2">
                        {node.title}
                    </h1>
                    <p className="text-muted-foreground font-bold">Configure your session</p>
                </div>

                {/* Config Toggles */}
                <div className="space-y-4 mb-10">
                    {/* SRS Mode */}
                    <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/30 cursor-pointer group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                                <Target size={20} className="text-secondary" />
                            </div>
                            <div>
                                <div className="font-black text-foreground font-display text-sm">SRS Mode</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Repeat until mastery
                                </div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={srsEnabled}
                            onChange={(e) => setSrsEnabled(e.target.checked)}
                            className="w-5 h-5 rounded accent-primary"
                        />
                    </label>

                    {/* Speed Scoring */}
                    <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/30 cursor-pointer group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Zap size={20} className="text-primary" />
                            </div>
                            <div>
                                <div className="font-black text-foreground font-display text-sm">Speed Scoring</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Faster = more points
                                </div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={speedScoring}
                            onChange={(e) => setSpeedScoring(e.target.checked)}
                            className="w-5 h-5 rounded accent-primary"
                        />
                    </label>

                    {/* Power-ups */}
                    <label className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/30 cursor-pointer group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                <Sparkles size={20} className="text-accent" />
                            </div>
                            <div>
                                <div className="font-black text-foreground font-display text-sm">Power-ups</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    50/50, freeze, skip
                                </div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={powerupsEnabled}
                            onChange={(e) => setPowerupsEnabled(e.target.checked)}
                            className="w-5 h-5 rounded accent-primary"
                        />
                    </label>

                    {/* Time per question */}
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/30">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                                <Timer size={20} className="text-destructive" />
                            </div>
                            <div>
                                <div className="font-black text-foreground font-display text-sm">Time per Question</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    {timePerQuestion} seconds
                                </div>
                            </div>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={60}
                            step={5}
                            value={timePerQuestion}
                            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={() => onStart({
                        is_srs_enabled: srsEnabled,
                        is_speed_scoring_enabled: speedScoring,
                        is_powerup_enabled: powerupsEnabled,
                        timePerQuestionSeconds: timePerQuestion
                    })}
                    className="w-full py-5 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <Play size={20} className="fill-current" />
                    Start Game
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// GAME PLAYER
// =============================================================================

interface GamePlayerProps {
    node: PracticeNode;
    questions: Question[];
    config: Partial<GameSessionConfig>;
    onComplete: (result: GameResult) => void;
    onExit: () => void;
}

function GamePlayer({ node, questions, config, onComplete, onExit }: GamePlayerProps) {
    const {
        state,
        currentQuestion,
        isComplete,
        progressIndicator,
        score,
        streak,
        lastScoreResult,
        timeRemaining,
        isTimerActive,
        powerups,
        fiftyFiftyOptions,
        submitAnswer,
        usePowerUp,
        skipQuestion,
        pauseGame,
        resumeGame,
        gameResult,
        config: fullConfig
    } = useGameSession({ node, questions, config, onComplete });

    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Show feedback after answer
    useEffect(() => {
        if (lastScoreResult) {
            setShowFeedback(true);
            const timer = setTimeout(() => {
                setShowFeedback(false);
                setSelectedOption(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [lastScoreResult]);

    const handleOptionClick = (optionId: string) => {
        if (showFeedback || isComplete) return;
        setSelectedOption(optionId);
        submitAnswer(optionId);
    };

    const handlePowerUp = (type: PowerUpType) => {
        usePowerUp(type);
    };

    // Time warning
    const isTimeLow = timeRemaining <= 5;
    const timeProgress = (timeRemaining / fullConfig.timePerQuestionSeconds) * 100;

    if (!currentQuestion && !isComplete) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (isComplete && gameResult) {
        return <GameResults result={gameResult} onPlayAgain={() => window.location.reload()} onExit={onExit} />;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onExit} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={24} />
                    </button>

                    {/* Progress */}
                    <div className="text-center flex-1 px-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-display mb-1">
                            {progressIndicator.label}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${progressIndicator.type === 'linear' ? (progressIndicator.current / progressIndicator.total) * 100 : progressIndicator.percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Score & Streak */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-black text-foreground font-display">{score.toLocaleString()}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Points</div>
                        </div>
                        {streak > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full">
                                <Flame size={16} />
                                <span className="font-black">{streak}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Timer Bar */}
            <div className="h-1 bg-muted">
                <div
                    className={`h-full transition-all duration-1000 ${isTimeLow ? 'bg-destructive animate-pulse' : 'bg-primary'}`}
                    style={{ width: `${timeProgress}%` }}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6">
                {currentQuestion && (
                    <div className="max-w-2xl w-full">
                        {/* Question */}
                        <div className="text-center mb-10">
                            <p className="text-2xl md:text-3xl font-black text-foreground font-jp leading-relaxed">
                                {currentQuestion.content}
                            </p>
                            {currentQuestion.passage && (
                                <div className="mt-6 p-6 bg-muted/30 rounded-2xl text-lg text-foreground/80 font-jp">
                                    {currentQuestion.passage}
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option, idx) => {
                                const isHidden = fiftyFiftyOptions && !fiftyFiftyOptions.includes(option.id);
                                const isSelected = selectedOption === option.id;
                                const isCorrect = showFeedback && option.id === currentQuestion.correctOptionId;
                                const isWrong = showFeedback && isSelected && option.id !== currentQuestion.correctOptionId;

                                if (isHidden) return null;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleOptionClick(option.id)}
                                        disabled={showFeedback}
                                        className={`
                                            group relative p-6 rounded-2xl text-left transition-all duration-300 border-2
                                            ${isCorrect ? 'bg-primary/10 border-primary' : ''}
                                            ${isWrong ? 'bg-destructive/10 border-destructive' : ''}
                                            ${!showFeedback && !isSelected ? 'bg-card border-border hover:border-primary/50 hover:scale-[1.02]' : ''}
                                            ${isSelected && !showFeedback ? 'border-primary bg-primary/5' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center font-black font-display
                                                ${isCorrect ? 'bg-primary text-primary-foreground' : ''}
                                                ${isWrong ? 'bg-destructive text-destructive-foreground' : ''}
                                                ${!isCorrect && !isWrong ? 'bg-muted text-muted-foreground' : ''}
                                            `}>
                                                {isCorrect ? <CheckCircle2 size={20} /> : isWrong ? <XCircle size={20} /> : String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-lg font-bold text-foreground font-jp">
                                                {option.text}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Score Popup */}
                        {showFeedback && lastScoreResult && (
                            <div className={`
                                fixed inset-0 flex items-center justify-center pointer-events-none z-50
                                animate-in zoom-in-95 fade-in duration-300
                            `}>
                                <div className={`
                                    text-center px-10 py-6 rounded-3xl
                                    ${lastScoreResult.isCorrect ? 'bg-primary/90 text-primary-foreground' : 'bg-destructive/90 text-destructive-foreground'}
                                `}>
                                    <div className="text-5xl font-black font-display mb-2">
                                        {lastScoreResult.isCorrect ? `+${lastScoreResult.finalScore}` : '0'}
                                    </div>
                                    {lastScoreResult.isCorrect && lastScoreResult.timeBonus > 0 && (
                                        <div className="text-sm font-bold opacity-80">
                                            +{lastScoreResult.timeBonus} speed bonus
                                        </div>
                                    )}
                                    {lastScoreResult.streakMultiplier > 1 && (
                                        <div className="text-sm font-bold opacity-80">
                                            x{lastScoreResult.streakMultiplier.toFixed(1)} streak
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Power-ups Bar */}
            {fullConfig.is_powerup_enabled && powerups.length > 0 && (
                <footer className="bg-card border-t border-border px-6 py-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
                        {powerups.map(powerup => {
                            if (powerup.quantity <= 0) return null;
                            
                            const Icon = {
                                'FIFTY_FIFTY': Divide,
                                'TIME_FREEZE': Clock,
                                'DOUBLE_POINTS': Star,
                                'SKIP': SkipForward
                            }[powerup.type];

                            const label = {
                                'FIFTY_FIFTY': '50/50',
                                'TIME_FREEZE': 'Freeze',
                                'DOUBLE_POINTS': '2x',
                                'SKIP': 'Skip'
                            }[powerup.type];

                            return (
                                <button
                                    key={powerup.type}
                                    onClick={() => handlePowerUp(powerup.type)}
                                    disabled={showFeedback || powerup.isActive}
                                    className={`
                                        flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all
                                        ${powerup.isActive ? 'bg-primary/20 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'}
                                    `}
                                >
                                    <Icon size={24} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                                    <span className="text-xs font-bold">x{powerup.quantity}</span>
                                </button>
                            );
                        })}
                    </div>
                </footer>
            )}
        </div>
    );
}

// =============================================================================
// GAME RESULTS
// =============================================================================

interface GameResultsProps {
    result: GameResult;
    onPlayAgain: () => void;
    onExit: () => void;
}

function GameResults({ result, onPlayAgain, onExit }: GameResultsProps) {
    const isPassed = result.scorePercentage >= 60;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-card rounded-[3rem] border border-border/50 p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                {/* Trophy */}
                <div className={`
                    w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-8
                    ${isPassed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                `}>
                    <Trophy size={48} />
                </div>

                <h1 className="text-4xl font-black text-foreground font-display tracking-tight mb-2">
                    {isPassed ? 'Victory!' : 'Keep Practicing!'}
                </h1>
                <p className="text-muted-foreground font-bold mb-8">{result.nodeTitle}</p>

                {/* Score */}
                <div className="text-6xl font-black text-foreground font-display mb-2">
                    {result.totalScore.toLocaleString()}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">
                    Points Earned
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-muted/30 rounded-2xl p-4">
                        <div className="text-2xl font-black text-primary font-display">{result.correctAnswers}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Correct</div>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4">
                        <div className="text-2xl font-black text-foreground font-display">{result.scorePercentage}%</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4">
                        <div className="text-2xl font-black text-accent font-display">{result.maxStreak}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Max Streak</div>
                    </div>
                </div>

                {/* Config Summary */}
                <div className="flex justify-center gap-3 mb-8">
                    {result.config.is_srs_enabled && (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[9px] font-black uppercase tracking-widest">
                            SRS Mode
                        </span>
                    )}
                    {result.config.is_speed_scoring_enabled && (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                            Speed Scoring
                        </span>
                    )}
                    {result.masteryAchieved && (
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
                            Mastery Achieved
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onExit}
                        className="flex-1 py-4 bg-muted text-foreground font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:bg-muted/80 transition-all"
                    >
                        Exit
                    </button>
                    <button
                        onClick={onPlayAgain}
                        className="flex-1 py-4 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function GameSessionPage() {
    const params = useParams();
    const router = useRouter();
    const nodeId = params?.nodeId as string;

    const [phase, setPhase] = useState<'config' | 'playing'>('config');
    const [gameConfig, setGameConfig] = useState<Partial<GameSessionConfig>>({});

    // Load node and questions
    const node = useMemo(() => mockExamConfigs.find(e => e.id === nodeId), [nodeId]);
    const questions = useMemo(() => nodeId ? getQuestionsForExam(nodeId) : [], [nodeId]);

    const handleStart = (config: Partial<GameSessionConfig>) => {
        setGameConfig(config);
        setPhase('playing');
    };

    const handleComplete = (result: GameResult) => {
        console.log('Game completed:', result);
        // Could save to localStorage or API here
    };

    const handleExit = () => {
        router.push('/game');
    };

    if (!node || questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-2xl flex items-center justify-center mb-6">
                        <AlertTriangle size={40} className="text-destructive" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground font-display mb-2">Game Not Found</h1>
                    <p className="text-muted-foreground mb-6">The requested game could not be loaded.</p>
                    <Link
                        href="/game"
                        className="px-6 py-3 bg-foreground text-background font-black font-display text-sm rounded-xl"
                    >
                        Back to Games
                    </Link>
                </div>
            </div>
        );
    }

    if (phase === 'config') {
        return <GameConfigSelect node={node} onStart={handleStart} onBack={handleExit} />;
    }

    return (
        <GamePlayer
            node={node}
            questions={questions}
            config={gameConfig}
            onComplete={handleComplete}
            onExit={handleExit}
        />
    );
}
