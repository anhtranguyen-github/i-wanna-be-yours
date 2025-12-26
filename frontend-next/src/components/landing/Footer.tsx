import Link from 'next/link';
import React from 'react';
import { Github, Twitter, Linkedin, Sparkles } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-slate-900 py-20 px-6 text-white border-t border-white/5">
            <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Sparkles size={20} className="fill-primary" />
                        </div>
                        <span className="text-2xl font-black font-display tracking-tight uppercase tracking-widest text-lg">Hanachan</span>
                    </div>
                    <p className="text-neutral-ink font-medium max-w-sm leading-relaxed">
                        A high-fidelity linguistic intelligence system designed for the serious student of Japanese mastery.
                    </p>
                    <div className="flex gap-4">
                        <SocialLink href="#" icon={<Github size={20} />} />
                        <SocialLink href="#" icon={<Twitter size={20} />} />
                        <SocialLink href="#" icon={<Linkedin size={20} />} />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">Laboratory</h3>
                    <div className="flex flex-col gap-4">
                        <FooterLink href="/tools/text-parser">Text Parser</FooterLink>
                        <FooterLink href="/tools/grammar-graph">Grammar Graph</FooterLink>
                        <FooterLink href="/tools/translate">AI Translate</FooterLink>
                        <FooterLink href="/library">Resource Library</FooterLink>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">Company</h3>
                    <div className="flex flex-col gap-4">
                        <FooterLink href="#">About Intelligence</FooterLink>
                        <FooterLink href="#">Strategy Guide</FooterLink>
                        <FooterLink href="#">Documentation</FooterLink>
                        <FooterLink href="#">Community</FooterLink>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-ink">
                <p>© 2025 Hanachan Intelligence. All operations secured.</p>
                <div className="flex gap-8">
                    <Link href="#" className="hover:text-primary transition-colors">Privacy Protocol</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Service Terms</Link>
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="text-sm font-medium text-neutral-ink hover:text-white transition-colors">{children}</Link>
);

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
    <Link href={href} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-ink hover:bg-primary hover:text-white transition-all">
        {icon}
    </Link>
);
