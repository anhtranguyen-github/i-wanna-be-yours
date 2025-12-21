'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import studyPlanService from '@/services/studyPlanService';
import { StudyPlanDetail } from '@/types/studyPlanTypes';

export function useStudyPlanStatus() {
    const { user, loading: userLoading } = useUser();
    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPlan = async () => {
            setLoading(true);
            if (!user) {
                setPlan(null);
                setLoading(false);
                return;
            }

            try {
                const activePlan = await studyPlanService.getActivePlan();
                setPlan(activePlan);
            } catch (error) {
                console.error('Failed to fetch plan status', error);
                setPlan(null);
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading) {
            checkPlan();
        }
    }, [user, userLoading]);

    return {
        hasPlan: !!plan,
        plan,
        loading: loading || userLoading,
        user
    };
}
