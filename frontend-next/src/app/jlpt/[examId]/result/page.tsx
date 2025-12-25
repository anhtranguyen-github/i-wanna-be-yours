"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function JLPTResultRedirect() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.examId;

    useEffect(() => {
        if (examId) {
            router.replace(`/practice/jlpt/result/${examId}`);
        } else {
            router.replace("/practice");
        }
    }, [router, examId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Retrieving Analytics...
            </div>
        </div>
    );
}
