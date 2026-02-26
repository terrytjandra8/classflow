import React from 'react';

/**
 * A component that injects global styles to prevent printing of the page content.
 * This is a security measure to make it harder to copy the content of the application.
 * It works in conjunction with the ScreenshotGuard component.
 */
export const PrintStyles = () => {
  return (
    <style>{`
        @media print {
            /* Hide everything by default when printing */
            body * {
                display: none !important;
            }
            /* Ensure the body itself is blank */
            body {
                background: none !important;
            }
        }
    `}</style>
  );
};
