"use client";

import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";
import {
    Gamepad2,
    Music,
    Layers
} from "lucide-react";

const routes = [
    {
        title: "Play Games",
        description: "Interactive Japanese learning games.",
        href: "/game/play",
        icon: <Gamepad2 className="w-8 h-8 text-brand-peach" />,
    },
    {
        title: "Flashcards",
        description: "SRS Flashcards for vocabulary retention.",
        href: "/game/flashcards",
        icon: <Layers className="w-8 h-8 text-brand-blue" />,
    },
    {
        title: "Songify Vocabulary",
        description: "Learn vocabulary through songs.",
        href: "/game/songify-vocabulary",
        icon: <Music className="w-8 h-8 text-green-500" />,
    },
];

export default function GamePage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-brand-dark mb-8 text-center">Games</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <ClayCard className="h-full hover:scale-105 transition-transform cursor-pointer flex flex-col items-center text-center p-8">
                            <div className="mb-4 p-4 bg-brand-peach/10 rounded-full group-hover:bg-brand-peach/20 transition-colors">
                                {route.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">{route.title}</h2>
                            <p className="text-gray-600">{route.description}</p>
                        </ClayCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
