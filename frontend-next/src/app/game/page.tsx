"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Music, Layers, Trophy, Brain, Zap, Target, Sparkles } from "lucide-react";
import { mockExamConfigs } from "@/data/mockPractice";

export default function GamePage() {
    const router = useRouter();

    // Get a few practice nodes to show as game options
    const gameNodes = mockExamConfigs.slice(0, 6);

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-card border-b border-border px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-black text-foreground font-display tracking-tight">
                        Game <span className="text-primary">Center</span>
                    </h1>
                    <p className="text-muted-foreground font-bold mt-2">Learn through competitive play</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Feature Banner */}
                <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-[2rem] border border-border p-8 mb-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                                <Zap size={32} className="text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground font-display tracking-tight">
                                    Hybrid Assessment Mode
                                </h2>
                                <p className="text-muted-foreground font-bold">
                                    Speed scoring, SRS mastery, and power-ups in one competitive experience
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Zap size={12} /> Speed Scoring
                            </span>
                            <span className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Target size={12} /> SRS Mode
                            </span>
                            <span className="px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={12} /> Power-ups
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Link href="/flashcards">
                        <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg h-full flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <h2 className="text-lg font-black text-foreground font-display mb-2">Flashcards</h2>
                            <p className="text-sm text-muted-foreground font-bold">SRS Flashcards for vocabulary</p>
                        </div>
                    </Link>
                    <Link href="/practice">
                        <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg h-full flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                <Brain size={24} />
                            </div>
                            <h2 className="text-lg font-black text-foreground font-display mb-2">Practice Hub</h2>
                            <p className="text-sm text-muted-foreground font-bold">JLPT & Quiz practice</p>
                        </div>
                    </Link>
                    <Link href="/game/songify-vocabulary">
                        <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg h-full flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                                <Music size={24} />
                            </div>
                            <h2 className="text-lg font-black text-foreground font-display mb-2">Songify</h2>
                            <p className="text-sm text-muted-foreground font-bold">Learn through music</p>
                        </div>
                    </Link>
                </div>

                {/* Game Sessions */}
                <div className="mb-8">
                    <h3 className="text-xl font-black text-foreground font-display tracking-tight mb-6">
                        Start a Game Session
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameNodes.map((node) => (
                            <div
                                key={node.id}
                                onClick={() => router.push(`/game/session/${node.id}`)}
                                className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Gamepad2 size={24} className="text-primary" />
                                    </div>
                                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-[10px] font-black uppercase tracking-widest">
                                        {node.tags.level}
                                    </span>
                                </div>
                                <h4 className="text-lg font-black text-foreground font-display mb-2 group-hover:text-primary transition-colors">
                                    {node.title}
                                </h4>
                                <p className="text-sm text-muted-foreground font-bold mb-4 line-clamp-2">
                                    {node.description}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>{node.stats.questionCount} questions</span>
                                    {node.stats.timeLimitMinutes && (
                                        <span>{node.stats.timeLimitMinutes} min</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Challenge */}
                <div className="bg-card rounded-2xl border border-border p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-foreground font-display">Daily Challenge</h2>
                            <p className="text-sm text-muted-foreground font-bold">Complete today&apos;s mini-game to keep your streak!</p>
                        </div>
                    </div>
                    <button
                        onClick={() => gameNodes[0] && router.push(`/game/session/${gameNodes[0].id}`)}
                        className="px-6 py-3 bg-foreground text-background font-black font-display text-sm uppercase tracking-widest rounded-xl hover:bg-foreground/90 transition-colors"
                    >
                        Play Now
                    </button>
                </div>
            </main>
        </div>
    );
}
