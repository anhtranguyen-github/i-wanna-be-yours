"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
    MessageCircle,
    Wrench,
    Gamepad2,
    Library,
    Lightbulb,
    LogOut,
    User as UserIcon
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const { user, logout } = useUser();
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <aside className="fixed top-0 left-0 h-screen w-24 bg-[#282c34] flex flex-col items-center py-6 z-50 shadow-2xl">
            {/* Logo / Home Link (Optional but recommended for navigation) */}
            <Link href="/" className="mb-8 p-2 rounded-xl hover:bg-white/10 transition-colors">
                <span className="text-xl font-extrabold text-white tracking-widest">HB</span>
            </Link>

            <nav className="flex flex-col space-y-6 w-full items-center flex-1">
                <NavItem
                    href="/chat"
                    icon={<MessageCircle size={24} />}
                    label="Chat"
                    active={isActive("/chat")}
                />
                <NavItem
                    href="/tools"
                    icon={<Wrench size={24} />}
                    label="Tools"
                    active={isActive("/tools")}
                />
                <NavItem
                    href="/game"
                    icon={<Gamepad2 size={24} />}
                    label="Game"
                    active={isActive("/game")}
                />
                <NavItem
                    href="/library"
                    icon={<Library size={24} />}
                    label="Library"
                    active={isActive("/library")}
                />
                <NavItem
                    href="/knowledge-base"
                    icon={<Lightbulb size={24} />}
                    label="Knowledge"
                    active={isActive("/knowledge-base")}
                />
            </nav>

            <div className="mt-auto flex flex-col items-center space-y-6 mb-4 w-full">
                {user && (
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-1 group"
                        aria-label="Logout"
                    >
                        <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                        <span className="text-[10px] uppercase font-bold group-hover:text-red-400 transition-colors">Logout</span>
                    </button>
                )}

                {/* User Profile Button */}
                <Link
                    href={user ? "/user-dashboard" : "/login"}
                    className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 hover:bg-white hover:scale-105 transition-all shadow-lg overflow-hidden"
                    aria-label="User Profile"
                >
                    {user?.email ? (
                        <span className="text-lg font-bold text-gray-700">{user.email[0].toUpperCase()}</span>
                    ) : (
                        <UserIcon size={24} />
                    )}
                </Link>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 group relative
                ${active ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
            <div className={`p-3 rounded-2xl transition-all duration-200
                ${active ? "bg-white/10 shadow-inner" : "group-hover:bg-white/5"}`}
            >
                {icon}
            </div>
            <span className={`text-[10px] uppercase font-bold mt-1.5 tracking-wider transition-colors
                ${active ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}
            >
                {label}
            </span>

            {/* Active Indicator Bar */}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-peach rounded-r-full" />
            )}
        </Link>
    )
}
