
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShieldAlert, Lock, Activity } from 'lucide-react';

interface ScreenshotGuardProps {
    /** Whether screenshot protection (watermark + keydown interception) is on */
    blockScreenshots: boolean;
    /** Whether focus guard (blur on mouse leave / tab switch) is on */
    enableFocusGuard: boolean;
    children: React.ReactNode;
    studentName?: string;
    onViolation?: (type: 'security' | 'focus') => void;
    boardId?: string;
}

/**
 * ScreenshotGuard
 * 
 * This component wraps content and enforces two independent protections:
 *   1. Screenshot Protection — watermark overlay + PrintScreen interception
 *   2. Focus Guard — blurs content + shows overlay when cursor leaves page or tab switches
 * 
 * IMPORTANT: The caller (BoardView) is responsible for deciding WHETHER to render
 * this component at all vs just rendering children directly. This component
 * assumes it is ALWAYS active when mounted — no internal teacher bypasses.
 * 
 * LAYOUT: Uses React Fragment (<>) at the top level so it adds ZERO wrapper divs
 * to the DOM tree. This ensures the student layout is identical to the teacher layout.
 * Watermark and overlay use fixed positioning — they don't need a parent container.
 */
export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({
    blockScreenshots,
    enableFocusGuard,
    children,
    studentName = 'Student',
    onViolation,
    boardId,
}) => {
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState<'security' | 'focus' | null>(null);
    const lockReasonRef = useRef<'security' | 'focus' | null>(null);

    // Generate a fake but official-looking session ID
    const sessionId = useMemo(() => {
        const chars = 'ABCDEF0123456789';
        let res = '';
        for (let i = 0; i < 8; i++) res += chars[Math.floor(Math.random() * chars.length)];
        return `CB-${res}-${new Date().getFullYear()}`;
    }, []);

    const firstName = studentName.split(' ')[0].toUpperCase();

    // ─── LOCK / UNLOCK ──────────────────────────────────────────────

    const lock = useCallback((reason: 'security' | 'focus') => {
        lockReasonRef.current = reason;
        setLockReason(reason);
        setIsLocked(true);
    }, []);

    const unlock = useCallback(() => {
        const reason = lockReasonRef.current;
        lockReasonRef.current = null;
        setLockReason(null);
        setIsLocked(false);
        if (reason && onViolation) {
            onViolation(reason);
        }
    }, [onViolation]);

    // ─── SCREENSHOT PROTECTION ──────────────────────────────────────

    useEffect(() => {
        if (!blockScreenshots) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))) {
                e.preventDefault();
                lock('security');
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', (e) => {
            if (e.key === 'PrintScreen') e.preventDefault();
        }, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [blockScreenshots, lock]);

    // ─── FOCUS GUARD ────────────────────────────────────────────────

    useEffect(() => {
        if (!enableFocusGuard) return;

        const onDocMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                lock('focus');
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                lock('focus');
            }
        };

        const onWindowBlur = () => {
            lock('focus');
        };

        const onMouseEnter = () => {
            // Mouse returned — don't auto-unlock, user must click RESUME
        };

        const onWindowFocus = () => {
            // Window regained focus — don't auto-unlock
        };

        // Attach all listeners
        document.documentElement.addEventListener('mouseleave', onDocMouseLeave);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('mouseenter', onMouseEnter);
        window.addEventListener('focus', onWindowFocus);

        return () => {
            document.documentElement.removeEventListener('mouseleave', onDocMouseLeave);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onWindowBlur);
            window.removeEventListener('mouseenter', onMouseEnter);
            window.removeEventListener('focus', onWindowFocus);
        };
    }, [enableFocusGuard, lock, unlock]);

    // ─── RENDER ─────────────────────────────────────────────────────
    // Uses Fragment (<>) — NO wrapper divs that would break the parent layout.
    // Watermark + overlay are fixed-position, children flow directly into parent.

    return (
        <>
            {/* Print protection */}
            <style>{`@media print { body * { display: none !important; } }`}</style>

            {/* Watermark overlay — fixed position, no layout impact */}
            {blockScreenshots && (
                <div
                    className="fixed inset-0 pointer-events-none z-50 grid grid-cols-3 select-none"
                    style={{ opacity: 0.04 }}
                >
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="whitespace-nowrap font-black text-sm p-[60px]"
                            style={{ transform: 'rotate(-25deg)' }}
                        >
                            {studentName} • SECURE EXAM SESSION
                        </div>
                    ))}
                </div>
            )}

            {/* Main content — single wrapper for blur only, inherits parent size */}
            <div
                className="h-full w-full"
                style={{
                    filter: isLocked ? 'blur(40px) brightness(0.2)' : 'none',
                    pointerEvents: isLocked ? 'none' : 'auto',
                    transition: 'filter 0.3s ease',
                }}
            >
                {children}
            </div>

            {/* Academic Integrity Lock Overlay — fixed position, no layout impact */}
            <div
                className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-8 transition-opacity duration-150"
                style={{
                    opacity: isLocked ? 1 : 0,
                    pointerEvents: isLocked ? 'auto' : 'none',
                }}
            >
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

                    <button
                        onClick={unlock}
                        className="w-full bg-slate-900 text-white dark:bg-white dark:text-black font-black py-5 rounded-2xl text-lg transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Lock size={18} />
                        RESUME SESSION
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-green-500">
                        <Activity size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Monitoring On</span>
                    </div>
                </div>
            </div>
        </>
    );
};
