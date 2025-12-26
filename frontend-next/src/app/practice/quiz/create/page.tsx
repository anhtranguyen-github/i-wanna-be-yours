"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy Quiz Create Route - Redirects to unified practice create
 */
export default function LegacyQuizCreateRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/practice/create");
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Redirecting...
            </div>
        </div>
    );
}
