import React from 'react';

const FEATURE_LIST = [
    {
        title: "Context-Aware Conversations",
        description: "Practice natural conversations with an AI that remembers context, corrects your grammar gently, and adapts to your proficiency level.",
        icon: "💬",
        imagePlacehoderColor: "bg-blue-100"
    },
    {
        title: "Instant Grammar Explanations",
        description: "Stuck on a particle or conjugation? Just ask. Get clear, concise explanations instantly without leaving the chat.",
        icon: "📚",
        imagePlacehoderColor: "bg-purple-100"
    },
    {
        title: "JLPT Focused Study Resources",
        description: "Access a curated library of flashcards, quizzes, and vocabulary lists specifically designed for JLPT N5 through N1.",
        icon: "🎯",
        imagePlacehoderColor: "bg-green-100"
    }
];

export const Features = () => {
    return (
        <section id="features" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold font-fredoka text-gray-900 mb-6">
                        Everything you need to master Japanese
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Hanachan combines advanced AI with proven language learning techniques to create the most effective self-study environment.
                    </p>
                </div>

                <div className="space-y-24">
                    {FEATURE_LIST.map((feature, index) => (
                        <div key={index} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                            {/* Text Side */}
                            <div className="flex-1 space-y-6">
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-2xl mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Image Side */}
                            <div className="flex-1 w-full">
                                <div className={`aspect-[4/3] rounded-3xl ${feature.imagePlacehoderColor} border border-gray-200 shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow duration-300`}>
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium opacity-50">
                                        Feature Preview: {feature.title}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};
