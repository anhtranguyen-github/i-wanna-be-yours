'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useStudyPlanStatus } from '@/hooks/useStudyPlanStatus';
import { StudyPlanLanding } from '@/components/study-plan/StudyPlanLanding';
import { StudyPlanDashboard } from '@/components/study-plan/StudyPlanDashboard';

function StudyPlanPageContent() {
    const { user, hasPlan, plan, loading } = useStudyPlanStatus();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Guest view or Logged in without plan
    if (!user || !hasPlan) {
        return <StudyPlanLanding user={user} hasPlan={hasPlan} plan={plan} />;
    }

    // Logged in with plan -> Dashboard
    return <StudyPlanDashboard />;
}

export default function StudyPlanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <StudyPlanPageContent />
        </Suspense>
    );
}
