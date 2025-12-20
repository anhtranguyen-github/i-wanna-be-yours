import Link from 'next/link';
import React from 'react';

export const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fadeIn">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    New: JLPT N5-N1 Resource Library
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 font-fredoka animate-slideUp" style={{ lineHeight: 1.1 }}>
                    Your Personal <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Japanese Learning</span> Companion
                </h1>

                {/* Subheadline */}
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    Master Japanese with an intelligent AI chatbot that understands context, provides instant grammar explanations, and helps you practice conversation naturally.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    <Link
                        href="/chat"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-lg transition-all hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                    >
                        Start Learning Free
                    </Link>
                    <Link
                        href="#features"
                        className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 rounded-full font-bold text-lg transition-all"
                    >
                        View Features
                    </Link>
                </div>

                {/* Hero Visual Mockup */}
                <div className="mt-20 relative mx-auto max-w-5xl animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden aspect-[16/9]">
                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                            <p className="text-gray-400 font-medium">Interactive Demo Preview Placeholder</p>
                            {/* Placeholder for actual screenshot or interactive demo */}
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                </div>

            </div>
        </section>
    );
};
