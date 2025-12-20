import Link from 'next/link';
import React from 'react';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                    {/* Brand */}
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <span className="text-2xl font-bold font-fredoka text-gray-900">hanachan</span>
                        <p className="text-gray-500 text-sm">
                            Open Source Japanese Learning Platform
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex gap-8 text-sm text-gray-600">
                        <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
                        <a href="https://github.com/anhtranguyen/i-wanna-be-yours" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
                    </div>

                    {/* Copyright */}
                    <div className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Hanabira.org
                    </div>
                </div>
            </div>
        </footer>
    );
};
