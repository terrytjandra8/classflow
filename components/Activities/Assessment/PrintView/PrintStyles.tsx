
import React from 'react';

export const PrintStyles = () => (
    <style>{`
        @media print {
            @page { 
                size: A4;
                margin: 15mm; 
                @bottom-right {
                    content: "Page " counter(page) " of " counter(pages);
                    font-size: 9pt;
                    color: #666;
                }
            }
            
            /* GLOBAL RESET */
            html, body {
                background-color: white !important;
                height: auto !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            /* HIDE APP UI */
            #root, .app-layout, nav, header, aside {
                display: none !important;
            }

            body > *:not(#assessment-print-view) {
                display: none !important;
            }

            /* SHOW PRINT PORTAL */
            #assessment-print-view {
                display: block !important;
                visibility: visible !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                color: black !important;
                font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                font-size: 11pt !important;
                line-height: 1.3;
                z-index: 2147483647 !important; /* Max integer z-index */
            }

            #assessment-print-view * {
                visibility: visible !important;
            }

            /* LAYOUTS */
            .print-student-container {
                width: 100%;
                page-break-after: always;
                break-after: page;
            }
            
            .print-student-container:last-child {
                page-break-after: auto;
                break-after: auto;
            }
            
            /* Header */
            .print-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid black;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }

            .header-logos {
                display: flex;
                align-items: center;
                gap: 20px;
                 flex-shrink: 0; /* Prevent logos from shrinking */
            }

            /* Info Table */
            .header-info-table {
                border-collapse: collapse;
                width: 50%; /* Make table take up 50% of header width */
                font-size: 10pt !important;
                color: black !important;
            }

            .header-info-table td {
                border: 1px solid #ccc !important;
                padding: 4px 8px;
                vertical-align: middle;
                 height: 25px; /* Ensure a minimum height for all cells */
            }

            .label-cell {
                font-weight: bold;
                width: 70px; /* Fixed width for labels */
                background-color: #f0f0f0 !important;
            }

            .value-cell {
                width: auto; /* Allow value cells to fill remaining space */
            }

            /* Content Typography */
            h3 {
                font-size: 14pt !important;
                text-transform: uppercase;
                margin: 0;
            }

            .section-header {
                margin-top: 20px;
                margin-bottom: 10px;
                border-bottom: 1px solid black;
                padding-bottom: 5px;
                page-break-after: avoid; 
            }

            .question-block {
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            
            .rich-text-content {
                font-size: 11pt !important;
            }
            
            /* Answers */
            .correct-option { font-weight: bold; text-decoration: underline; }
            .wrong-option { text-decoration: line-through; opacity: 0.6; }
            .print-answer-image { max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ccc; }
        }
        
        @media screen {
            #assessment-print-view { display: none; }
        }
    `}</style>
);