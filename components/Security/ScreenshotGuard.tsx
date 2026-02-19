
import React, { useState, useEffect, useRef } from 'react';

interface ScreenshotGuardProps {
    isEnabled: boolean;
    username: string;
    children: React.ReactNode;
}

export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({ isEnabled, children }) => {
    const [lockType, setLockType] = useState<'integrity' | 'focus' | 'devtools' | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<any>(null);

    // Use a ref to get the latest lockType value inside intervals/closures without re-triggering useEffect.
    const lockTypeRef = useRef(lockType);
    lockTypeRef.current = lockType;

    useEffect(() => {
        if (!isEnabled) {
            if (contentRef.current) contentRef.current.style.filter = 'none';
            return;
        }

        const triggerShield = (type: 'integrity' | 'focus' | 'devtools') => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            // More severe locks should take precedence.
            const severity = { 'devtools': 3, 'integrity': 2, 'focus': 1 };
            setLockType(prev => {
                if (!prev || severity[type] >= severity[prev]) return type;
                return prev;
            });
            
            if (overlayRef.current) {
                overlayRef.current.style.transition = 'none';
                overlayRef.current.style.opacity = '1';
                overlayRef.current.style.pointerEvents = 'auto';
            }
            if (contentRef.current) {
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = 'blur(15px) grayscale(100%)';
            }
        };

        const releaseShield = (force = false) => {
            // Devtools lock is special: it should only be released when forced.
            if (lockTypeRef.current === 'devtools' && !force) {
                return;
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setLockType(null);
            
            if (overlayRef.current) {
                overlayRef.current.style.transition = 'opacity 0.1s ease-out';
                overlayRef.current.style.opacity = '0';
                overlayRef.current.style.pointerEvents = 'none';
            }
            if (contentRef.current) {
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = 'none';
            }
        };

        // --- Event Listeners (Layered Approach) ---

        // Layer 1: Catch-all for window focus loss (e.g., system-level screenshot tools)
        const handleBlur = () => triggerShield('focus');
        const handleFocus = () => releaseShield();
        
        // Layer 2: Redundant mouse check
        const handleMouseLeave = () => triggerShield('focus');
        const handleMouseEnter = () => releaseShield();

        // Layer 3: Specific keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            // DevTools shortcuts
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';

            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
            }
            
            // Screenshot shortcuts
            const macScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key);
            const windowsScreenshot = e.metaKey && e.shiftKey && key === 's';
            const chromebookScreenshot = e.ctrlKey && e.shiftKey && e.code === 'Select';
            const chromebookPartial = e.ctrlKey && e.shiftKey && key === 's';

            if (e.key === 'PrintScreen' || macScreenshot || windowsScreenshot || chromebookScreenshot || chromebookPartial) {
                e.preventDefault();
                triggerShield('integrity');
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText('Screenshots are disabled.');
                }
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(releaseShield, 2000); 
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                triggerShield('integrity');
            }
        };
        
        // Layer 4: DevTools detection via interval check
        const devToolsDetector = () => {
            const threshold = 160;
            const devToolsOpen = (window.outerWidth - window.innerWidth > threshold) || (window.outerHeight - window.innerHeight > threshold);
            if (devToolsOpen) {
                if (lockTypeRef.current !== 'devtools') {
                    triggerShield('devtools');
                }
            } else {
                if (lockTypeRef.current === 'devtools') {
                    releaseShield(true); // Force release the shield
                }
            }
        };
        const intervalId = setInterval(devToolsDetector, 500);

        // Layer 5: Disable other actions
        const preventDefault = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const mediaQueryList = window.matchMedia('print');
        const handlePrintChange = (mql: MediaQueryListEvent) => {
            if (mql.matches) triggerShield('integrity');
        };

        // Add all listeners
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('dragstart', preventDefault);
        mediaQueryList.addEventListener('change', handlePrintChange);

        // Cleanup
        return () => {
            clearInterval(intervalId);
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
            <div ref={contentRef} className="h-full w-full will-change-filter" style={{ transition: 'filter 0.1s ease-out' }}>
                {children}
            </div>
            <div 
                ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-white dark:bg-black flex flex-col items-center justify-center text-center p-8"
                style={{ 
                    opacity: lockType ? 1 : 0, 
                    pointerEvents: lockType ? 'auto' : 'none',
                    transition: 'opacity 0.1s ease-out'
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
                ) : lockType === 'devtools' ? (
                     <>
                        <div className="text-6xl mb-6">⚠️</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Developer Tools Detected</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please close the developer console to continue. Accessing the inspector is not permitted.
                        </p>
                    </>
                ) : ( // 'focus'
                    <>
                        <div className="text-6xl mb-6 animate-pulse">🎯</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Get Back to It!</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            This activity requires your full attention. Please return to this window to continue.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
