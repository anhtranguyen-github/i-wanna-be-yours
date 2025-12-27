'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Palette,
    Shield,
    Moon,
    Sun,
    Volume2,
    Globe,
    ChevronRight,
    Loader2,
    LogOut,
    Trash2,
    Download,
    Share2
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { AuthErrorScreen } from '@/components/auth/AuthErrorScreen';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { settingsService, UserSettingsResponse } from '@/services/settingsService';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/authFetch';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
    return (
        <div className="mb-10 last:mb-0">
            <h2 className="text-[10px] font-black text-primary-strong uppercase tracking-[0.2em] mb-4 px-2">
                {title}
            </h2>
            <div className="bg-white rounded-[2rem] border border-neutral-gray/10 shadow-sm overflow-hidden divide-y divide-neutral-gray/5">
                {children}
            </div>
        </div>
    );
}

interface SettingsItemProps {
    icon: React.ElementType;
    label: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    iconColor?: string;
    danger?: boolean;
}

function SettingsItem({
    icon: Icon,
    label,
    description,
    href,
    onClick,
    rightElement,
    iconColor = 'text-neutral-ink',
    danger = false
}: SettingsItemProps) {
    const content = (
        <>
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                danger ? "bg-red-50 text-red-500" : `bg-neutral-beige/50 ${iconColor}`
            )}>
                <Icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-black text-neutral-ink tracking-tight",
                    danger && "text-red-500"
                )}>{label}</p>
                {description && (
                    <p className="text-xs font-bold text-neutral-ink/40 truncate">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {rightElement}
                {!rightElement && <ChevronRight size={18} className="text-neutral-ink/20 group-hover:text-primary-strong transition-colors" />}
            </div>
        </>
    );

    const className = "flex items-center gap-5 p-5 hover:bg-neutral-beige/20 transition-all cursor-pointer group";

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={cn(className, "w-full text-left")}>
            {content}
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading: userLoading, logout } = useUser();
    const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await settingsService.getSettings();
            setSettings(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await authFetch('/e-api/v1/users/export');
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hanabira-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleDeleteAccount = async () => {
        if (typeof window !== 'undefined' && window.confirm('Are you absolutely sure? This will delete all your progress, cards, and arenas permanently. This action cannot be undone.')) {
            try {
                const response = await authFetch('/e-api/v1/users/account', { method: 'DELETE' });
                if (response.ok) {
                    logout();
                    router.push('/');
                }
            } catch (err) {
                console.error('Deletion failed:', err);
            }
        }
    };

    const toggleSetting = async (key: string, value: any) => {
        if (!settings) return;

        // Optimistic update
        const originalSettings = { ...settings };
        setSettings({
            ...settings,
            settings: {
                ...settings.settings,
                [key]: value
            }
        });

        try {
            await settingsService.updateSettings({
                settings: { [key]: value } as any
            });
        } catch (err) {
            setSettings(originalSettings); // Rollback
        }
    };

    if (userLoading || (user && loading)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary-strong" />
            </div>
        );
    }

    if (!user) {
        return (
            <AuthErrorScreen
                title="Restricted Access"
                message="Your personal armory is locked. Please sign in to manage your Hanabira preferences."
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-neutral-gray/10 sticky top-0 z-10 backdrop-blur-md bg-white/80">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-strong to-primary-sky flex items-center justify-center shadow-lg shadow-primary/20">
                                <SettingsIcon size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-neutral-ink font-display tracking-tight">Command Center</h1>
                                <p className="text-sm font-bold text-neutral-ink/40 tracking-wide">Refine your Japanese language experience</p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Settings */}
                <div className="lg:col-span-8">
                    <SettingsSection title="Identity & Security">
                        <SettingsItem
                            icon={User}
                            label="Public Profile"
                            description={settings?.display_name || "Set your warrior name"}
                            href="/settings/profile"
                            iconColor="text-blue-500"
                        />
                        <SettingsItem
                            icon={Shield}
                            label="Security & Access"
                            description="Maintain your digital fortress"
                            href="/settings/security"
                            iconColor="text-emerald-500"
                        />
                    </SettingsSection>

                    <SettingsSection title="Application Vibe">
                        <SettingsItem
                            icon={Palette}
                            label="Appearance"
                            description="Visual theme of the Nexus"
                            iconColor="text-purple-500"
                            rightElement={
                                <div className="flex items-center gap-2 bg-neutral-beige/50 rounded-full p-1 border border-neutral-gray/10">
                                    <button
                                        onClick={() => toggleSetting('theme', 'light')}
                                        className={cn(
                                            "p-2 rounded-full transition-all",
                                            settings?.settings.theme === 'light' ? "bg-white text-amber-500 shadow-sm" : "text-neutral-ink/20 hover:text-neutral-ink"
                                        )}
                                    >
                                        <Sun size={18} />
                                    </button>
                                    <button
                                        onClick={() => toggleSetting('theme', 'dark')}
                                        className={cn(
                                            "p-2 rounded-full transition-all",
                                            settings?.settings.theme === 'dark' ? "bg-white text-indigo-500 shadow-sm" : "text-neutral-ink/20 hover:text-neutral-ink"
                                        )}
                                    >
                                        <Moon size={18} />
                                    </button>
                                    <button
                                        onClick={() => toggleSetting('theme', 'system')}
                                        className={cn(
                                            "p-2 rounded-full transition-all text-[10px] font-black uppercase tracking-tight px-3",
                                            settings?.settings.theme === 'system' ? "bg-white text-primary-strong shadow-sm" : "text-neutral-ink/20 hover:text-neutral-ink"
                                        )}
                                    >
                                        Auto
                                    </button>
                                </div>
                            }
                        />
                        <SettingsItem
                            icon={Volume2}
                            label="Sound Effects"
                            description="Audio feedback for actions"
                            iconColor="text-pink-500"
                            rightElement={
                                <Switch
                                    enabled={settings?.settings.soundEnabled ?? true}
                                    onChange={(val) => toggleSetting('soundEnabled', val)}
                                />
                            }
                        />
                        <SettingsItem
                            icon={Bell}
                            label="Notifications"
                            description="Stay alerted on progress"
                            iconColor="text-amber-500"
                            rightElement={
                                <Switch
                                    enabled={settings?.settings.notificationsEnabled ?? true}
                                    onChange={(val) => toggleSetting('notificationsEnabled', val)}
                                />
                            }
                        />
                        <SettingsItem
                            icon={Globe}
                            label="Global Language"
                            description={settings?.settings.language === 'en' ? "English (United States)" : "Japanese (Standard)"}
                            iconColor="text-cyan-500"
                        />
                    </SettingsSection>

                    <SettingsSection title="Study Protocol">
                        <SettingsItem
                            icon={SettingsIcon}
                            label="Study Preferences"
                            description="Target levels and daily rituals"
                            href="/settings/study"
                            iconColor="text-indigo-500"
                        />
                    </SettingsSection>

                    <SettingsSection title="The Grave (Danger Zone)">
                        <SettingsItem
                            icon={Trash2}
                            label="Obliterate Account"
                            description="Irreversible destruction of data"
                            danger
                            onClick={handleDeleteAccount}
                        />
                    </SettingsSection>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gradient-to-br from-neutral-ink to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <Share2 size={32} className="text-primary-sky mb-4" />
                        <h4 className="text-xl font-black mb-2">Invite Others</h4>
                        <p className="text-sm font-medium text-white/60 mb-6 leading-relaxed">Share your learning progress and challenge your allies to join the Hanabira Nexus.</p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Generate Invite</button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-gray/10 shadow-sm">
                        <Download size={24} className="text-primary-strong mb-4" />
                        <h4 className="text-lg font-black text-neutral-ink mb-2">Data Export</h4>
                        <p className="text-xs font-bold text-neutral-ink/40 mb-6 leading-relaxed">Download a complete archive of your created cards and training sessions.</p>
                        <button
                            onClick={handleExport}
                            className="w-full py-3 bg-neutral-beige/50 hover:bg-neutral-beige rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-neutral-ink"
                        >
                            Request Export
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-black text-neutral-ink/20 uppercase tracking-[0.3em]">hanachan.org v1.0.0</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <span className="w-8 h-[1px] bg-neutral-gray/10" />
                            <div className="w-2 h-2 rounded-full bg-primary-strong/20" />
                            <span className="w-8 h-[1px] bg-neutral-gray/10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Switch({ enabled, onChange }: { enabled: boolean, onChange: (val: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                enabled ? "bg-primary-strong" : "bg-neutral-gray/20"
            )}
        >
            <div className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm",
                enabled ? "right-1" : "left-1"
            )} />
        </button>
    );
}
