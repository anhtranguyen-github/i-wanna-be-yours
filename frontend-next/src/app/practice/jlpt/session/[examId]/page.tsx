"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Legacy JLPT Session Route - Redirects to unified practice session
 */
export default function LegacyJLPTSessionRedirect() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.examId as string | undefined;

    useEffect(() => {
        // Redirect to unified practice session route
        const targetUrl = examId ? `/practice/session/${examId}` : "/practice";
        router.replace(targetUrl);
    }, [router, examId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Redirecting...
            </div>
        </div>
    );
}
