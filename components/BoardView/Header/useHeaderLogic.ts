import { useState } from 'react';
import { useBoard } from '../BoardContext';
import { classService } from '../../../services/classService';

export const useHeaderLogic = () => {
    const context = useBoard();
    const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);

    const { 
        board, canManageBoard, isSimulatingStudent, toggleStudentSimulation, 
        goBack, openSettings, openShare, onlineUsers, updateBoard, classList, launchProjectorMode,
        isPresentationMode, typingUsers, userId
    } = context;

    const activeCount = onlineUsers?.length || 0;
    const userPreviews = onlineUsers?.slice(0, 10) || [];
    const isLive = board.isPublished;

    const formatDate = (ts?: number | string) => {
        if (!ts) return '';
        const date = typeof ts === 'string' ? new Date(ts) : new Date(ts * 1000);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    const handleCreateClass = async () => {
        const name = prompt("Enter the name for the new class group:");
        if (name && name.trim()) {
            const newClass = await classService.createClass(name.trim());
            if (newClass) {
                updateBoard({ targetGrade: newClass.name });
                setIsClassMenuOpen(false);
            } else {
                alert("Failed to create class. Please try again.");
            }
        }
    };

    return {
        ...context,
        isClassMenuOpen,
        setIsClassMenuOpen,
        activeCount,
        userPreviews,
        isLive,
        formatDate,
        handleCreateClass,
        isPresentationMode,
        typingUsers,
        userId
    };
};
