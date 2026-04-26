
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShieldAlert, UserCheck, Lock, Activity } from 'lucide-react';

interface ScreenshotGuardProps {
    blockScreenshots: boolean;
    children: React.ReactNode;
    studentName?: string;
    onViolation?: (type: 'security' | 'focus') => void;
    boardId?: string;
}

export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({ blockScreenshots: isEnabled, children, studentName = "Student", onViolation, boardId }) => {
    const [lockType, setLockType] = useState<'security' | 'focus' | null>(null);
    const lockTypeRef = useRef<'security' | 'focus' | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Generate a fake but official-looking session ID
    const sessionId = useMemo(() => {
        const chars = 'ABCDEF0123456789';
        let res = '';
        for (let i = 0; i < 8; i++) res += chars[Math.floor(Math.random() * chars.length)];
        return `CB-${res}-${new Date().getFullYear()}`;
    }, []);

    const applyShield = useCallback((type: 'security' | 'focus') => {
        lockTypeRef.current = type;
        setLockType(type);
        if (onViolation) onViolation(type);
        if (contentRef.current) contentRef.current.style.filter = 'blur(40px) brightness(0.2)';
        if (overlayRef.current) {
            overlayRef.current.style.opacity = '1';
            overlayRef.current.style.pointerEvents = 'auto';
        }
    }, []);

    const releaseShield = useCallback(() => {
        lockTypeRef.current = null;
        setLockType(null);
        if (contentRef.current) contentRef.current.style.filter = '';
        if (overlayRef.current) {
            overlayRef.current.style.opacity = '0';
            overlayRef.current.style.pointerEvents = 'none';
        }
    }, []);

    useEffect(() => {
        if (!isEnabled) { 
            releaseShield(); 
            return; 
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key?.toLowerCase() ?? '';
            const kc = e.keyCode;
            const isSS = key === 'printscreen' || kc === 44 || (e.ctrlKey && (key === 'f5' || kc === 116));
            if (isSS) {
                applyShield('security');
                setTimeout(() => { if (lockTypeRef.current === 'security') releaseShield(); }, 4000);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('blur', () => applyShield('focus'));
        window.addEventListener('mouseleave', () => applyShield('focus'));
        window.addEventListener('focus', () => { if (lockTypeRef.current === 'focus') releaseShield(); });

        console.log(`[FocusGuard] Security Guard ARMED for board: ${boardId || 'unknown'}`);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('mouseleave', () => applyShield('focus'));
            releaseShield();
        };
    }, [isEnabled, applyShield, releaseShield]);

    if (!isEnabled) return <>{children}</>;

    const firstName = studentName.split(' ')[0].toUpperCase();

    return (
        <div className="relative h-screen w-full bg-slate-50 dark:bg-[#050505] overflow-hidden" onClick={() => { if (lockType === 'focus') releaseShield(); }}>
            <style>{`
                @media print { body * { display: none !important; } }
                
                .security-watermark {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 50;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    opacity: 0.04;
                    user-select: none;
                }
                .watermark-text {
                    transform: rotate(-25deg);
                    font-size: 14px;
                    font-weight: 900;
                    padding: 60px;
                    color: currentColor;
                    white-space: nowrap;
                }
            `}</style>

            {/* Identity Watermark */}
            <div className="security-watermark">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="watermark-text">
                        {studentName} • SECURE EXAM SESSION
                    </div>
                ))}
            </div>

            <div ref={contentRef} className="h-full w-full transition-all duration-300">
                {children}
            </div>

            {/* Academic Integrity Lock Overlay */}
            <div ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-8 transition-opacity duration-200"
                style={{ opacity: 0, pointerEvents: 'none' }}>
                <div className="max-w-md w-full bg-white dark:bg-[#111] p-10 rounded-[3rem] shadow-2xl text-center border border-white/10 relative overflow-hidden">
                    {/* Top Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-red-600"></div>
                    
                    <div className="bg-red-500/10 text-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={32} />
                    </div>

                    <p className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
                        Academic Violation Prevention
                    </p>

                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                        ATTENTION, {firstName}
                    </h2>
                    
                    <div className="h-px w-16 bg-slate-200 dark:bg-white/10 mx-auto mb-6"></div>

                    <p className="text-slate-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                        Security monitoring has detected focus loss. <br />
                        Your screen is hidden to protect exam integrity.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-left">
                            <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Student</p>
                            <p className="font-bold text-slate-800 dark:text-white truncate text-sm">{studentName}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-left">
                            <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Log ID</p>
                            <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{sessionId}</p>
                        </div>
                    </div>

                    <button onClick={() => releaseShield()} className="w-full bg-slate-900 text-white dark:bg-white dark:text-black font-black py-5 rounded-2xl text-lg transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                        <Lock size={18} />
                        RESUME SESSION
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-green-500">
                        <Activity size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Monitoring On</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
