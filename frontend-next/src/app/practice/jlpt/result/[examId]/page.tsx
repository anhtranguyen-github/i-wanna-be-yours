"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Legacy JLPT Result Route - Redirects to unified practice result
 */
export default function LegacyJLPTResultRedirect() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.examId as string | undefined;

    useEffect(() => {
        // Redirect to unified practice result route
        const targetUrl = examId ? `/practice/result/${examId}` : "/practice";
        router.replace(targetUrl);
    }, [router, examId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-display">
                Redirecting...
            </div>
        </div>
    );
}
