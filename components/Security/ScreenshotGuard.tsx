
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
    const modifierKeyPressed = useRef(false);

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
                overlayRef.current.style.opacity = isProactive ? '0.5' : '1';
                overlayRef.current.style.pointerEvents = 'auto';
            }
            if (contentRef.current) {
                contentRef.current.style.transition = isProactive ? 'none' : 'blur(5px)';
                if (type === 'integrity' || type === 'devtools') {
                     contentRef.current.style.filter = 'blur(15px) grayscale(100%)';
                }
            }
        };

        const releaseShield = (force = false) => {
            if (lockTypeRef.current === 'devtools' && !force) return;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setLockType(null);
            modifierKeyPressed.current = false;
            
            if (overlayRef.current) {
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

            if (key === 'printscreen') {
                e.preventDefault();
                triggerShield('integrity');
                poisonClipboard();
                // Keep shield up for a moment to signal that the action was blocked.
                if(timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => releaseShield(), 1500);
                return;
            }

            const isModifier = e.ctrlKey || e.metaKey || e.altKey;
            if (isModifier && !modifierKeyPressed.current) {
                modifierKeyPressed.current = true;
                // Only trigger the proactive shield if it's not already up.
                if (!lockTypeRef.current) {
                    triggerShield('focus', true);
                }
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

        const handleKeyUp = (e: KeyboardEvent) => {
            const isModifier = !e.ctrlKey && !e.metaKey && !e.altKey;
            if (isModifier) {
                modifierKeyPressed.current = false;
                // Only release the shield if it was the light 'focus' one.
                if (lockTypeRef.current === 'focus') {
                    releaseShield();
                }
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            triggerShield('integrity');
            poisonClipboard();
            if(timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => releaseShield(), 1500);
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
        const handleFocus = () => releaseShield(lockTypeRef.current !== 'devtools');
        
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('copy', handleCopy, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutRef.current);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('copy', handleCopy, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
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
                 // Proactive shield has no text, it's just a blur and dark overlay.
                if (modifierKeyPressed.current) return null;
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
                    opacity: lockType ? 1 : 0, 
                    pointerEvents: lockType ? 'auto' : 'none',
                    transition: 'opacity 0.05s ease-in-out, backdrop-filter 0.05s ease-in-out'
                }}
            >
                {getOverlayContent()}
            </div>
        </div>
    );
};
