"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JLPTExamRedirect() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.examId as string | undefined;

    useEffect(() => {
        const targetUrl = examId ? `/practice/jlpt/session/${examId}` : "/practice";
        router.replace(targetUrl);
    }, [examId]); // Only depend on examId, router is stable

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Calibrating Session...
            </div>
        </div>
    );
}
