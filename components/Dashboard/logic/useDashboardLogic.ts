
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { classService } from '../../../services/classService';
import { SUPER_ADMIN_EMAIL } from '../constants';

export type TabView = 'home' | 'gallery' | 'make' | 'admin' | 'system' | 'documentation';

export const useDashboardLogic = (onJoinByCode: (code: string) => Promise<boolean>) => {
    const [userEmail, setUserEmail] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isStudent, setIsStudent] = useState(false);

    const [activeTab, setActiveTabState] = useState<TabView>(() => {
        const key = isStudent ? 'cb_student_tab' : 'cb_teacher_tab';
        return (localStorage.getItem(key) as TabView) || (isStudent ? 'home' : 'recents');
    });

    const setActiveTab = (tab: TabView) => {
        const key = isStudent ? 'cb_student_tab' : 'cb_teacher_tab';
        setActiveTabState(tab);
        localStorage.setItem(key, tab);
    };

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    
    const [selectedClass, setSelectedClass] = useState<string>('All Classes');
    const [classList, setClassList] = useState<string[]>(['All Classes']);
    const [showClassMenu, setShowClassMenu] = useState(false);

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUserAndClasses = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) {
                    setUserEmail(user.email);
                    if (user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase()) {
                        setIsSuperAdmin(true);
                    }
                }
                const studentStatus = user.user_metadata.is_student ?? false;
                setIsStudent(studentStatus);

                // Set initial tab based on role
                const key = studentStatus ? 'cb_student_tab' : 'cb_teacher_tab';
                const storedTab = localStorage.getItem(key) as TabView;
                setActiveTabState(storedTab || (studentStatus ? 'home' : 'home'));

                if (!studentStatus) {
                    try {
                        const data = await classService.getClasses();
                        if (data && data.length > 0) {
                            const names = data.map(c => c.name);
                            const uniqueNames = Array.from(new Set(names));
                            setClassList(['All Classes', ...uniqueNames]);
                        } else {
                            setClassList(['All Classes']);
                        }
                    } catch (e) {
                        console.error("Failed to load classes", e);
                    }
                }
            }
        };

        fetchUserAndClasses();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError('');
        setIsJoining(true);
        const code = joinCode.trim().toUpperCase();
        
        try {
            const success = await onJoinByCode(code);
            if (success) {
                setShowJoinModal(false);
                setJoinCode('');
            } else {
                setJoinError('Invalid Join Code. Please check and try again.');
            }
        } catch (err) {
            setJoinError('An error occurred. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('cb_teacher_tab');
        localStorage.removeItem('cb_student_tab');
        await supabase.auth.signOut();
    };

    return {
        activeTab, setActiveTab, showJoinModal, setShowJoinModal,
        showSetupModal, setShowSetupModal, joinCode, setJoinCode, joinError,
        isJoining, handleJoinSubmit, userEmail, isSuperAdmin, isStudent, 
        selectedClass, setSelectedClass, classList,
        showClassMenu, setShowClassMenu, showProfileMenu, setShowProfileMenu,
        profileMenuRef, handleLogout
    };
};