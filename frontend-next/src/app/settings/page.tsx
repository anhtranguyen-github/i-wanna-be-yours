'use client';

import React from 'react';
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
    ChevronRight
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { AuthErrorScreen } from '@/components/auth/AuthErrorScreen';
import Link from 'next/link';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
    return (
        <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-ink uppercase tracking-wider mb-3 px-1">
                {title}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200  overflow-hidden divide-y divide-slate-100">
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
}

function SettingsItem({
    icon: Icon,
    label,
    description,
    href,
    onClick,
    rightElement,
    iconColor = 'text-neutral-ink'
}: SettingsItemProps) {
    const content = (
        <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 ${iconColor}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-ink">{label}</p>
                {description && (
                    <p className="text-sm text-neutral-ink truncate">{description}</p>
                )}
            </div>
            {rightElement || <ChevronRight size={20} className="text-neutral-ink" />}
        </>
    );

    const className = "flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer";

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${className} w-full text-left`}>
            {content}
        </button>
    );
}

export default function SettingsPage() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        return (
            <AuthErrorScreen
                title="Login Required"
                message="Please log in to access your settings and preferences."
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center ">
                            <SettingsIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-ink">Settings</h1>
                            <p className="text-sm text-neutral-ink">Manage your account and preferences</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                {/* Account Section */}
                <SettingsSection title="Account">
                    <SettingsItem
                        icon={User}
                        label="Profile"
                        description={user.email}
                        href="/profile"
                        iconColor="text-blue-500"
                    />
                    <SettingsItem
                        icon={Shield}
                        label="Security"
                        description="Password and authentication"
                        href="/settings/security"
                        iconColor="text-green-500"
                    />
                </SettingsSection>

                {/* Preferences Section */}
                <SettingsSection title="Preferences">
                    <SettingsItem
                        icon={Palette}
                        label="Appearance"
                        description="Theme and display options"
                        iconColor="text-purple-500"
                        rightElement={
                            <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                                <button className="p-1.5 rounded-full bg-white ">
                                    <Sun size={16} className="text-amber-500" />
                                </button>
                                <button className="p-1.5 rounded-full text-neutral-ink hover:bg-slate-200 transition-colors">
                                    <Moon size={16} />
                                </button>
                            </div>
                        }
                    />
                    <SettingsItem
                        icon={Bell}
                        label="Notifications"
                        description="Email and push notifications"
                        iconColor="text-amber-500"
                    />
                    <SettingsItem
                        icon={Volume2}
                        label="Sound"
                        description="Audio feedback and effects"
                        iconColor="text-pink-500"
                    />
                    <SettingsItem
                        icon={Globe}
                        label="Language"
                        description="English (US)"
                        iconColor="text-cyan-500"
                    />
                </SettingsSection>

                {/* Study Preferences */}
                <SettingsSection title="Study">
                    <SettingsItem
                        icon={SettingsIcon}
                        label="Study Preferences"
                        description="Daily goals and learning style"
                        href="/settings/study"
                        iconColor="text-indigo-500"
                    />
                </SettingsSection>

                {/* Version Info */}
                <div className="text-center text-sm text-neutral-ink mt-12">
                    <p>hanachan.org v1.0.0</p>
                    <p className="mt-1">Made with 🌸 for Japanese learners</p>
                </div>
            </div>
        </div>
    );
}
