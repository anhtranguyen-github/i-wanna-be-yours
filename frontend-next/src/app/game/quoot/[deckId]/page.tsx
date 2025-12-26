"use client";

import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

/**
 * Legacy Quoot Route - Redirects to /quoot/[deckId]
 */
export default function LegacyQuootRedirect() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const deckId = params?.deckId as string | undefined;
    const mode = searchParams.get('mode');

    useEffect(() => {
        const targetUrl = deckId
            ? `/quoot/${deckId}${mode ? `?mode=${mode}` : ''}`
            : "/quoot";
        router.replace(targetUrl);
    }, [router, deckId, mode]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Redirecting to Quoot...
            </div>
        </div>
    );
}
