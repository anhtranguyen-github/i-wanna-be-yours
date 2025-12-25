"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Top-level Quiz Redirect - Routes to unified practice session
 */
export default function QuizRedirect() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;

    useEffect(() => {
        // Redirect to unified practice session route
        const targetUrl = id ? `/practice/session/${id}` : "/practice";
        router.replace(targetUrl);
    }, [router, id]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-display">
                Synchronizing Quiz Node...
            </div>
        </div>
    );
}
