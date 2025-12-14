'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertOctagon } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-clay border border-white/50 max-w-md w-full">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertOctagon size={32} />
                </div>
                <h2 className="text-2xl font-black text-brand-dark mb-2">Something went wrong!</h2>
                <p className="text-slate-500 mb-6">
                    We couldn't load your flashcards. This might be due to a connection issue or a temporary glitch.
                </p>
                <button
                    onClick={() => reset()}
                    className="w-full flex items-center justify-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark/90 transition-all shadow-lg active:scale-95"
                >
                    <RefreshCcw size={18} />
                    <span>Try again</span>
                </button>
            </div>
        </div>
    );
}
