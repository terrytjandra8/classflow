
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

        // --- The Instantaneous Shield --- 
        // This function bypasses React's async state to show the shield instantly.
        const showInstantShield = () => {
            if (overlayRef.current && contentRef.current) {
                setLockType('integrity'); // Set the content for the shield
                // Directly manipulate style to win the race condition
                overlayRef.current.style.transition = 'none';
                overlayRef.current.style.opacity = '1';
                overlayRef.current.style.pointerEvents = 'auto';
                contentRef.current.style.transition = 'none';
                contentRef.current.style.filter = 'blur(15px) grayscale(100%)';
            }
        }

        const triggerShield = (type: 'integrity' | 'focus' | 'devtools') => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            const severity = { 'devtools': 3, 'integrity': 2, 'focus': 1 };
            setLockType(prev => {
                if (!prev || severity[type] >= severity[prev]) return type;
                return prev;
            });
        };

        const releaseShield = (force = false) => {
            if (lockTypeRef.current === 'devtools' && !force) return;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setLockType(null);
            
            if (overlayRef.current) {
                // Ensure transitions are re-enabled for a smooth fade-out
                overlayRef.current.style.transition = 'opacity 0.2s ease-out';
                overlayRef.current.style.opacity = '0';
                overlayRef.current.style.pointerEvents = 'none';
            }
            if (contentRef.current) {
                contentRef.current.style.transition = 'filter 0.2s ease-out';
                contentRef.current.style.filter = 'none';
            }
        };

        const poisonClipboard = () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText('Copying and screenshots are disabled for this activity.').catch(err => {
                    console.error("Could not poison clipboard:", err);
                });
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            // --- Primary defense against PrintScreen --- 
            if (key === 'printscreen') {
                e.preventDefault();
                showInstantShield(); // Use the synchronous shield
                poisonClipboard();
                
                if(timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(releaseShield, 1500);
                return;
            }
            
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';
            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
                return; 
            }

            const macScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(key);
            const windowsScreenshot = e.metaKey && e.shiftKey && key === 's';
            if (macScreenshot || windowsScreenshot) {
                e.preventDefault();
                triggerShield('integrity'); 
                poisonClipboard();
            }
        };

        const handleBlock = (e: Event) => {
            e.preventDefault();
            triggerShield('integrity');
            poisonClipboard();
            if(timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(releaseShield, 1500);
        }

        const devToolsDetector = () => {
            const threshold = 160;
            const devToolsOpen = (window.outerWidth - window.innerWidth > threshold) || (window.outerHeight - window.innerHeight > threshold);
            if (devToolsOpen && lockTypeRef.current !== 'devtools') {
                triggerShield('devtools');
            }
        };
        const intervalId = setInterval(devToolsDetector, 500);

        const handleBlur = () => triggerShield('focus');
        const handleFocus = () => {
            if(lockTypeRef.current !== 'devtools') {
                releaseShield();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('copy', handleBlock, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeprint', handleBlock);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutRef.current);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('copy', handleBlock, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeprint', handleBlock);
            releaseShield(true); 
        };
    }, [isEnabled]);

    useEffect(() => {
        // This effect ensures that when lockType changes via React state, the styles are correct.
        // This is for non-instantaneous triggers like blur or devtools.
        if (lockType) {
            if (overlayRef.current && contentRef.current) {
                overlayRef.current.style.opacity = '1';
                overlayRef.current.style.pointerEvents = 'auto';
                contentRef.current.style.filter = (lockType === 'focus') ? 'blur(5px)' : 'blur(15px) grayscale(100%)';
            }
        } else {
             if (overlayRef.current) {
                overlayRef.current.style.opacity = '0';
                overlayRef.current.style.pointerEvents = 'none';
             }
             if (contentRef.current) {
                contentRef.current.style.filter = 'none';
             }
        }
    }, [lockType]);

    if (!isEnabled) return <>{children}</>;

    const getOverlayContent = () => {
        switch(lockType) {
            case 'integrity':
                return (
                    <>
                        <div className="text-6xl mb-6 animate-bounce">🧠</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">No Distractions, Please</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Please focus on the task. Screenshots and copying are disabled to encourage original thinking.
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
                            Please close the developer console to continue. This is not allowed.
                        </p>
                    </>
                );
            case 'focus':
            default:
                return (
                    <>
                        <div className="text-6xl mb-6 animate-pulse">🎯</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Stay Focused</h2>
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
            <div ref={contentRef} className="h-full w-full will-change-filter" style={{ transition: 'filter 0.2s ease-out' }}>
                {children}
            </div>
            <div 
                ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
                style={{ 
                    opacity: 0, // Start as hidden
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s ease-in-out'
                }}
            >
                {getOverlayContent()}
            </div>
        </div>
    );
};
