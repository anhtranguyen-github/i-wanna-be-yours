"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        <html>
            <body>
                <div className="flex h-screen flex-col items-center justify-center bg-brand-cream p-4 text-center font-sans">
                    <div className="max-w-md rounded-xl border-2 border-brand-dark bg-white p-8 shadow-hard">
                        <h2 className="mb-4 text-2xl font-black text-brand-dark">Critical Error</h2>
                        <p className="mb-6 font-medium text-brand-dark/70">
                            Something went wrong, and we couldn&apos;t load the application.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="rounded-lg border-2 border-brand-dark bg-brand-blue px-6 py-2.5 font-bold text-brand-dark shadow-hard-sm transition-all hover:translate-y-[1px] hover: active:translate-y-[2px] active:shadow-none"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
