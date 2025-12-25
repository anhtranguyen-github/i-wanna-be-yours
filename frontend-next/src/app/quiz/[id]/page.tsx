"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function QuizRedirect() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    useEffect(() => {
        if (id) {
            router.replace(`/practice/quiz/${id}`);
        } else {
            router.replace("/practice");
        }
    }, [router, id]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Synchronizing Quiz Node...
            </div>
        </div>
    );
}
