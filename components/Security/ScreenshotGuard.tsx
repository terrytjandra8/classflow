
import React, { useState, useEffect, useRef } from 'react';

interface ScreenshotGuardProps {
    isEnabled: boolean;
    children: React.ReactNode;
    /** Grace period in ms before the focus-loss overlay triggers. Default: 1500ms */
    blurGraceMs?: number;
}

export const ScreenshotGuard: React.FC<ScreenshotGuardProps> = ({ isEnabled, children, blurGraceMs = 1500 }) => {
    const [lockType, setLockType] = useState<'integrity' | 'focus' | 'devtools' | null>(null);
    const lockTypeRef = useRef<'integrity' | 'focus' | 'devtools' | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const applyShieldStyles = (type: 'integrity' | 'focus' | 'devtools') => {
        if (!overlayRef.current) return;
        const overlay = overlayRef.current;
        overlay.style.transition = 'opacity 0.1s ease-in';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';

        if (contentRef.current && document.body.style.display !== 'none') {
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
            contentRef.current.style.display = ''; // ** CRUCIAL: Restore visibility **
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
            lockTypeRef.current = null;
            setLockType(null);
            releaseShieldStyles();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

            const isPrintScreen = key === 'printscreen';
            const isMacScreenshot = isMac && e.metaKey && e.shiftKey && ['3', '4'].includes(key);
            // Chromebook: Ctrl+Overview (mapped as F5 or F4 depending on model)
            const isChromebookScreenshot = e.ctrlKey && (key === 'f5' || key === 'f4');

            if (isPrintScreen || isMacScreenshot || isChromebookScreenshot) {
                e.preventDefault();
                if (contentRef.current) {
                    contentRef.current.style.display = 'none';
                }
                triggerShield('integrity');
                window.print();
                return;
            }
            
            const devToolsShortcuts = (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) || key === 'f12';
            if (devToolsShortcuts) {
                e.preventDefault();
                triggerShield('devtools');
                return; 
            }
        };
        
        const handleAfterPrint = () => {
            // This event fires after the print dialog is closed.
            // It's our cue to restore the UI to its normal state.
            releaseShield(true);
        };

        const handleBlur = () => {
            if (!document.hasFocus()) {
                triggerShield('focus');
            }
        };

        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                triggerShield('focus');
            }
        };

        const handleMouseEnter = () => {
            if (lockTypeRef.current === 'focus' && document.hasFocus()) {
                releaseShield();
            }
        };

        const handleFocus = () => {
            if (lockTypeRef.current === 'focus') {
                releaseShield();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('afterprint', handleAfterPrint);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('afterprint', handleAfterPrint);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
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
                        <div className="text-6xl mb-6">🚫</div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Action Blocked</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-lg leading-relaxed">
                           For security reasons, this action has been blocked. Please cancel the print dialog to continue.
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
             <style>{`
                @media print {
                    /* This is the key. It blanks the entire page during the print process. */
                    body * {
                        display: none !important;
                    }
                     body {
                        background: none !important;
                    }
                }
            `}</style>
            <div ref={contentRef} className="h-full w-full">
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
