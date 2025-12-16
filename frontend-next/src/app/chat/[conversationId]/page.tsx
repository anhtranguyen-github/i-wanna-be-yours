"use client";

import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';

// Dynamically import ChatScreen with no SSR to avoid window errors
const ChatScreen = dynamic(
    () => import('@/components/chat').then(mod => mod.ChatScreen),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center text-2xl animate-pulse">
                        🌸
                    </div>
                    <p className="text-sm text-slate-400">Loading conversation...</p>
                </div>
            </div>
        )
    }
);

export default function ChatConversationPage() {
    const params = useParams();
    const conversationId = params?.conversationId as string;

    return <ChatScreen conversationId={conversationId} />;
}
