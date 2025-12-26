
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    code?: string;
    autoClose?: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addNotification = useCallback((payload: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification = { ...payload, id };

        setNotifications((prev) => [...prev, newNotification]);

        if (payload.autoClose !== false) {
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        }
    }, [removeNotification]);

    // Listen for global notification events from authFetch or other non-hook code
    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleGlobalNotification = (event: any) => {
            const { message, type, code } = event.detail;
            addNotification({ message, type, code });
        };

        window.addEventListener('app:notification', handleGlobalNotification);
        return () => window.removeEventListener('app:notification', handleGlobalNotification);
    }, [addNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            {/* Simple notification overlay */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`p-4 rounded-lg shadow-lg border-l-4 transition-all animate-in slide-in-from-right ${n.type === 'error' || n.type === 'critical' ? 'bg-red-50 border-red-500 text-red-800' :
                            n.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                                n.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                                    'bg-blue-50 border-blue-500 text-blue-800'
                            }`}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                {n.code && <div className="text-xs font-bold opacity-70 mb-1">{n.code}</div>}
                                <div className="text-sm font-medium">{n.message}</div>
                            </div>
                            <button
                                onClick={() => removeNotification(n.id)}
                                className="text-lg leading-none opacity-50 hover:opacity-100"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
