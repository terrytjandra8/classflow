
import React, { useState, useEffect, useRef } from 'react';

interface ScreenshotGuardProps {
    isEnabled: boolean;
    children: React.ReactNode;
}

export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({ isEnabled, children }) => {
    const [lockType, setLockType] = useState<'integrity' | 'focus' | 'devtools' | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<any>(null);

    const lockTypeRef = useRef(lockType);
    lockTypeRef.current = lockType;

    useEffect(() => {
        if (!isEnabled) {
            if (contentRef.current) contentRef.current.style.filter = 'none';
            return;
        }

        const triggerShield = (type: 'integrity' | 'focus' | 'devtools', isProactive = false) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            const severity = { 'devtools': 3, 'integrity': 2, 'focus': 1 };
            setLockType(prev => {
                if (!prev || severity[type] >= severity[prev]) return type;
                return prev;
            });
            
            if (overlayRef.current) {
                overlayRef.current.style.transition = isProactive ? 'none' : 'opacity 0.1s ease-in';
                overlayRef.current.style.opacity = isProactive ? '0.5' : '1'; // Proactive shield is semi-transparent
                overlayRef.current.style.pointerEvents = 'auto';
                document.body.style.pointerEvents = 'none'; 
            }
            if (contentRef.current) {
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = isProactive ? 'blur(5px)' : 'blur(15px) grayscale(100%)';
            }
        };

        const releaseShield = (force = false) => {
            if (lockTypeRef.current === 'devtools' && !force) return;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setLockType(null);
            
            if (overlayRef.current) {
                overlayRef.current.style.transition = 'opacity 0.1s ease-out';
                overlayRef.current.style.opacity = '0';
                overlayRef.current.style.pointerEvents = 'none';
                document.body.style.pointerEvents = 'auto';
            }
            if (contentRef.current) {
                contentRef.current.style.transition = 'filter 0.1s ease-out';
                contentRef.current.style.filter = 'none';
            }
        };

        const handleBlur = () => triggerShield('focus');
        const handleFocus = () => releaseShield();

        const handleKeyDown = (e: KeyboardEvent) => {
            // --- Proactive Shielding --- 
            // On any key press, instantly trigger a light shield to win the race condition.
            if (!lockTypeRef.current) {
                triggerShield('focus', true);
            }

            const key = e.key.toLowerCase();
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';
            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
                return; 
            }
            
            const macScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(key);
            const windowsScreenshot = e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && key === 's');
            const chromebookScreenshot = e.ctrlKey && e.code === 'F5';

            if (macScreenshot || windowsScreenshot || chromebookScreenshot) {
                e.preventDefault();
                // Upgrade the proactive shield to the full integrity lock
                triggerShield('integrity');
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText('Screenshots are disabled.').catch(err => console.error('Failed to write to clipboard:', err));
                }
            } 
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // If the key was safe, release the light proactive shield.
            // We only do this if the lock is still the light 'focus' one.
            if (lockTypeRef.current === 'focus') {
                if(timeoutRef.current) clearTimeout(timeoutRef.current);
                // A tiny delay prevents flickering during normal typing.
                timeoutRef.current = setTimeout(releaseShield, 50); 
            }
        };
        
        const devToolsDetector = () => {
            const threshold = 160;
            const devToolsOpen = (window.outerWidth - window.innerWidth > threshold) || (window.outerHeight - window.innerHeight > threshold);
            if (devToolsOpen && lockTypeRef.current !== 'devtools') {
                triggerShield('devtools');
            }
        };
        const intervalId = setInterval(devToolsDetector, 500);

        const preventDefault = (e: Event) => {
            if(lockTypeRef.current) {
                 e.preventDefault();
                 e.stopPropagation();
            }
        };

        const handlePrint = (e: Event) => {
             triggerShield('integrity');
             e.preventDefault();
        }

        // Add all listeners
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('contextmenu', preventDefault, true);
        document.addEventListener('copy', preventDefault, true);
        document.addEventListener('cut', preventDefault, true);
        document.addEventListener('dragstart', preventDefault, true);
        window.addEventListener('beforeprint', handlePrint);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutRef.current);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            document.removeEventListener('contextmenu', preventDefault, true);
            document.removeEventListener('copy', preventDefault, true);
            document.removeEventListener('cut', preventDefault, true);
            document.removeEventListener('dragstart', preventDefault, true);
            window.removeEventListener('beforeprint', handlePrint);
            releaseShield(true); 
        };
    }, [isEnabled]);

    if (!isEnabled) return <>{children}</>;

    const getOverlayContent = () => {
        switch(lockType) {
            case 'integrity':
                return (
                    <>
                        <div className="text-6xl mb-6 animate-bounce">🧠</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Academic Integrity</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please answer using your own understanding.<br/>
                            Screenshots and copying are disabled to encourage original thinking.
                        </p>
                        <p className="text-gray-400 dark:text-gray-600 text-xs mt-8 font-bold uppercase tracking-widest">ClassBoard Focus Guard</p>
                    </>
                );
            case 'devtools':
                 return (
                     <>
                        <div className="text-6xl mb-6">⚠️</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Developer Tools Detected</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please close the developer console to continue. Accessing the inspector is not permitted.
                        </p>
                    </>
                );
            case 'focus':
            default:
                // The proactive shield shows a minimal UI so it's less intrusive
                if (overlayRef.current && overlayRef.current.style.opacity === '0.5') return null;
                return (
                    <>
                        <div className="text-6xl mb-6 animate-pulse">🎯</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Get Back to It!</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            This activity requires your full attention. Please return to this window to continue.
                        </p>
                    </>
                );
        }
    }

    return (
        <div className="relative h-full w-full overflow-hidden select-none">
            <style>{`@media print { html, body, * { display: none !important; } }`}</style>
            <div ref={contentRef} className="h-full w-full will-change-filter" style={{ transition: 'filter 0.1s ease-out' }}>
                {children}
            </div>
            <div 
                ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
                style={{ 
                    opacity: lockType ? 1 : 0, 
                    pointerEvents: lockType ? 'auto' : 'none',
                    transition: 'opacity 0.05s ease-in-out'
                }}
            >
                {getOverlayContent()}
            </div>
        </div>
    );
};
