"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center bg-brand-cream p-4 text-center">
            <div className="max-w-md rounded-xl border-2 border-brand-dark bg-white p-8 shadow-hard">
                <h2 className="mb-4 text-2xl font-black text-brand-dark">Something went wrong!</h2>
                <p className="mb-6 font-medium text-brand-dark/70">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>
                <button
                    onClick={() => reset()}
                    className="rounded-lg border-2 border-brand-dark bg-brand-blue px-6 py-2.5 font-bold text-brand-dark shadow-hard-sm transition-all hover:translate-y-[1px] hover: active:translate-y-[2px] active:shadow-none"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
