'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/study-plan');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-brand-salmon mx-auto mb-4" />
                <p className="text-lg font-bold text-slate-600">Redirecting to Strategic Hub...</p>
            </div>
        </div>
    );
}
