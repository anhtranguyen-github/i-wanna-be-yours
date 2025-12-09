"use client";

import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";
import { MessageCircle } from "lucide-react";

const routes = [
    {
        title: "AI Tutor",
        description: "Practice Japanese with an AI conversational partner.",
        href: "/chat/ai-tutor",
        icon: <MessageCircle className="w-8 h-8 text-brand-blue" />,
    },
];

export default function ChatPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold text-brand-dark mb-8 text-center">Chat</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href} className="group">
                        <ClayCard className="h-full hover:scale-105 transition-transform cursor-pointer flex flex-col items-center text-center p-8">
                            <div className="mb-4 p-4 bg-brand-blue/10 rounded-full group-hover:bg-brand-blue/20 transition-colors">
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
