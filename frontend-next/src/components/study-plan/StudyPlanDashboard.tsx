'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Calendar, Target, Clock, CheckCircle2,
    Play, Loader2, Settings,
    BookOpen, Sparkles, Lock,
    BarChart3, Activity, Zap, History, PieChart,
    AlertTriangle, Brain, ArrowRight
} from 'lucide-react';
import {
    StudyPlanDetail,
    DailyTask,
    JLPT_LEVEL_INFO,
} from '@/types/studyPlanTypes';
import { PlanCheckoutModal } from '@/components/strategy/PlanCheckoutModal';
import studyPlanService from '@/services/studyPlanService';
import learnerProgressService from '@/services/learnerProgressService';
import { strategyService } from '@/services/strategyService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
import { useUser } from '@/context/UserContext';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

// New Strategy Components
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { StatCard } from '@/components/ui/stat-card';
import { ExpandableSection } from '@/components/ui/expandable-section';
import { HELP_CONTENT } from '@/data/helpContent';
import { SMARTGoalCard } from '@/components/strategy/SMARTGoalCard';
import { SMARTGoalDetailModal } from '@/components/strategy/SMARTGoalDetailModal';
import { OKRObjectiveCard } from '@/components/strategy/OKRObjectiveCard';
import { PACTDailyCard } from '@/components/strategy/PACTDailyCard';
import { PriorityMatrixCard } from '@/components/strategy/PriorityMatrixCard';
import { ContextCheckInModal } from '@/components/strategy/ContextCheckInModal';
import {
    OKRGoalEnhanced,
    PACTStatEnhanced,
    PriorityMatrix,
    SMARTGoalEnhanced
} from '@/mocks/strategyMockData';

type DashboardTab = 'STRATEGY' | 'PERFORMANCE' | 'TASKS' | 'DIAGNOSTICS';

export function StudyPlanDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<DashboardTab>('STRATEGY');
    const [showNewPlanBanner, setShowNewPlanBanner] = useState(false);

    // Strategic data states
    const [smartGoals, setSmartGoals] = useState<SMARTGoalEnhanced[]>([]);
    const [okrs, setOkrs] = useState<OKRGoalEnhanced[]>([]);
    const [pactState, setPactState] = useState<PACTStatEnhanced | null>(null);
    const [matrix, setMatrix] = useState<PriorityMatrix | null>(null);

    // Modal states
    const [selectedSMARTGoal, setSelectedSMARTGoal] = useState<SMARTGoalEnhanced | null>(null);
    const [showSMARTModal, setShowSMARTModal] = useState(false);
    const [showContextModal, setShowContextModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutData, setCheckoutData] = useState<any>(null);

    // Performance History Mock Data
    const performanceData: any[] = [
        { subject: 'Vocabulary', A: 120, fullMark: 150 },
        { subject: 'Grammar', A: 98, fullMark: 150 },
        { subject: 'Reading', A: 86, fullMark: 150 },
        { subject: 'Listening', A: 110, fullMark: 150 },
        { subject: 'Kanji', A: 130, fullMark: 150 },
    ];

    const retentionHistory: any[] = [
        { date: 'Mon', power: 85 },
        { date: 'Tue', power: 82 },
        { date: 'Wed', power: 88 },
        { date: 'Thu', power: 84 },
        { date: 'Fri', power: 90 },
        { date: 'Sat', power: 87 },
        { date: 'Sun', power: 92 },
    ];

    useEffect(() => {
        if (!userLoading && !user) {
            // In the merged view, we don't redirect to login here, 
            // the parent will handle showing the landing page.
            return;
        }
        if (user) loadData();

        // Check for pending guest setup
        if (!userLoading && user) {
            const pendingSetup = localStorage.getItem('pending_study_plan_setup');
            if (pendingSetup) {
                try {
                    const data = JSON.parse(pendingSetup);
                    setCheckoutData(data);
                    setShowCheckout(true);
                } catch (e) {
                    console.error('Failed to parse pending setup', e);
                    localStorage.removeItem('pending_study_plan_setup');
                }
            }
        }
    }, [user, userLoading]);

    const handleConfirmCheckout = async () => {
        if (!checkoutData) return;

        try {
            setCreating(true);
            const result = await studyPlanService.createMyPlan(
                checkoutData.targetLevel,
                new Date(checkoutData.examDate),
                {
                    daily_study_minutes: checkoutData.dailyMinutes,
                    study_days_per_week: checkoutData.studyDays,
                    preferred_focus: checkoutData.focusAreas,
                }
            );

            localStorage.removeItem('pending_study_plan_setup');
            setShowCheckout(false);
            setShowNewPlanBanner(true);

            // Reload dashboard with the new plan
            router.push(`/study-plan?plan=${result.id}&new=true`);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to create plan');
        } finally {
            setCreating(false);
        }
    };

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const planId = searchParams.get('plan');
            let planData = planId ? await studyPlanService.getPlan(planId) : await studyPlanService.getActivePlan();

            if (planData) {
                setPlan(planData);

                const uid = String(user.id);

                const [
                    tasksResponse,
                    activitiesResponse,
                    smartGoalsRes,
                    okrsRes,
                    pactRes,
                    pactStatusRes,
                    matrixRes
                ] = await Promise.all([
                    studyPlanService.getMyDailyTasks(),
                    learnerProgressService.getMyActivities(10),
                    strategyService.getSmartGoals(uid),
                    strategyService.getOKRs(uid),
                    strategyService.getPactCommitment(uid),
                    strategyService.getPactDailyStatus(uid),
                    strategyService.getPriorityMatrix(uid)
                ]);

                setTasks(tasksResponse.tasks || []);
                setActivities(activitiesResponse.activities || []);

                if (smartGoalsRes) {
                    setSmartGoals(smartGoalsRes.map((g: any) => ({
                        ...g,
                        id: g._id || g.id,
                        title: g.title || 'Untitled Goal',
                        deadline: g.time_bound_deadline || new Date().toISOString(),
                        specific: g.specific || 'No description provided',
                        measurable: `Reach ${g.measurable_target} ${g.measurable_metric?.replace(/_/g, ' ')}`,
                        achievable: `Active Goal`,
                        relevant: `Critical for ${g.relevant_jlpt_section || 'JLPT Prep'}`,
                        timeBound: `Deadline: ${new Date(g.time_bound_deadline).toLocaleDateString()}`,
                        progress: g.progress_percent || 0,
                        status: g.status || 'active',
                        linked_jlpt_level: planData.target_level || 'N3',
                        ai_confidence_score: g.ai_confidence_score || 85,
                        baseline_score: g.measurable_baseline || 0,
                        target_score: g.measurable_target || 100,
                        ai_recommended_adjustments: g.ai_recommended_adjustments || [],
                        success_criteria: (g.success_criteria || []).map((sc: any) => ({
                            id: sc.id || String(Math.random()),
                            label: sc.description || 'Success Metric',
                            current_value: sc.current_value || 0,
                            target_value: sc.target_value || 100,
                            unit: sc.metric_type || '',
                            weight: 1
                        }))
                    })));
                }

                if (okrsRes) {
                    setOkrs(okrsRes.map((o: any) => ({
                        ...o,
                        id: o._id || o.id,
                        progress: o.progress_percent || 0,
                        blockers: o.blockers || [],
                        on_track: o.on_track ?? true,
                        risk_level: o.risk_level || 'low',
                        keyResults: (o.key_results || []).map((kr: any) => ({
                            ...kr,
                            id: kr.id || String(Math.random()),
                            progress: kr.progress_percent || 0,
                            trend: kr.trend || 'stable',
                            velocity: kr.velocity || 0,
                            confidence: kr.confidence || 0,
                            contributing_task_types: kr.contributing_task_types || [],
                            items: kr.items || []
                        }))
                    })));
                }

                if (pactRes) {
                    setPactState({
                        ...pactRes,
                        actions: (pactRes.actions || []).map((a: any) => ({
                            ...a,
                            completed_today: (pactStatusRes || []).some((s: any) => s.id === a.id && s.completed)
                        })),
                        streak_current: pactRes.streak_current || 0,
                        last_context: pactRes.last_context || null
                    });
                }

                if (matrixRes) {
                    setMatrix({
                        ...matrixRes,
                        content_items: matrixRes.items || [],
                        skills: matrixRes.skills || [],
                        today_focus: matrixRes.today_focus || 'drill_practice',
                        today_time_allocation: matrixRes.recommended_time_allocation || matrixRes.today_time_allocation || null
                    });
                }
            }
        } catch (err: any) {
            console.error('Error loading dashboard data:', err);
            setError(err.message || 'Failed to load study plan');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskComplete = async (taskId: string) => {
        try {
            await studyPlanService.completeTask(taskId);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t));
        } catch (err) { console.error(err); }
    };

    const handleSMARTGoalClick = (goal: SMARTGoalEnhanced) => {
        setSelectedSMARTGoal(goal);
        setShowSMARTModal(true);
    };

    const handlePACTActionToggle = async (actionId: string) => {
        if (!user) return;
        try {
            setPactState(prev => prev ? ({
                ...prev,
                actions: (prev.actions || []).map(a =>
                    a.id === actionId ? { ...a, completed_today: !a.completed_today } : a
                )
            }) : null);

            await strategyService.completePactAction(actionId, String(user.id), {
                energy_level: 7, mood: 'focused'
            });
        } catch (err) { console.error('Failed to toggle PACT action:', err); }
    };

    const handleContextSubmit = async (context: any) => {
        if (!user) return;
        try {
            await strategyService.submitCheckin({ ...context, user_id: String(user.id) });
            setShowContextModal(false);
            loadData();
        } catch (err) { console.error('Failed to submit context:', err); }
    };

    if (userLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-600 tracking-tight">Syncing Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!plan) return <NoPlanView user={user} openAuth={openAuth} />;

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];

    return (
        <div className="min-h-screen bg-secondary pb-12">
            <div className="bg-neutral-white border-b border-neutral-gray/30 sticky top-16 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-beige border border-neutral-gray/20 rounded-2xl shadow-inner text-primary-strong flex items-center justify-center">
                            <Zap size={24} className="fill-primary-strong text-primary-strong" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-neutral-ink tracking-tight font-display uppercase tracking-widest text-xs">Strategy Command</h1>
                            </div>
                            <p className="text-[10px] text-neutral-ink font-black flex items-center gap-2 uppercase tracking-widest font-display">
                                <span className={`w-2.5 h-2.5 rounded-full bg-primary-strong animate-pulse`} />
                                Mission: JLPT {plan.target_level} {levelInfo.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-neutral-beige p-1.5 rounded-2xl gap-1 overflow-x-auto border border-neutral-gray/20">
                        {[
                            { id: 'STRATEGY', label: 'Strategy', icon: Target },
                            { id: 'TASKS', label: 'Tasks', icon: BookOpen },
                            { id: 'DIAGNOSTICS', label: 'Diagnostics', icon: AlertTriangle },
                            { id: 'PERFORMANCE', label: 'Vault', icon: BarChart3 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as DashboardTab)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap font-display
                                    ${activeTab === tab.id ? 'bg-neutral-white text-primary-strong shadow-md border border-neutral-gray/10' : 'text-neutral-ink hover:text-neutral-ink'}
                                `}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowContextModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-sky/20 text-primary-sky font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-sky/30 transition-colors font-display shadow-sm">
                            <Brain size={16} /> Check-in
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'STRATEGY' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="relative overflow-hidden bg-primary-strong rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl shadow-primary/30">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/20 rounded-full text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 font-display">
                                        <Sparkles size={16} className="animate-pulse" /> Sensei&apos;s Directive
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight font-display">
                                        {Math.round(plan.overall_progress_percent) < 10 ? <>The Journey <span className="opacity-60 italic">Begins Today.</span></> : <>Your Momentum is <span className="opacity-60 italic">Building.</span></>}
                                    </h2>
                                    <div className="flex flex-wrap gap-5 pt-4">
                                        <button onClick={() => setActiveTab('TASKS')} className="px-10 py-5 bg-neutral-white text-neutral-ink rounded-[1.5rem] font-black transition-all flex items-center gap-4 shadow-2xl active:scale-95 group font-display uppercase tracking-widest text-xs">
                                            Resume Study <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Days Remaining" value={plan.days_remaining} unit="days" icon={Calendar} iconColor="text-blue-500" />
                            <StatCard label="Overall Progress" value={Math.round(plan.overall_progress_percent)} unit="%" icon={Target} iconColor="text-primary" />
                            <StatCard label="Study Streak" value={pactState?.streak_current || 0} unit="days" icon={Zap} iconColor="text-orange-500" />
                            <StatCard label="Vocab Mastered" value={okrs[0]?.keyResults[0]?.current || 0} unit="words" icon={BookOpen} iconColor="text-emerald-500" />
                        </div>

                        <ExpandableSection title="OKR: Strategic Vision" icon={Target} defaultOpen badge={okrs.length}>
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                {okrs.map(okr => (
                                    <OKRObjectiveCard key={okr.id} okr={okr} onClick={() => { }} />
                                ))}
                            </div>
                        </ExpandableSection>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {pactState && <PACTDailyCard pact={pactState} onActionToggle={handlePACTActionToggle} onContextCheckIn={() => setShowContextModal(true)} />}
                            <div className="space-y-4">
                                {smartGoals.map(goal => <SMARTGoalCard key={goal.id} goal={goal} onClick={() => handleSMARTGoalClick(goal)} />)}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'DIAGNOSTICS' && (
                    <div className="space-y-8 animate-fadeIn">
                        {matrix && <PriorityMatrixCard matrix={matrix} onItemClick={() => { }} onViewAll={() => { }} />}
                    </div>
                )}

                {activeTab === 'TASKS' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                        <div className="lg:col-span-8">
                            <div className="bg-neutral-white rounded-[2.5rem] border border-neutral-gray/20 p-10 shadow-lg">
                                <h2 className="text-xs font-black text-neutral-ink flex items-center gap-4 mb-10 font-display uppercase tracking-[0.2em]">
                                    <BookOpen className="text-primary-strong" /> Today&apos;s Tactical Board
                                </h2>
                                <div className="space-y-6">
                                    {tasks.map((task, idx) => (
                                        <div key={task.id || idx} className={`p-8 rounded-[2rem] border-2 flex items-center gap-8 transition-all ${task.status === 'completed' ? 'bg-neutral-beige/50 border-transparent opacity-60' : 'bg-neutral-white border-neutral-gray/20 shadow-sm hover:border-primary/30'}`}>
                                            <button onClick={() => task.id && handleTaskComplete(task.id)} disabled={task.status === 'completed'} className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner transition-all ${task.status === 'completed' ? 'bg-primary-strong text-white' : 'bg-neutral-beige text-neutral-gray hover:text-primary-strong'}`}>
                                                {task.status === 'completed' ? <CheckCircle2 size={32} /> : <Play size={28} className="translate-x-0.5" />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-2xl font-black tracking-tight ${task.status === 'completed' ? 'text-neutral-gray line-through' : 'text-neutral-ink font-display'}`}>{task.title}</h3>
                                                <p className="text-neutral-ink font-bold text-sm leading-relaxed mt-1">{task.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'PERFORMANCE' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                        <div className="lg:col-span-12 bg-neutral-white rounded-[2.5rem] border border-neutral-gray/20 p-10 shadow-lg">
                            <h2 className="text-[10px] font-black text-neutral-ink flex items-center gap-4 mb-10 font-display uppercase tracking-[0.2em]"><PieChart className="text-primary-strong" /> Performance Vault</h2>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                                        <PolarGrid stroke="#E2E8F0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: '#4A4A4A' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="You" dataKey="A" stroke="#F6AD55" fill="#F6AD55" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </main >

            <SMARTGoalDetailModal isOpen={showSMARTModal} onClose={() => setShowSMARTModal(false)} goal={selectedSMARTGoal} />
            <ContextCheckInModal isOpen={showContextModal} onClose={() => setShowContextModal(false)} onSubmit={handleContextSubmit} initialContext={pactState?.last_context} />
            {checkoutData && <PlanCheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} onConfirm={handleConfirmCheckout} planSummary={checkoutData} loading={creating} />}
        </div >
    );
}

function NoPlanView({ user, openAuth }: { user: any, openAuth: any }) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-12 text-center">
                <h1 className="text-4xl font-black text-neutral-ink font-display tracking-tight">Strategic Intelligence</h1>
                <p className="text-xl text-neutral-ink font-medium font-display">You don&apos;t have an active study plan yet. Let&apos;s build your roadmap.</p>
                <div className="grid md:grid-cols-2 gap-8 mt-12">
                    <div className="clay-card p-10 bg-white border border-slate-100 shadow-xl shadow-primary/5 group hover:border-primary transition-all">
                        <Target size={48} className="text-primary mx-auto mb-6 group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-black text-neutral-ink mb-4 font-display uppercase tracking-widest text-xs">New Plan</h2>
                        <Link href="/study-plan/setup" className="btnPrimary w-full py-4 text-center block bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20">Create Study Plan</Link>
                    </div>
                    <div className="clay-card p-10 bg-slate-900 text-white shadow-2xl group hover:shadow-primary/10 transition-all">
                        <Lock size={48} className="text-primary mx-auto mb-6 group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-black mb-4 font-display uppercase tracking-widest text-xs">Sync Data</h2>
                        <button onClick={() => openAuth('REGISTER')} className="w-full py-4 bg-white text-neutral-ink rounded-2xl font-black shadow-lg">Log In</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
