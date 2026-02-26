
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
    const passwordInputRef = useRef<HTMLInputElement | null>(null);

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
            contentRef.current.style.filter = 'none';
            contentRef.current.style.transition = 'filter 0.2s ease-out';
        }
        // Clean up the password input if it exists
        if (passwordInputRef.current) {
            document.body.removeChild(passwordInputRef.current);
            passwordInputRef.current = null;
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

            if (key === 'printscreen') {
                e.preventDefault();

                // --- THE PASSWORD FIELD TRICK ---
                if (!passwordInputRef.current) {
                    const input = document.createElement('input');
                    input.type = 'password';
                    input.style.position = 'fixed';
                    input.style.top = '0';
                    input.style.left = '0';
                    input.style.width = '1px';
                    input.style.height = '1px';
                    input.style.opacity = '0';
                    document.body.appendChild(input);
                    passwordInputRef.current = input;
                }
                passwordInputRef.current.focus();
                // ---

                triggerShield('integrity');
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
            if(lockTypeRef.current === 'focus') {
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
