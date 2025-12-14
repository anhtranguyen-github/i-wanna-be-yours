import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-brand-salmon" size={48} />
            <p className="text-brand-dark font-medium animate-pulse text-lg">Loading Study Hub...</p>
        </div>
    );
}
