'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
    useEffect(() => { console.error(error); }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8">
                <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
                <p className="text-neutral-ink mb-6 text-sm">We couldn't load your flashcards. This might be a temporary issue.</p>
                <div className="flex gap-3">
                    <Link href="/flashcards" className="flex-1 py-3 bg-muted rounded-xl font-bold text-foreground text-center hover:bg-muted/80 transition-colors">Go Back</Link>
                    <button onClick={() => reset()} className="flex-1 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2">
                        <RefreshCcw size={16} /> Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
