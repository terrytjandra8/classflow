
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { classService } from '../../../services/classService';
import { SUPER_ADMIN_EMAIL } from '../constants';

export type TabView = 'home' | 'gallery' | 'make' | 'admin' | 'system' | 'documentation';

export const useDashboardLogic = (onJoinByCode: (code: string) => Promise<boolean>) => {
    // Persist active tab
    const [activeTab, setActiveTabState] = useState<TabView>(() => {
        return (localStorage.getItem('cb_teacher_tab') as TabView) || 'home';
    });

    const setActiveTab = (tab: TabView) => {
        setActiveTabState(tab);
        localStorage.setItem('cb_teacher_tab', tab);
    };

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    
    // Join State
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    
    // User State
    const [userEmail, setUserEmail] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    
    // Class Filter State
    const [selectedClass, setSelectedClass] = useState<string>('All Classes');
    const [classList, setClassList] = useState<string[]>(['All Classes']);
    const [showClassMenu, setShowClassMenu] = useState(false);

    // Menu State
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Initial Data Fetch
    useEffect(() => {
        // 1. Get User Email
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email) {
                setUserEmail(user.email);
                // Case insensitive check
                if (user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase()) {
                    setIsSuperAdmin(true);
                }
            }
        });

        // 2. Fetch Classes
        const fetchClasses = async () => {
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
        };
        fetchClasses();
    }, [activeTab]);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Actions
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
        await supabase.auth.signOut();
    };

    return {
        activeTab,
        setActiveTab,
        showJoinModal,
        setShowJoinModal,
        showSetupModal,
        setShowSetupModal,
        joinCode,
        setJoinCode,
        joinError,
        isJoining,
        handleJoinSubmit,
        userEmail,
        isSuperAdmin,
        selectedClass,
        setSelectedClass,
        classList,
        showClassMenu,
        setShowClassMenu,
        showProfileMenu,
        setShowProfileMenu,
        profileMenuRef,
        handleLogout
    };
};
