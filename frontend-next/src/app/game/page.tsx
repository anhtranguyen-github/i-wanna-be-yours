"use client";

import Link from "next/link";
import {
    Gamepad2,
    Music,
    Layers,
    Trophy
} from "lucide-react";

const routes = [
    {
        title: "Play Games",
        description: "Interactive Japanese learning games.",
        href: "/game/play",
        icon: <Gamepad2 className="w-8 h-8 text-brand-peach" />,
        color: "bg-brand-peach"
    },
    {
        title: "Flashcards",
        description: "SRS Flashcards for vocabulary retention.",
        href: "/flashcards",
        icon: <Layers className="w-8 h-8 text-brand-blue" />,
        color: "bg-brand-blue"
    },
    {
        title: "Songify Vocabulary",
        description: "Learn vocabulary through songs.",
        href: "/game/songify-vocabulary",
        icon: <Music className="w-8 h-8 text-brand-green" />,
        color: "bg-brand-green"
    },
];

export default function GamePage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-7xl">
            <h1 className="text-4xl font-display font-extrabold text-brand-dark mb-12 text-center">
                Game <span className="text-brand-orange">Center</span>
            </h1>

            <div className="bg-white rounded-2xl p-8 mb-12 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold font-display text-brand-dark mb-2">Daily Challenge</h2>
                    <p className="text-gray-500">Complete today's mini-game to keep your streak alive!</p>
                </div>
                <button className="clay-button bg-brand-orange text-white px-8 py-3 hover:bg-brand-orange/90 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Play Now
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <div className="clay-card h-full hover:-translate-y-2 transition-transform cursor-pointer flex flex-col items-center text-center p-8 bg-white relative overflow-hidden">
                            <div className={`mb-6 p-5 rounded-2xl ${route.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
                                {route.icon}
                            </div>
                            <h2 className="text-2xl font-display font-bold text-brand-dark mb-3">{route.title}</h2>
                            <p className="text-gray-500 font-medium leading-relaxed">{route.description}</p>

                            {/* Decorative blur */}
                            <div className={`absolute -bottom-10 -right-10 w-24 h-24 ${route.color} rounded-full blur-3xl opacity-20`} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
