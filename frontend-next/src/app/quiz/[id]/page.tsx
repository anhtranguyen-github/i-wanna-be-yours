"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function QuizRedirect() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;

    useEffect(() => {
        const targetUrl = id ? `/practice/quiz/${id}` : "/practice";
        router.replace(targetUrl);
    }, [router, id]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Synchronizing Quiz Node...
            </div>
        </div>
    );
}
