"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    Server,
    AlertCircle,
    CheckCircle2,
    Search,
    MoreHorizontal
} from 'lucide-react';

// Mock Data Interfaces
interface Stat {
    name: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    icon: React.ElementType;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    lastLogin: string;
}

interface SystemHealth {
    service: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [health, setHealth] = useState<SystemHealth[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const fetchData = async () => {
            setLoading(true);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            setStats([
                { name: 'Total Users', value: '12,345', change: '+12%', changeType: 'increase', icon: Users },
                { name: 'Active Sessions', value: '423', change: '+5%', changeType: 'increase', icon: Activity },
                { name: 'Server Load', value: '34%', change: '-2%', changeType: 'decrease', icon: Server },
                { name: 'Pending Issues', value: '12', change: '+2', changeType: 'decrease', icon: AlertCircle },
            ]);

            setUsers([
                { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'active', lastLogin: '2 mins ago' },
                { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'active', lastLogin: '1 hour ago' },
                { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'inactive', lastLogin: '3 days ago' },
                { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Moderator', status: 'active', lastLogin: '5 hours ago' },
                { id: '5', name: 'Evan Wright', email: 'evan@example.com', role: 'User', status: 'active', lastLogin: '1 day ago' },
            ]);

            setHealth([
                { service: 'API Server', status: 'operational', uptime: '99.9%' },
                { service: 'Database', status: 'operational', uptime: '99.99%' },
                { service: 'Auth Service', status: 'degraded', uptime: '98.5%' },
                { service: 'Storage', status: 'operational', uptime: '99.9%' },
            ]);

            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-neutral-ink dark:text-white">Dashboard</h1>
                <p className="mt-2 text-sm text-neutral-ink dark:text-neutral-ink">Overview of system performance and user activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div key={item.name} className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
                        <dt>
                            <div className="absolute rounded-md bg-rose-500 p-3">
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-neutral-ink dark:text-neutral-ink">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
                            <p className="text-2xl font-semibold text-neutral-ink dark:text-white">{item.value}</p>
                            <p
                                className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'increase' ? 'text-green-600' : item.changeType === 'decrease' ? 'text-red-600' : 'text-neutral-ink'
                                    }`}
                            >
                                {item.change}
                            </p>
                        </dd>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium leading-6 text-neutral-ink dark:text-white">Recent Users</h3>
                        <button className="text-sm text-rose-500 hover:text-rose-600 font-medium">View all</button>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <li key={user.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150 ease-in-out">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0 gap-x-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-neutral-ink dark:text-neutral-ink font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-auto">
                                            <p className="text-sm font-semibold leading-6 text-neutral-ink dark:text-white">{user.name}</p>
                                            <p className="mt-1 truncate text-xs leading-5 text-neutral-ink dark:text-neutral-ink">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                                        <p className="text-sm leading-6 text-neutral-ink dark:text-white">{user.role}</p>
                                        <div className="mt-1 flex items-center gap-x-1.5">
                                            <div className={`flex-none rounded-full p-1 ${user.status === 'active' ? 'bg-emerald-500/20' : 'bg-gray-500/20'}`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                                            </div>
                                            <p className="text-xs leading-5 text-neutral-ink dark:text-neutral-ink">{user.status}</p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium leading-6 text-neutral-ink dark:text-white">System Health</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6 space-y-6">
                        {health.map((item) => (
                            <div key={item.service} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {item.status === 'operational' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                                    ) : item.status === 'degraded' ? (
                                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-neutral-ink dark:text-white">{item.service}</p>
                                        <p className="text-xs text-neutral-ink dark:text-neutral-ink">Uptime: {item.uptime}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status === 'operational'
                                        ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10'
                                        : item.status === 'degraded'
                                            ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10'
                                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/10'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
