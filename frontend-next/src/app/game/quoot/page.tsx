"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy Quoot Hub Route - Redirects to /quoot
 */
export default function LegacyQuootHubRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');

    useEffect(() => {
        const targetUrl = mode ? `/quoot?mode=${mode}` : "/quoot";
        router.replace(targetUrl);
    }, [router, mode]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-neutral-ink font-display">
                Redirecting to Quoot...
            </div>
        </div>
    );
}
