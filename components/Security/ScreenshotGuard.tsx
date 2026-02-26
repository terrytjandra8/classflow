
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
    const lockTypeRef = useRef<'integrity' | 'focus' | 'devtools' | null>(null);

    const applyShieldStyles = (type: 'integrity' | 'focus' | 'devtools') => {
        if (!overlayRef.current) return;
        const overlay = overlayRef.current;
        overlay.style.transition = 'opacity 0.1s ease-in';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        if (contentRef.current) {
            const content = contentRef.current;
            content.style.transition = 'filter 0.1s ease-in';
            if (type === 'integrity' || type === 'devtools') {
                content.style.filter = 'blur(15px) grayscale(100%)';
            } else { // focus
                content.style.filter = 'blur(5px)';
            }
        }
    };

    const releaseShieldStyles = () => {
        if (overlayRef.current) {
            overlayRef.current.style.transition = 'opacity 0.2s ease-out';
            overlayRef.current.style.opacity = '0';
            overlayRef.current.style.pointerEvents = 'none';
        }
        if (contentRef.current) {
            const content = contentRef.current;
            content.style.filter = 'none';
            content.style.transition = 'filter 0.2s ease-out';
            // Restore the content's visibility
            content.style.display = '';
        }
    };

    useEffect(() => {
        if (!isEnabled) {
            releaseShieldStyles();
            return;
        }

        const triggerShield = (type: 'integrity' | 'focus' | 'devtools') => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            const severity = { 'devtools': 3, 'integrity': 2, 'focus': 1 };
            const currentType = lockTypeRef.current;

            if (!currentType || severity[type] >= severity[currentType]) {
                lockTypeRef.current = type;
                setLockType(type);
                applyShieldStyles(type);
            }
        };

        const releaseShield = (force = false) => {
            if (lockTypeRef.current === 'devtools' && !force) return;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            lockTypeRef.current = null;
            setLockType(null);
            releaseShieldStyles();
        };

        const poisonClipboard = () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText('Copying and screenshots are disabled.').catch(err => {
                    console.error("Could not poison clipboard:", err);
                });
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

            const isPrintScreen = key === 'printscreen';
            const isWinScreenshot = !isMac && e.metaKey && e.shiftKey && key === 's';
            const isMacScreenshot = isMac && e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(key);

            if (isPrintScreen || isWinScreenshot || isMacScreenshot) {
                e.preventDefault();

                // **ADDED LOGIC**: Immediately hide content before showing the shield.
                if (contentRef.current) {
                    contentRef.current.style.display = 'none';
                }

                triggerShield('integrity');
                poisonClipboard();
                
                if(timeoutRef.current) clearTimeout(timeoutRef.current);
                // For printscreen, we set a timeout. For others, the shield stays until focus is regained.
                if(isPrintScreen) {
                    timeoutRef.current = setTimeout(releaseShield, 1500);
                }
                return;
            }
            
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';
            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
                return; 
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
             // Only release shield if it was a simple focus lock or an integrity lock from a non-printscreen shortcut
            if (lockTypeRef.current === 'focus' || (lockTypeRef.current === 'integrity' && !timeoutRef.current)) {
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
            <div ref={contentRef} className="h-full w-full will-change-filter">
                {children}
            </div>
            <div 
                ref={overlayRef}
                className="absolute inset-0 z-[10000] bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center text-center p-8"
                style={{ opacity: 0, pointerEvents: 'none'}}
            >
                {getOverlayContent()}
            </div>
        </div>
    );
};
