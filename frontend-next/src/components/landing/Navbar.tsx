import Link from 'next/link';
import React from 'react';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-fredoka text-gray-900 tracking-tight">hanachan</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100">Beta</span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <NavLink href="#features">Features</NavLink>
                    <NavLink href="#resources">Resources</NavLink>
                    <NavLink href="#about">About</NavLink>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/chat"
                        className="hidden sm:flex text-gray-600 font-semibold hover:text-gray-900 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/chat"
                        className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-full font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    >
                        Try Hanachan
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
    >
        {children}
    </Link>
);
