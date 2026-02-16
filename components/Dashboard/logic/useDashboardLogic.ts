import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { classService } from '../../../services/classService';
import { SUPER_ADMIN_EMAIL } from '../constants';

export type TabView = 'home' | 'gallery' | 'make' | 'admin' | 'system' | 'documentation';

export const useDashboardLogic = (onJoinByCode: (code: string) => Promise<boolean>, userId: string | undefined) => {
    const [userEmail, setUserEmail] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isStudent, setIsStudent] = useState(false);

    const [activeTab, setActiveTabState] = useState<TabView>('home');

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    
    const [selectedClass, setSelectedClassState] = useState<string>('');
    const [classList, setClassList] = useState<string[]>([]);

    const [showClassMenu, setShowClassMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const setActiveTab = (tab: TabView) => {
        const key = isStudent ? 'cb_student_tab' : 'cb_teacher_tab';
        setActiveTabState(tab);
        localStorage.setItem(key, tab);
    };

    const setSelectedClass = (className: string) => {
        setSelectedClassState(className);
        const key = isStudent ? 'cb_student_selected_class' : 'cb_teacher_selected_class';
        localStorage.setItem(key, className);
    };

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
                const studentStatus = user.user_metadata.isStudent ?? false;
                setIsStudent(studentStatus);

                const tabKey = studentStatus ? 'cb_student_tab' : 'cb_teacher_tab';
                const storedTab = localStorage.getItem(tabKey) as TabView;
                setActiveTabState(storedTab || (studentStatus ? 'home' : 'home'));
                
                const classKey = studentStatus ? 'cb_student_selected_class' : 'cb_teacher_selected_class';
                const storedClass = localStorage.getItem(classKey);

                if (studentStatus) {
                    try {
                        const fetchedClasses = await classService.getStudentClasses(userId || '');
                        const newClassList = ['All My Classes', ...fetchedClasses];
                        setClassList(newClassList);
                        if (storedClass && newClassList.includes(storedClass)) {
                            setSelectedClassState(storedClass);
                        } else {
                            setSelectedClassState('All My Classes');
                        }
                    } catch (e) {
                        console.error("Failed to load student classes", e);
                        setClassList(['All My Classes']);
                        setSelectedClassState('All My Classes');
                    }
                } else { // Teacher or Super Admin
                    try {
                        const data = await classService.getClasses();
                        const names = data && data.length > 0 ? data.map(c => c.name) : [];
                        const uniqueNames = Array.from(new Set(names));
                        const fullClassList = ['All Classes', ...uniqueNames];
                        setClassList(fullClassList);

                        if (storedClass && fullClassList.includes(storedClass)) {
                             setSelectedClassState(storedClass);
                        } else {
                             setSelectedClassState('All Classes');
                        }
                    } catch (e) {
                        console.error("Failed to load classes", e);
                        setClassList(['All Classes']);
                        setSelectedClassState('All Classes');
                    }
                }
            }
        };

        fetchUserAndClasses();
    }, [userId]);

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
                window.location.reload(); // Reload to refetch classes
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
        localStorage.removeItem('cb_teacher_selected_class');
        localStorage.removeItem('cb_student_selected_class');
        await supabase.auth.signOut();
        window.location.href = '/';
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