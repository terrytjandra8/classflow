import React, { useEffect, useState, useCallback } from 'react';
import { Logo } from './Logo';
import {
    Layout, Sparkles, Zap, Trophy, Users, ShieldCheck,
    ArrowRight, Star, Heart, CheckCircle2, Monitor,
    MessageCircle, BarChart3, Globe, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// --- Sub-components for better readability ---

const Navbar = ({ scrolled, onStart, onGoogleLogin }: { scrolled: boolean, onStart: () => void, onGoogleLogin: () => void }) => (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 ${scrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
                <Logo size="sm" className="group-hover:rotate-6 transition-transform" />
                <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">ClassBoards</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#demo" className="hover:text-white transition-colors">Experience</a>
                <button onClick={onGoogleLogin} className="hover:text-white transition-colors">Sign In</button>
            </div>

            <button
                onClick={onStart}
                className="px-6 py-2.5 bg-white text-black text-xs font-black rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            >
                GET STARTED
            </button>
        </div>
    </nav>
);

const HeroCarousel = () => {
    const [images, setImages] = useState<any[]>([]);
    const [curr, setCurr] = useState(0);

    const loadAssets = useCallback(async () => {
        // Try database first
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'landing_carousel')
                .single();

            if (data?.value && !error) {
                setImages(data.value);
                return;
            }
        } catch (e) {
            console.error("DB Fetch failed, falling back to local/default", e);
        }

        // Fallback to localStorage (Legacy)
        const saved = localStorage.getItem('cb_landing_carousel');
        if (saved) {
            try {
                setImages(JSON.parse(saved));
                return;
            } catch (e) {
                console.error("Failed to load carousel assets", e);
            }
        }

        // Default items if all fails
        setImages([
            {
                url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2504&auto=format&fit=crop",
                title: "Collaborative Learning",
                desc: "Students work together on a digital canvas that breathes life into ideas."
            },
            {
                url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop",
                title: "Gamified Quizzes",
                desc: "Turn every lesson into a high-stakes competitive game that students love."
            },
            {
                url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2670&auto=format&fit=crop",
                title: "Real-time Feedback",
                desc: "Instantly see how your students are performing and adjust your teaching on the fly."
            }
        ]);
    }, []);

    useEffect(() => {
        loadAssets();
        window.addEventListener('landing_assets_updated', loadAssets);
        return () => window.removeEventListener('landing_assets_updated', loadAssets);
    }, [loadAssets]);

    const next = useCallback(() => setCurr(c => (c + 1) % (images.length || 1)), [images.length]);
    const prev = () => setCurr(c => (c - 1 + images.length) % (images.length || 1));

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next, images.length]);

    if (images.length === 0) return null;

    return (
        <div id="demo" className="mt-24 max-w-6xl mx-auto relative group animate-in zoom-in-95 duration-1000 delay-500">
            <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-700"></div>

            <div className="relative bg-[#111] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl aspect-video">
                {images.map((img, i) => (
                    <div
                        key={i}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === curr ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                    >
                        <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>

                        <div className="absolute bottom-12 left-12 right-12 text-left">
                            <h3 className="text-3xl font-black mb-2 text-white">{img.title}</h3>
                            <p className="text-lg text-gray-400 max-w-xl font-medium">{img.desc}</p>
                        </div>
                    </div>
                ))}

                {/* Controls */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prev} className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={next} className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurr(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === curr ? 'bg-white w-6' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 group">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 font-medium leading-relaxed">{desc}</p>
    </div>
);

const Features = () => {
    const featureItems = [
        {
            icon: <Layout className="text-pink-500" />,
            title: "Visual Collaboration",
            desc: "Infinite canvases for brainstorming, grouping ideas, and solving problems together in real-time."
        },
        {
            icon: <Zap className="text-yellow-400" />,
            title: "Instant Quizzes",
            desc: "Convert notes into gamified quizzes instantly. High energy, low friction, maximum engagement."
        },
        {
            icon: <ShieldCheck className="text-blue-500" />,
            title: "Security First",
            desc: "Screenshot protection, unique access codes, and total control over board visibility."
        },
        {
            icon: <BarChart3 className="text-green-400" />,
            title: "Learning Insights",
            desc: "Detailed analytics on student participation and performance to drive better outcomes."
        }
    ];

    return (
        <div id="features" className="mt-40 mb-32 max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-black mb-4">Everything you need <br />to run a <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">modern class.</span></h2>
                <p className="text-gray-400 max-w-xl mx-auto font-medium">Built by educators, for educators. We focus on the tech so you can focus on the teaching.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featureItems.map((f, i) => <FeatureCard key={i} {...f} />)}
            </div>
        </div>
    );
};

const Testimonials = () => (
    <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
            <div className="max-w-md">
                <h2 className="text-4xl font-black tracking-tight mb-4">Loved by students. <br />Trusted by educators.</h2>
                <p className="text-gray-400 font-medium">Join over 500+ students at International School using ClassBoards every day.</p>
            </div>
            <div className="flex flex-col gap-6">
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm max-w-sm ml-auto">
                    <div className="flex gap-1 mb-3 text-yellow-400">
                        <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                    </div>
                    <p className="text-sm font-medium italic mb-4 text-gray-300">"ClassBoards turned my boring lectures into something students actually look forward to. The competitive scoring is a game changer!"</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500"></div>
                        <div>
                            <p className="text-xs font-bold">Ms. Sarah J.</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">History Teacher</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="py-20 px-6 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <Logo size="sm" />
                    <span className="text-lg font-black tracking-tight">ClassBoards</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">© 2026 ClassBoards. Built with <Heart size={12} className="inline text-pink-500" /> by T7, for the future of education.</p>
            </div>

            <div className="flex items-center gap-8 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
        </div>
    </footer>
);

// --- Main LandingPage Component ---

interface LandingPageProps {
    onStart: () => void;
    onGoogleLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onGoogleLogin }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Initialize Google One Tap
        const clientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientID || typeof window === 'undefined' || !(window as any).google) return;

        try {
            (window as any).google.accounts.id.initialize({
                client_id: clientID,
                callback: (response: any) => {
                    supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: response.credential,
                    }).then(() => onStart());
                }
            });
            (window as any).google.accounts.id.prompt();
        } catch (err) {
            console.error("Google One Tap Error:", err);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [onStart]);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500 selection:text-white font-sans overflow-x-hidden">

            <Navbar scrolled={scrolled} onStart={onStart} onGoogleLogin={onGoogleLogin} />

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-pink-400 mb-8 animate-in slide-in-from-top-10 duration-700">
                        <Sparkles size={14} /> Scale up your classroom with EduTech tools
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-in slide-in-from-bottom-10 duration-700 delay-100">
                        REIMAGINE YOUR <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">CLASSROOM.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-in slide-in-from-bottom-10 duration-700 delay-200">
                        The interactive digital wall for modern educators.
                        Engage your students with gamified quizzes, real-time collaboration, and bulletproof security.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                        <button
                            onClick={onStart}
                            className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            Get Started Free <ArrowRight size={20} />
                        </button>

                        <button
                            onClick={onGoogleLogin}
                            className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group"
                        >
                            Sign in with Google
                        </button>
                    </div>
                </div>

                <HeroCarousel />
            </section>

            <Features />
            <Testimonials />
            <Footer />
        </div>
    );
};
