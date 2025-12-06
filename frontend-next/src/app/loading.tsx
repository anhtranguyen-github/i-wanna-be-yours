export default function Loading() {
    return (
        <div className="flex h-full items-center justify-center bg-brand-cream/50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-dark border-t-brand-blue"></div>
                <p className="font-bold text-brand-dark animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
