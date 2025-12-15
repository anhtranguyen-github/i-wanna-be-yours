"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
    MessageCircle,
    Wrench,
    Gamepad2,
    Library,
    BookOpen,
    LogOut,
    User as UserIcon,
    GraduationCap,
    CalendarDays
} from "lucide-react";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const pathname = usePathname();
    const { user, logout } = useUser();
    const isChat = pathname?.startsWith('/chat');

    return (
        <div className={`
            fixed left-4 top-4 bottom-4 w-24 flex flex-col justify-between items-center py-8 z-50 
            bg-white text-brand-dark border-2 border-white transition-all duration-300
            ${isChat
                ? 'rounded-l-3xl rounded-r-none border-r-0 shadow-[8px_8px_20px_rgba(170,180,200,0.1),-8px_-8px_20px_rgba(255,255,255,1)] pr-0'
                : 'rounded-3xl clay-card'
            }
        `}>
            {/* Logo area */}
            <div className="flex flex-col items-center gap-2 mb-8">
                <div className="w-12 h-12 bg-brand-salmon rounded-xl flex items-center justify-center shadow-inner text-2xl text-white">
                    🌸
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                <NavItem icon={<MessageCircle size={24} />} label="Chat" href="/chat/ai-tutor" active={pathname?.startsWith('/chat')} />
                <NavItem icon={<Wrench size={24} />} label="Tools" href="/tools" active={pathname === '/tools'} />
                <NavItem icon={<Gamepad2 size={24} />} label="Game" href="/game" active={pathname === '/game'} />
                <NavItem icon={<Library size={24} />} label="Library" href="/library" active={pathname?.startsWith('/library')} />
                <NavItem icon={<BookOpen size={24} />} label="Knowledge" href="/knowledge-base" active={pathname?.startsWith('/knowledge-base')} />
                <NavItem icon={<CalendarDays size={24} />} label="Study Plan" href="/study-plan" active={pathname?.startsWith('/study-plan')} />
                <NavItem icon={<GraduationCap size={24} />} label="Practice" href="/practice" active={pathname?.startsWith('/practice')} />
            </nav>

            {/* User Profile / Logout */}
            <div className="flex flex-col gap-4 w-full px-2">
                {user ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-brand-sky border-2 border-brand-dark flex items-center justify-center font-bold text-brand-dark shadow-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <button
                            onClick={logout}
                            className="p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="flex flex-col items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-salmon transition-colors">
                        <div className="p-2 rounded-xl bg-gray-100 hover:bg-brand-salmon hover:text-white transition-all">
                            <UserIcon size={20} />
                        </div>
                        <span>Login</span>
                    </Link>
                )}
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active?: boolean }) => {
    return (
        <Link href={href} className="w-full relative group flex flex-col items-center">
            <div className={`
                p-4 rounded-2xl transition-all duration-300 flex items-center justify-center relative z-10
                ${active
                    ? 'bg-brand-salmon text-white shadow-clay-sm scale-110 -rotate-3'
                    : 'text-gray-400 hover:bg-brand-salmon/10 hover:text-brand-salmon hover:scale-105'
                }
            `}>
                {icon}
            </div>
            {/* Tooltip */}
            {/* Label */}
            <span className={`
                text-[10px] font-extrabold mt-1 transition-all duration-300 text-center
                ${active
                    ? 'text-brand-salmon scale-105'
                    : 'text-gray-400 group-hover:text-brand-salmon group-hover:scale-105'
                }
            `}>
                {label}
            </span>
        </Link>
    );
};

export default Sidebar;
