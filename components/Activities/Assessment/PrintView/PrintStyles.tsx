
import React from 'react';

export const PrintStyles = () => (
    <style>{`
        @media print {
            @page { 
                size: A4;
                margin: 15mm; 
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
                align-items: flex-start;
                gap: 40px; /* Control space between logos and table */
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
                flex: 1 1 0; /* Allow table to grow and fill available space */
                width: 100%; /* Needed for table-layout:fixed with % widths */
                table-layout: fixed;
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
                background-color: #f0f0f0 !important;
            }

            .value-cell {
                /* Widths are now handled by the rules below */
            }

            /* Set column widths as percentages */
            .header-info-table tr td:nth-of-type(1) { width: 15%; } /* Name/Date Label */
            .header-info-table tr td:nth-of-type(2) { width: 40%; } /* Name/Date Value */
            .header-info-table tr td:nth-of-type(3) { width: 15%; } /* Class/Score Label */
            .header-info-table tr td:nth-of-type(4) { width: 30%; } /* Class/Score Value */


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
