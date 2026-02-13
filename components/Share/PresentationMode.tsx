
import React, { useState, useEffect } from 'react';
import { Minimize2, Globe, Wifi, Smartphone } from 'lucide-react';
import { Board } from '../../types';

interface PresentationModeProps {
    board: Board;
    onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ board, onClose }) => {
    const [mounted, setMounted] = useState(false);

    // Return null if the essential board or classCode is missing to prevent crashes.
    if (!board || !board.classCode) {
        return null;
    }
    
    const displayUrl = `${window.location.origin}/?code=${board.classCode}`;
    const domain = window.location.host;

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-[#050505] text-white font-sans overflow-hidden flex flex-col items-center justify-center selection:bg-white/20">
            
            {/* --- Cinematic Background --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Deep atmospheric gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/30 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-900/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.07]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
            </div>

            {/* --- Header Controls --- */}
            <div className="absolute top-8 left-8 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
                 <div className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-widest uppercase text-white/70">Live Session</span>
                 </div>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/10 group hover:scale-105 active:scale-95"
            >
                <Minimize2 size={24} className="group-hover:scale-90 transition-transform" />
            </button>

            {/* --- The Monolith Card (Center) --- */}
            <div className={`relative z-10 w-full max-w-5xl aspect-auto md:aspect-[16/9] max-h-[85vh] bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-1000 transform ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                
                {/* Left Side: The Data (Code) */}
                <div className="flex-1 flex flex-col justify-center p-12 md:p-20 relative overflow-hidden group">
                    
                    {/* Background Shine effect for left panel */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-400/80">
                                <Globe size={20} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">{domain}</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                                Join the <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Experience</span>
                            </h1>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Enter Code</p>
                            <div className="text-7xl md:text-9xl font-mono font-black tracking-tighter text-white tabular-nums">
                                {board.classCode.split('').map((char, i) => (
                                    <span key={i} className="inline-block hover:-translate-y-2 transition-transform duration-300 cursor-default">{char}</span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex items-center gap-4 text-white/40">
                            <Wifi size={18} />
                            <span className="text-sm font-medium">Network: Stable</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: The Gateway (QR) */}
                <div className="w-full md:w-[45%] bg-white/5 border-t md:border-t-0 md:border-l border-white/10 flex flex-col items-center justify-center p-12 relative">
                    
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>

                    <div className="relative bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-700 hover:scale-[1.02] hover:rotate-1">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(displayUrl)}&bgcolor=ffffff&color=000000&margin=0`}
                            alt="Scan to Join"
                            className="w-56 h-56 md:w-64 md:h-64 object-contain rounded-xl mix-blend-multiply rendering-pixelated"
                        />
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center gap-2 w-full">
                            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50 whitespace-nowrap">Scan with Camera</span>
                        </div>
                    </div>

                </div>

            </div>

            {/* --- Footer Status --- */}
            <div className="absolute bottom-8 left-0 right-0 text-center z-10 pointer-events-none">
                <p className="text-white/20 text-xs font-medium uppercase tracking-[0.3em] animate-pulse">Waiting for players to connect...</p>
            </div>

        </div>
    );
};
