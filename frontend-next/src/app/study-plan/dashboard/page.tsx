'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
    Calendar, Target, Clock, CheckCircle2, Circle,
    ChevronRight, Play, Loader2, AlertCircle, Settings,
    TrendingUp, BookOpen, Sparkles, Award, Lock,
    BarChart3, Activity, Zap, History, PieChart,
    ChevronDown, ChevronUp, Share2, Filter, Search
} from 'lucide-react';
import {
    StudyPlanDetail,
    DailyTask,
    JLPT_LEVEL_INFO,
    Milestone,
    FrameworkStats,
    SMARTGoal,
    PACTStat
} from '@/types/studyPlanTypes';
import studyPlanService from '@/services/studyPlanService';
import { useGlobalAuth } from '@/context/GlobalAuthContext';
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
    Tooltip,
    AreaChart,
    Area
} from 'recharts';

type DashboardTab = 'STRATEGY' | 'PERFORMANCE' | 'TASKS';

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: userLoading } = useUser();
    const { openAuth } = useGlobalAuth();

    const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<DashboardTab>('STRATEGY');
    const [showNewPlanBanner, setShowNewPlanBanner] = useState(false);

    // Mock/derived data for strategic pillars (since backend doesn't have it yet)
    const getFrameworkStats = (planData: StudyPlanDetail): FrameworkStats => {
        return {
            okr: {
                objective: `Master JLPT ${planData.target_level} Proficiency`,
                key_results: [
                    { label: 'Vocabulary Core', current: 1240, target: 3000, unit: 'words', progress: 41 },
                    { label: 'Grammar Patterns', current: 65, target: 120, unit: 'points', progress: 54 },
                    { label: 'Kanji Foundation', current: 180, target: 600, unit: 'characters', progress: 30 }
                ]
            },
            pact: {
                commitment_score: 85,
                habit_strength: 78,
                streak: 12,
                recent_sessions: 24,
                daily_metrics: [
                    { label: 'Purpose', value: 'High', icon: '🎯', description: 'Alignment with long-term goals', commitment_level: 90 },
                    { label: 'Action', value: 'Daily', icon: '⚡', description: 'Execution consistency', commitment_level: 85 },
                    { label: 'Commitment', value: '45m', icon: '🤝', description: 'Average daily time pledged', commitment_level: 80 },
                    { label: 'Track', value: 'Active', icon: '📊', description: 'Data recording fidelity', commitment_level: 95 }
                ]
            },
            smart: [
                { id: '1', title: 'N3 Verbs', specific_action: 'Master 50 transitive verbs', deadline: '2023-12-25', is_achievable: true, relevance: 'Reading Section', status: 'active', progress: 65 },
                { id: '2', title: 'Particle Speed', specific_action: 'Complete 10 particle drills', deadline: '2023-12-23', is_achievable: true, relevance: 'Grammar Section', status: 'achieved', progress: 100 },
                { id: '3', title: 'Listening Immersion', specific_action: '30 mins podcast daily', deadline: '2023-12-30', is_achievable: true, relevance: 'Listening Section', status: 'active', progress: 30 }
            ]
        };
    };

    // Performance History Mock Data
    const performanceData = [
        { subject: 'Vocabulary', A: 120, B: 110, fullMark: 150 },
        { subject: 'Grammar', A: 98, B: 130, fullMark: 150 },
        { subject: 'Kanji', A: 86, B: 130, fullMark: 150 },
        { subject: 'Listening', A: 99, B: 100, fullMark: 150 },
        { subject: 'Reading', A: 85, B: 90, fullMark: 150 },
    ];

    const retentionHistory = [
        { date: 'Mon', power: 65 },
        { date: 'Tue', power: 72 },
        { date: 'Wed', power: 68 },
        { date: 'Thu', power: 85 },
        { date: 'Fri', power: 80 },
        { date: 'Sat', power: 92 },
        { date: 'Sun', power: 95 },
    ];

    useEffect(() => {
        if (!userLoading && !user) {
            openAuth('REGISTER', {
                flowType: 'STUDY_PLAN',
                title: "Your Strategic Command Center",
                description: "Unlock OKR goal tracking, PACT consistency habits, and detailed performance analytics."
            });
            return;
        }
        if (user) loadData();
    }, [user, userLoading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const planId = searchParams.get('plan');
            let planData = planId ? await studyPlanService.getPlan(planId) : await studyPlanService.getActivePlan();

            if (planData) {
                // Decorate with framework stats for the UI
                planData.framework_stats = getFrameworkStats(planData);
                setPlan(planData);
                const { tasks: dailyTasks } = await studyPlanService.getMyDailyTasks();
                setTasks(dailyTasks);
            }
        } catch (err: any) {
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

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-brand-salmon/20 rounded-full animate-ping" />
                        <Loader2 className="w-24 h-24 animate-spin text-brand-salmon relative z-10" />
                    </div>
                    <p className="text-xl font-bold text-brand-dark animate-pulse">Initializing Strategic Hub...</p>
                </div>
            </div>
        );
    }

    if (!plan) return <NoPlanView user={user} openAuth={openAuth} />;

    const levelInfo = JLPT_LEVEL_INFO[plan.target_level];
    const stats = plan.framework_stats!;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12">
            {/* Glossy Header Area */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-dark rounded-2xl shadow-xl shadow-brand-dark/20 text-white flex items-center justify-center">
                            <Zap size={24} className="fill-brand-salmon text-brand-salmon" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-brand-dark tracking-tight">Strategy Command</h1>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full bg-brand-green animate-pulse`} />
                                Mission: JLPT {plan.target_level} {levelInfo.name}
                            </p>
                        </div>
                    </div>

                    {/* Dashboard Tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                        {[
                            { id: 'STRATEGY', label: 'Strategy', icon: Target },
                            { id: 'TASKS', label: 'Tactical Tasks', icon: BookOpen },
                            { id: 'PERFORMANCE', label: 'Personal Vault', icon: BarChart3 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as DashboardTab)}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-white text-brand-dark shadow-md ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-brand-dark hover:bg-white/50'}
                                `}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button className="hidden md:flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                        <Settings size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Dynamic Content Based on Tab */}
                {activeTab === 'STRATEGY' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                        {/* 1. OKR VISION (Center Top) */}
                        <div className="lg:col-span-12">
                            <div className="clay-card p-8 bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-salmon/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-salmon/10 rounded-2xl flex items-center justify-center text-brand-salmon">
                                                <Target size={28} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-brand-dark">OKR: Strategic Vision</h2>
                                                <p className="text-slate-500 font-medium">Long-term alignment & success metrics</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-brand-peach drop-shadow-sm">
                                                {Math.round(plan.overall_progress_percent)}%
                                            </span>
                                            <p className="text-xs font-bold text-brand-dark tracking-widest uppercase opacity-40">Global Progress</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-8">
                                        {stats.okr.key_results.map((kr, idx) => (
                                            <div key={idx} className="bg-white/40 backdrop-blur-sm border border-white p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="font-bold text-brand-dark">{kr.label}</h3>
                                                    <span className="text-xs font-black px-2 py-1 bg-brand-peach/20 text-brand-peach rounded-lg">KR {idx + 1}</span>
                                                </div>
                                                <div className="text-3xl font-black text-brand-dark mb-2">
                                                    {kr.current.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ {kr.target.toLocaleString()} {kr.unit}</span>
                                                </div>
                                                <div className="h-4 bg-slate-100/50 rounded-full overflow-hidden p-1 shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-brand-peach to-orange-400 rounded-full shadow-lg transition-all duration-1000"
                                                        style={{ width: `${kr.progress}%` }}
                                                    />
                                                </div>
                                                <p className="mt-3 text-xs font-bold text-slate-500 text-right">{kr.progress}% Achieved</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. PACT HABITS (Habit Pillar) */}
                        <div className="lg:col-span-8">
                            <div className="clay-card p-8 h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-sky/10 rounded-2xl flex items-center justify-center text-brand-sky">
                                            <Activity size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-brand-dark">PACT: Consistency Engine</h2>
                                            <p className="text-slate-500 font-medium">Continuous output & commitment tracking</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-brand-sky/5 px-4 py-2 rounded-full border border-brand-sky/20">
                                        <span className="text-brand-sky text-xl font-black">{stats.pact.commitment_score}</span>
                                        <span className="text-[10px] uppercase font-black text-brand-sky leading-none">Habit<br />Strength</span>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {stats.pact.daily_metrics.map((m, idx) => (
                                        <div key={idx} className="group relative bg-slate-50 hover:bg-white p-5 rounded-3xl border border-transparent hover:border-brand-sky/20 transition-all duration-500 shadow-sm hover:shadow-xl">
                                            <div className="text-3xl mb-3 transform group-hover:scale-125 transition-transform duration-500">{m.icon}</div>
                                            <h4 className="font-bold text-brand-dark text-sm">{m.label}</h4>
                                            <p className="text-2xl font-black text-brand-sky mb-2">{m.value}</p>
                                            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden opacity-50">
                                                <div className="h-full bg-brand-sky rounded-full" style={{ width: `${m.commitment_level}%` }} />
                                            </div>
                                            <div className="absolute inset-0 bg-brand-sky/5 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 rounded-3xl -z-10" />
                                        </div>
                                    ))}
                                </div>

                                {/* Commitment Area Chart */}
                                <div className="h-64 mt-4 bg-white/50 rounded-3xl p-6 border border-slate-100">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Learning Velocity History</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={retentionHistory}>
                                            <defs>
                                                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94A3B8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                            />
                                            <Area type="monotone" dataKey="power" stroke="#38bdf8" strokeWidth={4} fillOpacity={1} fill="url(#colorPower)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* 3. SMART GOALS (Execution Side) */}
                        <div className="lg:col-span-4">
                            <div className="clay-card p-8 h-full overflow-hidden relative">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-brand-dark">SMART Tactics</h2>
                                        <p className="text-slate-500 font-medium">Specific, Time-bound wins</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {stats.smart.map(goal => (
                                        <div key={goal.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${goal.status === 'achieved' ? 'bg-brand-green text-white' : 'bg-brand-salmon/20 text-brand-salmon'}`}>
                                                    {goal.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Calendar size={10} /> {new Date(goal.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-brand-dark mb-1">{goal.title}</h4>
                                            <p className="text-xs text-slate-500 mb-4 font-medium line-clamp-2">{goal.specific_action}</p>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${goal.status === 'achieved' ? 'bg-brand-green' : 'bg-brand-salmon'}`}
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-brand-dark">{goal.progress}%</span>
                                            </div>
                                        </div>
                                    ))}

                                    <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-brand-salmon hover:text-brand-salmon hover:bg-brand-salmon/5 transition-all flex items-center justify-center gap-2">
                                        <Sparkles size={18} /> Add Strategic Goal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'TASKS' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                        <div className="lg:col-span-8">
                            <div className="clay-card p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black text-brand-dark flex items-center gap-3">
                                        <BookOpen className="text-brand-salmon" />
                                        Today&apos;s Tactical Board
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-500">{tasks.filter(t => t.status === 'completed').length} / {tasks.length} Completed</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tasks.map((task, idx) => (
                                        <div
                                            key={task.id || idx}
                                            className={`
                                                group p-6 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-6
                                                ${task.status === 'completed'
                                                    ? 'bg-slate-50 border-transparent opacity-70'
                                                    : 'bg-white border-slate-100 hover:border-brand-salmon/40 hover:shadow-2xl hover:shadow-brand-salmon/10 shadow-sm'
                                                }
                                            `}
                                        >
                                            <button
                                                onClick={() => task.id && handleTaskComplete(task.id)}
                                                disabled={task.status === 'completed'}
                                                className={`
                                                    w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500
                                                    ${task.status === 'completed'
                                                        ? 'bg-brand-green text-white rotate-[360deg]'
                                                        : 'bg-slate-50 text-slate-300 group-hover:bg-brand-salmon group-hover:text-white'
                                                    }
                                                `}
                                            >
                                                {task.status === 'completed' ? <CheckCircle2 size={28} /> : <Play size={24} />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-brand-salmon transition-colors">Tactical Mission</span>
                                                    {task.status === 'completed' && <span className="px-2 py-0.5 bg-brand-green/20 text-brand-green text-[10px] font-black rounded-lg">ACHIEVED</span>}
                                                </div>
                                                <h3 className={`text-xl font-black ${task.status === 'completed' ? 'text-slate-400 italic line-through' : 'text-brand-dark'}`}>
                                                    {task.title}
                                                </h3>
                                                <p className="text-slate-500 font-medium text-sm group-hover:text-slate-700 transition-colors">{task.description}</p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1.5 justify-end text-brand-dark mb-2">
                                                    <Clock size={16} className="text-slate-400" />
                                                    <span className="text-lg font-black">{task.estimated_minutes}</span>
                                                    <span className="text-xs font-bold text-slate-400">MIN</span>
                                                </div>
                                                <button className="px-5 py-2 rounded-xl bg-brand-dark text-white text-xs font-black hover:bg-black active:scale-95 transition-all shadow-lg shadow-brand-dark/20 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                                    EXECUTE
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="clay-card p-6 bg-brand-dark text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-salmon/20 rounded-full blur-3xl" />
                                <h3 className="text-lg font-black mb-4 relative z-10 flex items-center gap-2">
                                    <Sparkles size={20} className="text-brand-salmon" />
                                    Hanachan&apos;s Strategy
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                                        <p className="text-sm font-medium leading-relaxed opacity-90">
                                            &quot;Based on your <strong>PACT</strong> action score, you should focus on Listening during morning commutes to hit your <strong>SMART</strong> goal by Friday.&quot;
                                        </p>
                                    </div>
                                    <button className="w-full py-3 bg-brand-salmon text-white rounded-xl font-black text-sm hover:brightness-110 active:scale-95 transition-all">
                                        Genereate Tactical Shift
                                    </button>
                                </div>
                            </div>

                            <div className="clay-card p-6">
                                <h3 className="font-black text-brand-dark mb-4">Milestone Roadmap</h3>
                                <div className="space-y-4">
                                    {plan.milestones.slice(0, 4).map(m => (
                                        <div key={m.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${m.status === 'completed' ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {m.status === 'completed' ? <CheckCircle2 size={14} /> : m.milestone_number}
                                                </div>
                                                <div className="flex-1 w-0.5 bg-slate-100 my-1" />
                                            </div>
                                            <div className="pb-6">
                                                <h4 className={`font-bold text-sm ${m.status === 'completed' ? 'text-slate-400' : 'text-brand-dark'}`}>{m.title}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(m.progress_percent)}% Complete</p>
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
                        {/* PERFORMANCE VAULT (Data Rich) */}
                        <div className="lg:col-span-12 grid lg:grid-cols-3 gap-8">
                            {/* Mastery Radar */}
                            <div className="lg:col-span-1 clay-card p-8">
                                <h2 className="text-xl font-black text-brand-dark mb-8 flex items-center gap-3">
                                    <PieChart className="text-brand-peach" />
                                    Subject Mastery
                                </h2>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                                            <PolarGrid stroke="#E2E8F0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                            <Radar
                                                name="You"
                                                dataKey="A"
                                                stroke="#F6AD55"
                                                fill="#F6AD55"
                                                fillOpacity={0.6}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-bold">Strongest Subject:</span>
                                        <span className="text-brand-green font-black">Vocabulary</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-bold">Needs Focus:</span>
                                        <span className="text-brand-salmon font-black">Reading</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Logs */}
                            <div className="lg:col-span-2 clay-card p-8 bg-white relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-brand-dark flex items-center gap-3">
                                        <History className="text-brand-sky" />
                                        Activity Records Vault
                                    </h2>
                                    <div className="flex gap-2">
                                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-brand-dark transition-colors"><Search size={18} /></button>
                                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-brand-dark transition-colors"><Filter size={18} /></button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Intensity</th>
                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Output</th>
                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Score</th>
                                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {[
                                                { type: 'JLPT N2 Mock', intensity: 'High', output: 'Reading', score: '82%', date: '2023-12-19' },
                                                { type: 'Grammar Particles', intensity: 'Med', output: 'Grammar', score: '95%', date: '2023-12-18' },
                                                { type: 'Core 2K Deck', intensity: 'Low', output: 'Vocab', score: '100%', date: '2023-12-18' },
                                                { type: 'Podcast Study', intensity: 'High', output: 'Listening', score: 'N/A', date: '2023-12-17' },
                                                { type: 'Sentence Parser', intensity: 'Low', output: 'Reading', score: 'N/A', date: '2023-12-16' },
                                                { type: 'Quiz: Verbs', intensity: 'Med', output: 'Grammar', score: '78%', date: '2023-12-15' },
                                            ].map((row, i) => (
                                                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-brand-dark text-xs font-black">#</div>
                                                            <span className="font-bold text-brand-dark">{row.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${row.intensity === 'High' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{row.intensity}</span>
                                                    </td>
                                                    <td className="py-4 text-sm font-medium text-slate-500">{row.output}</td>
                                                    <td className="py-4 text-sm font-black text-brand-dark">{row.score}</td>
                                                    <td className="py-4 text-xs font-bold text-slate-400 text-right">{new Date(row.date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="w-full mt-6 py-4 bg-slate-50 text-slate-400 font-bold text-sm rounded-2xl border border-slate-100 hover:bg-white hover:text-brand-dark transition-all">
                                    View Full Archive
                                </button>
                            </div>
                        </div>

                        {/* Retention & Velocity */}
                        <div className="lg:col-span-12 grid lg:grid-cols-2 gap-8">
                            <div className="clay-card p-8">
                                <h3 className="text-xl font-black text-brand-dark mb-6 flex items-center gap-3">
                                    <Zap className="text-yellow-500" />
                                    Retention Curve (AI Projected)
                                </h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={retentionHistory}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="power" stroke="#F56565" strokeWidth={3} dot={{ r: 6, fill: '#F56565', strokeWidth: 2, stroke: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="clay-card p-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-brand-dark mb-2">Study Velocity</h3>
                                    <p className="text-slate-500 font-medium text-sm max-w-xs">You are processing <strong>3.4 new concepts per session</strong>. At this rate, you reach N2 Readiness in <strong>42 days</strong>.</p>
                                </div>
                                <div className="text-center bg-brand-green/10 p-6 rounded-[2rem] border border-brand-green/20">
                                    <div className="text-4xl font-black text-brand-green">100%</div>
                                    <div className="text-[10px] font-black uppercase text-brand-green tracking-widest mt-1">Velocity Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function NoPlanView({ user, openAuth }: { user: any, openAuth: any }) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-brand-dark tracking-tighter">Choose Your Path</h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">Select a strategic framework to guide your journey to fluency.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="clay-card p-10 bg-white group hover:scale-[1.02] transition-all duration-500">
                        <div className="w-16 h-16 bg-brand-salmon/10 text-brand-salmon rounded-3xl flex items-center justify-center mb-8 transform group-hover:rotate-12 transition-transform">
                            <Target size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-brand-dark mb-4">Launch Site</h2>
                        <p className="text-slate-500 leading-relaxed mb-8">Ready to start? Create a new JLPT study plan and let Hanachan generate your <strong>OKR</strong> and <strong>PACT</strong> targets instantly.</p>
                        <Link href="/study-plan/setup" className="btnPrimary w-full py-4 text-center block">Create Study Plan</Link>
                    </div>

                    <div className="clay-card p-10 bg-brand-dark text-white group hover:scale-[1.02] transition-all duration-500">
                        <div className="w-16 h-16 bg-white/10 text-brand-salmon rounded-3xl flex items-center justify-center mb-8 transform group-hover:-rotate-12 transition-transform">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight">Sync Intel</h2>
                        <p className="opacity-70 leading-relaxed mb-8">Already have an account? Log in to restore your strategic dashboard, performance history, and lifelong learning vault.</p>
                        <button
                            onClick={() => openAuth('REGISTER', { flowType: 'GENERAL' })}
                            className="w-full py-4 bg-white text-brand-dark rounded-2xl font-black hover:bg-slate-100 transition-all"
                        >
                            Log In / Register
                        </button>
                    </div>
                </div>

                {/* Framework Preview */}
                <div className="pt-12 border-t border-slate-200">
                    <h3 className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Powered by Strategic Frameworks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center space-y-4">
                            <img src="https://img.icons8.com/isometric/100/goal.png" alt="OKR" className="mx-auto w-20 h-20" />
                            <h4 className="text-xl font-black text-brand-dark">OKR</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Objectives & Key Results</p>
                        </div>
                        <div className="text-center space-y-4">
                            <img src="https://img.icons8.com/isometric/100/checked-user-male.png" alt="PACT" className="mx-auto w-20 h-20" />
                            <h4 className="text-xl font-black text-brand-dark">PACT</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commitment & Consistency</p>
                        </div>
                        <div className="text-center space-y-4">
                            <img src="https://img.icons8.com/isometric/100/lightning-bolt.png" alt="SMART" className="mx-auto w-20 h-20" />
                            <h4 className="text-xl font-black text-brand-dark">SMART</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Specific Tactical Wins</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-salmon" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
