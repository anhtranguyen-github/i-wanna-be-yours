"use client";

import Link from "next/link";
import { Gamepad2, Music, Layers, Trophy } from "lucide-react";

const routes = [
    {
        title: "Play Games",
        description: "Interactive Japanese learning games.",
        href: "/game/play",
        icon: <Gamepad2 className="w-6 h-6" />,
        color: "bg-secondary text-secondary-foreground"
    },
    {
        title: "Flashcards",
        description: "SRS Flashcards for vocabulary retention.",
        href: "/flashcards",
        icon: <Layers className="w-6 h-6" />,
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "Songify Vocabulary",
        description: "Learn vocabulary through songs.",
        href: "/game/songify-vocabulary",
        icon: <Music className="w-6 h-6" />,
        color: "bg-primary/10 text-primary"
    },
];

export default function GamePage() {
    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-card border-b border-border px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground font-display">
                        Game <span className="text-primary">Center</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">Learn through play</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Daily Challenge */}
                <div className="bg-card rounded-2xl border border-border p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Daily Challenge</h2>
                            <p className="text-sm text-muted-foreground">Complete today's mini-game to keep your streak!</p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors">
                        Play Now
                    </button>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <div className="bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors h-full flex flex-col items-center text-center">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${route.color}`}>
                                    {route.icon}
                                </div>
                                <h2 className="text-lg font-bold text-foreground mb-2">{route.title}</h2>
                                <p className="text-sm text-muted-foreground">{route.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
