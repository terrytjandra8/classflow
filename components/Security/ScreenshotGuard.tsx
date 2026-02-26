
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

    // --- Imperative Style & State Functions ---

    const applyShieldStyles = (type: 'integrity' | 'focus' | 'devtools') => {
        if (!overlayRef.current || !contentRef.current) return;
        const overlay = overlayRef.current;
        overlay.style.transition = 'opacity 0.1s ease-in';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        const content = contentRef.current;
        content.style.transition = 'filter 0.1s ease-in';
        if (type === 'integrity' || type === 'devtools') {
            content.style.filter = 'blur(15px) grayscale(100%)';
        } else { // focus
            content.style.filter = 'blur(5px)';
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

        // --- NEW STRATEGY: PRINT HIJACK ---
        const handleAfterPrint = () => {
            document.body.classList.remove('screenshot-blocking');
            releaseShield(true); // Force release the shield after printing is done.
        };

        window.addEventListener('afterprint', handleAfterPrint);

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

            const isPrintScreen = key === 'printscreen';
            // Note: Win+Shift+S does not trigger keydown in many browsers, so we focus on PrintScreen.
            const isMacScreenshot = isMac && e.metaKey && e.shiftKey && ['3', '4'].includes(key); 

            if (isPrintScreen || isMacScreenshot) {
                e.preventDefault();
                
                // 1. Add a class to the body. This class is used by our new @media print style.
                document.body.classList.add('screenshot-blocking');
                
                // 2. Trigger the shield overlay for user feedback.
                triggerShield('integrity');
                
                // 3. Call window.print(). This is a blocking action.
                // The browser will now apply @media print styles BEFORE the OS can take a screenshot.
                window.print();
                
                // 4. The `afterprint` event listener will handle all the cleanup.
                return;
            }

            // --- Existing DevTools and other shortcut blocks ---
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';
            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
                return; 
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

        const handleBlur = () => triggerShield('focus');
        const handleFocus = () => {
            if(lockTypeRef.current === 'focus') {
                releaseShield();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutRef.current);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('afterprint', handleAfterPrint);
            releaseShield(true); 
        };
    }, [isEnabled]);

    if (!isEnabled) return <>{children}</>;

    const getOverlayContent = () => {
        // ... (this remains the same)
        switch(lockType) {
            case 'integrity':
                return (
                    <>
                        <div className="text-6xl mb-6 animate-bounce">🧠</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">No Distractions, Please</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                            Printing and screenshots are disabled for this activity.
                        </p>
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
            {/* --- THIS IS THE CORE OF THE NEW SOLUTION --- */}
            <style>{`
                @media print {
                    /* When the body has this class, hide everything during the print process */
                    body.screenshot-blocking * {
                        display: none !important;
                    }
                    /* Ensure the body itself is also blank */
                    body.screenshot-blocking {
                        background: none !important;
                    }
                }
            `}</style>

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
