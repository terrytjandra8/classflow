
import React from 'react';
import { ColumnAnalyticsData } from '../../types';

interface ColumnAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: ColumnAnalyticsData | null;
    columnTitle: string;
    onRegenerate: () => void;
    isRegenerating: boolean;
    isLoading?: boolean;
}

// Feature Disabled
export const ColumnAnalysisModal: React.FC<ColumnAnalysisModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return null;
};
