
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { ClassGroup } from '../types';
import { supabase } from '../services/supabaseClient';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    grade_level: string;
    enrolled_classes: string[];
    role: string;
}

export interface Grade {
    student_id: string;
    board_id: string;
    score: number;
}

export const useAdminData = (scope: 'my_classes' | 'global' = 'my_classes') => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Profile[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [engagementStats, setEngagementStats] = useState<Record<string, number>>({});
    const [storageStats, setStorageStats] = useState<Record<string, { bytes: number; items: number; boards: number }>>({});
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    
    // Online Users Set
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Pass scope to fetchStats
            const data = await adminService.fetchStats(scope);
            setClasses(data.classes);
            setStudents(data.students);
            setGrades(data.grades);
            setEngagementStats(data.engagementStats);
            setStorageStats(data.storageStats);
            setIsSuperAdmin(!!data.isSuperAdmin);
            setUserId(data.userId);
        } catch (e) {
            console.error("Error fetching admin data:", e);
        } finally {
            setLoading(false);
        }
    }, [scope]);

    useEffect(() => {
        fetchData();
        
        // Subscribe to global presence to know who is online
        const channel = supabase.channel('global-presence');
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const ids = new Set(Object.values(state).flat().map((u: any) => u.id));
                setOnlineUserIds(ids);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    // --- Actions ---

    const addClass = async (name: string, autoEnroll: boolean = true) => {
        if (!name.trim()) return;
        try {
            const newClass = await adminService.addClass(name, autoEnroll);
            if (newClass) {
                setClasses(prev => [...prev, newClass]);
            }
            return newClass;
        } catch (e) {
            console.error("Failed to add class", e);
        }
    };

    const deleteClass = async (id: string) => {
        try {
            // Optimistic update
            setClasses(prev => prev.filter(c => c.id !== id));
            await adminService.deleteClass(id);
        } catch (e) {
            console.error("Failed to delete class", e);
            fetchData(); // Revert on error
        }
    };

    const updateClass = async (id: string, name: string, autoEnroll: boolean = true) => {
        if (!name.trim()) return;
        try {
            setClasses(prev => prev.map(c => c.id === id ? { ...c, name: name.trim(), autoEnroll } : c));
            await adminService.updateClass(id, name, autoEnroll);
        } catch (e) {
            console.error("Failed to update class", e);
        }
    };

    const updateStudentClasses = async (id: string, newClasses: string[]) => {
        try {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, enrolled_classes: newClasses } : s));
            await adminService.updateProfile(id, { enrolled_classes: newClasses });
        } catch (e) {
            console.error("Failed to update student classes", e);
        }
    };

    const updateUserRole = async (id: string, newRole: string) => {
        try {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, role: newRole } : s));
            await adminService.updateProfile(id, { role: newRole });
        } catch (e) {
            console.error("Failed to update user role", e);
        }
    };

    const updateGradeScore = async (studentId: string, boardId: string, scoreStr: string) => {
        const score = parseInt(scoreStr);
        if (isNaN(score) && scoreStr !== '') return;
        const newScore = scoreStr === '' ? null : score;

        setGrades(prev => {
            const existing = prev.find(g => g.student_id === studentId && g.board_id === boardId);
            if (existing) {
                return prev.map(g => (g.student_id === studentId && g.board_id === boardId) ? { ...g, score: newScore || 0 } : g);
            }
            return [...prev, { student_id: studentId, board_id: boardId, score: newScore || 0 }];
        });

        try {
            await adminService.updateGrade(studentId, boardId, newScore);
        } catch (e) {
            console.error("Failed to update grade", e);
        }
    };

    return {
        loading,
        students,
        grades,
        classes,
        engagementStats,
        storageStats,
        isSuperAdmin,
        userId,
        onlineUserIds, 
        addClass,
        deleteClass,
        updateClass,
        updateStudentClasses,
        updateUserRole,
        updateGradeScore,
        refresh: fetchData
    };
};
