
import React, { useState, useEffect, useRef } from 'react';

interface ScreenshotGuardProps {
    isEnabled: boolean;
    username: string; // Kept for interface compatibility even if not used for global watermark
    children: React.ReactNode;
}

export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({ isEnabled, children }) => {
    const [lockType, setLockType] = useState<'integrity' | 'focus' | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!isEnabled) {
            // Cleanup styles if disabled dynamically
            if (contentRef.current) contentRef.current.style.filter = 'none';
            return;
        }

        const triggerShield = (type: 'integrity' | 'focus') => {
            // Stop any pending release to prevent race conditions (flashing)
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Integrity lock takes precedence over focus lock
            setLockType(prev => (prev === 'integrity' ? 'integrity' : type));
            
            if (overlayRef.current) {
                // Instant activation - Disable transition for immediate block
                overlayRef.current.style.transition = 'none';
                overlayRef.current.style.opacity = '1';
                overlayRef.current.style.pointerEvents = 'auto';
            }
            if (contentRef.current) {
                // Instant blur - Disable transition to prevent rendering lag
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = 'blur(15px) grayscale(100%)'; 
            }
        };

        const releaseShield = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            // Instant release state update
            setLockType(null);
            
            if (overlayRef.current) {
                // Very fast fade out (0.1s) to feel instant but smooth
                overlayRef.current.style.transition = 'opacity 0.1s ease-out';
                overlayRef.current.style.opacity = '0';
                overlayRef.current.style.pointerEvents = 'none';
            }
            if (contentRef.current) {
                // Instant unblur - No transition to avoid laggy visual calculation
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = 'none';
            }
        };

        // Triggers
        const handleBlur = () => triggerShield('focus');
        const handleFocus = () => releaseShield(); // When window regains focus
        
        const handleMouseLeave = () => triggerShield('focus');
        const handleMouseEnter = () => releaseShield();

        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen, Cmd+Shift+3/4/5 (Mac), Win+Shift+S (Windows)
            if (
                e.key === 'PrintScreen' || 
                (e.metaKey && e.shiftKey) || 
                (e.key === 'Meta' && e.shiftKey) ||
                (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') // Common browser shortcut
            ) {
                triggerShield('integrity');
                
                // Clear clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('Screenshots are disabled.');
                }

                // Keep shield up longer for actual screenshot attempts (penalize checking)
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(releaseShield, 2000); 
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') triggerShield('integrity');
        };

        // Disable Context Menu and Copying
        const preventDefault = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        
        // Anti-Copy/Save Events
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('dragstart', preventDefault);
        
        // Print Protection
        const mediaQueryList = window.matchMedia('print');
        const handlePrintChange = (mql: MediaQueryListEvent) => {
            if (mql.matches) {
                triggerShield('integrity');
            }
        };
        mediaQueryList.addEventListener('change', handlePrintChange);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('dragstart', preventDefault);
            
            mediaQueryList.removeEventListener('change', handlePrintChange);
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isEnabled]);

    if (!isEnabled) return <>{children}</>;

    return (
        <div className="relative h-full w-full overflow-hidden select-none">
            {/* Global Print Styles */}
            <style>{`
                @media print {
                    html, body { display: none !important; height: 0 !important; overflow: hidden !important; }
                    * { display: none !important; }
                }
                body {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
            `}</style>

            {/* Content Wrapper */}
            <div ref={contentRef} className="h-full w-full will-change-filter">
                {children}
            </div>
            
            {/* Privacy Shield Overlay (Triggered on Violation) */}
            <div 
                ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-white dark:bg-black flex flex-col items-center justify-center text-center p-8"
                style={{ 
                    opacity: lockType ? 1 : 0, 
                    pointerEvents: lockType ? 'auto' : 'none' 
                }}
            >
                {lockType === 'integrity' ? (
                    <>
                        <div className="text-6xl mb-6 animate-bounce">🧠</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Academic Integrity</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please answer using your own understanding.<br/>
                            Screenshots and copying are disabled to encourage original thinking.
                        </p>
                        <p className="text-gray-400 dark:text-gray-600 text-xs mt-8 font-bold uppercase tracking-widest">ClassBoard Focus Guard</p>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-6 animate-pulse">🎯</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Get Back to It!</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please bring your cursor back to the window to continue working.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
