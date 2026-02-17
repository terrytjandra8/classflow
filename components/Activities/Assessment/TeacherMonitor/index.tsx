
import React, { useMemo, useState, useCallback } from 'react';
import { AssessmentQuestion, Note, AssessmentConfig, NoteColor } from '../../../../types';
import { supabase } from '../../../../services/supabaseClient';
import { AssessmentPrintView } from '../AssessmentPrintView';
import { mapNote } from '../../../../utils/mappers';

// Sub-components
import { SetupSection } from './SetupSection';
import { HeaderSection } from './HeaderSection';
import { BulkActionsSection } from './BulkActionsSection';
import { ParticipantsSection } from './ParticipantsSection';
import { GradingModal } from './GradingModal';
import { RetryModal } from './RetryModal';

interface TeacherMonitorProps {
    boardId: string;
    questions: AssessmentQuestion[];
    submissions: Note[];
    activeStudents: any[];
    config?: AssessmentConfig;
    onUpdateConfig?: (config: Partial<AssessmentConfig>) => void;
    className?: string;
    onForceRefresh?: () => void;
}

export const TeacherMonitor: React.FC<TeacherMonitorProps> = ({ 
    boardId, questions, submissions: initialSubmissions, activeStudents, config, onUpdateConfig, className 
}) => {
    
    // Local state for submissions to allow manual refresh and optimistic updates
    const [submissions, setSubmissions] = useState<Note[]>(initialSubmissions);
    
    // Sync with props when they change (realtime updates)
    useMemo(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    // Manual Refresh Handler
    const handleForceRefresh = async () => {
        if (boardId) {
            const { data } = await supabase
                .from('notes')
                .select('*')
                .eq('board_id', boardId)
                .eq('type', 'assessment_submission');
            
            if (data) {
                const mapped = data.map(mapNote);
                setSubmissions(mapped);
            }
        }
    };

    // Modal States
    const [retryModal, setRetryModal] = useState<{isOpen: boolean, participant: any}>({isOpen: false, participant: null});
    const [gradingModal, setGradingModal] = useState<{isOpen: boolean, participant: any}>({isOpen: false, participant: null});
    
    // Printing & Selection State
    const [printTargets, setPrintTargets] = useState<any[]>([]); 
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [printKeyMode, setPrintKeyMode] = useState(false); 
    const [printWithFeedback, setPrintWithFeedback] = useState(true);

    // Assets
    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    // Local grading state
    const [currentGrades, setCurrentGrades] = useState<Record<string, {score: number, feedback: string}>>({});

    // Process Data (Memoized)
    const { teachers, students } = useMemo(() => {
        const checkWordCounts = (answers: Record<string, string>) => {
            return questions.some(q => {
                if(q.type !== 'essay' || !q.minWords) return false;
                const text = answers[q.id] || "";
                const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                return count < q.minWords;
            });
        };

        // 1. Map raw notes to participant objects
        const rawParticipants = submissions.map(sub => {
            let data = sub.connections as any; 
            if (Array.isArray(data)) {
                data = {}; 
            }

            const isDQ = data?.disqualified === true;
            const score = isDQ ? 0 : (data?.score || 0);
            const hasLowWordCount = checkWordCounts(data?.answers || {});
            
            // Prioritize status: DQ > Graded > Submitted > In Progress
            let status = 'In Progress';
            if (isDQ) status = 'Disqualified';
            else if (data?.graded || data?.released) status = 'Graded';
            else if (data?.submitted) status = 'Submitted';

            // Calculate progress: count non-empty answers
            const answers = data?.answers || {};
            const answeredCount = Object.values(answers).filter((val: any) => val && typeof val === 'string' && val.trim().length > 0).length;
            const totalQuestions = questions.filter(q => q.type !== 'section').length || 1;

            return {
                id: sub.author_id || sub.author,
                noteId: sub.id, 
                name: sub.author,
                role: sub.authorRole || 'student',
                violations: data?.violations || 0,
                score: score,
                status: status,
                progress: answeredCount / totalQuestions,
                disqualified: isDQ,
                hasLowWordCount: hasLowWordCount && !isDQ && data?.submitted,
                data: data,
                submittedAt: sub.createdAt 
            };
        });

        // 2. Deduplicate: Ensure unique student ID, prioritizing the most recent/relevant submission
        const uniqueParticipantsMap = new Map();
        rawParticipants.forEach(p => {
            const existing = uniqueParticipantsMap.get(p.id);
            if (!existing) {
                uniqueParticipantsMap.set(p.id, p);
            } else {
                // Conflict resolution: prefer newer submission
                if (p.submittedAt > existing.submittedAt) {
                    uniqueParticipantsMap.set(p.id, p);
                }
            }
        });
        
        const mappedSubmissions = Array.from(uniqueParticipantsMap.values());

        // 3. Merge with Active Students (Pending)
        const submissionIds = new Set(mappedSubmissions.map((s: any) => s.id));
        const pendingStudents = activeStudents
            .filter(u => {
                const uid = u.id; 
                return uid && !submissionIds.has(uid);
            })
            .map(u => ({
                id: u.id,
                noteId: null,
                name: u.user || 'Unknown',
                role: u.role || 'student',
                violations: 0,
                score: 0,
                status: 'Ready',
                progress: 0,
                disqualified: false,
                hasLowWordCount: false,
                data: {},
                submittedAt: Date.now()
            }));

        const all = [...mappedSubmissions, ...pendingStudents];

        return {
            teachers: all.filter((p: any) => p.role === 'teacher'),
            students: all.filter((p: any) => p.role !== 'teacher').sort((a: any, b: any) => a.name.localeCompare(b.name))
        };
    }, [submissions, questions, activeStudents]); 

    // --- Handlers ---

    const toggleSelectStudent = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudentIds(newSet);
    };

    const selectAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set()); 
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    const initiateReset = (participant: any) => {
        if (!participant.noteId) return;
        setRetryModal({ isOpen: true, participant });
    };

    // 1. UNLOCK / CONTINUE (Non-destructive) - For DQ
    const handleContinue = async (participant: any) => {
        if (!participant.noteId) return;

        // Just remove the flags, keep answers
        const updatedData = {
            ...participant.data,
            submitted: false,
            disqualified: false,
            graded: false,
            released: false
        };

        // Optimistic Update
        setSubmissions(prev => prev.map(sub => {
            if (sub.id === participant.noteId) {
                return {
                    ...sub,
                    connections: updatedData,
                    content: 'In Progress',
                    color: NoteColor.WHITE
                };
            }
            return sub;
        }));

        await supabase
            .from('notes')
            .update({ 
                connections: updatedData,
                content: 'In Progress',
                color: 'bg-white'
            })
            .eq('id', participant.noteId);

        // Ensure refresh after async (to confirm)
        setTimeout(handleForceRefresh, 500);
    };

    // 2. ALLOW REVISION (Unlock for editing, keep answers)
    const handleAllowRevision = async (participant: any) => {
        if (!participant.noteId) return;

        // Keep answers, but mark as not submitted so they can edit
        const updatedData = {
            ...participant.data,
            submitted: false,
            graded: false,
            released: false,
            retryQuestions: [] 
        };

        // Optimistic Update
        setSubmissions(prev => prev.map(sub => {
            if (sub.id === participant.noteId) {
                return {
                    ...sub,
                    connections: updatedData,
                    content: 'Revising',
                    color: NoteColor.WHITE
                };
            }
            return sub;
        }));

        await supabase
            .from('notes')
            .update({ 
                connections: updatedData,
                content: 'Revising',
                color: 'bg-white'
            })
            .eq('id', participant.noteId);

        setTimeout(handleForceRefresh, 500);
    };
    
    // 2.5 BULK ALLOW REVISION
    const handleBulkAllowRevision = async () => {
        if (selectedStudentIds.size === 0) return;
        if (!confirm(`Allow revision for ${selectedStudentIds.size} selected students?`)) return;

        const targets = students.filter(s => selectedStudentIds.has(s.id));
        
        // Optimistic Update
        setSubmissions(prev => prev.map(sub => {
            const pId = sub.author_id || sub.author;
            if (selectedStudentIds.has(pId)) {
                 const oldData = sub.connections as any || {};
                 const updatedData = {
                    ...oldData,
                    submitted: false,
                    graded: false,
                    released: false,
                    retryQuestions: [] 
                };
                return {
                    ...sub,
                    connections: updatedData,
                    content: 'Revising',
                    color: NoteColor.WHITE
                };
            }
            return sub;
        }));

        // DB Updates (Parallel)
        const updates = targets.map(p => {
             if(!p.noteId) return Promise.resolve();
             const updatedData = {
                ...p.data,
                submitted: false,
                graded: false,
                released: false,
                retryQuestions: [] 
            };
            return supabase.from('notes').update({
                connections: updatedData,
                content: 'Revising',
                color: 'bg-white'
            }).eq('id', p.noteId);
        });

        await Promise.all(updates);
        
        setTimeout(handleForceRefresh, 500);
        setSelectedStudentIds(new Set());
    };

    // 3. HARD RESET (Destructive - Wipes answers)
    const confirmReset = async () => {
        const { participant } = retryModal;
        if (!participant || !participant.noteId) return;

        // Wipe data completely to start fresh
        const updatedData = {
            ...participant.data,
            answers: {},
            violations: 0,
            score: 0,
            submitted: false,
            disqualified: false,
            graded: false,
            released: false,
            retryQuestions: []
        };

        // Optimistic Update
        setSubmissions(prev => prev.map(sub => {
            if (sub.id === participant.noteId) {
                return {
                    ...sub,
                    connections: updatedData,
                    content: 'Restarted',
                    color: NoteColor.WHITE
                };
            }
            return sub;
        }));

        const { error } = await supabase
            .from('notes')
            .update({ 
                connections: updatedData,
                content: 'Restarted',
                color: 'bg-white'
            })
            .eq('id', participant.noteId);

        if (error) alert("Failed to reset status.");
        
        // Ensure refresh after async
        setTimeout(handleForceRefresh, 500);
        setRetryModal({ isOpen: false, participant: null });
    };

    const openGrading = (participant: any) => {
        if (!participant.noteId) {
            alert(`Student ${participant.name} has not started the assessment yet.`);
            return;
        }
        
        const data = participant.data || {};
        const existingGrades = data.grading || {};
        const answers = data.answers || {};
        
        const initGrades: Record<string, {score: number, feedback: string}> = {};
        
        questions.forEach(q => {
            if (q.type === 'section') return;
            if (existingGrades[q.id]) {
                initGrades[q.id] = existingGrades[q.id];
            } else {
                let score = 0;
                if (q.type === 'mcq' && answers[q.id] === q.correctAnswer) {
                    score = q.points;
                }
                initGrades[q.id] = { score, feedback: '' };
            }
        });

        setCurrentGrades(initGrades);
        setGradingModal({ isOpen: true, participant: { ...participant, data } });
    };

    // Auto-save logic (Background update)
    const handleAutoSave = useCallback(async (
        grades: Record<string, { score: number, feedback: string }>, 
        updatedAnswers?: Record<string, string>, 
        retryQuestions?: string[],
        teacherOverrides?: Record<string, boolean> // New parameter
    ) => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return;

        const totalScore = Object.values(grades).reduce((acc: number, curr: {score: number}) => acc + (curr.score || 0), 0);
        
        // Preserve existing status logic, just update grading content
        const updatedData = {
            ...participant.data,
            grading: grades,
            score: totalScore,
            // We set graded to true to indicate teacher has touched it, but keep 'released' as is
            graded: true, 
            submitted: true,
            // Apply answer overrides if any (e.g. from manual upload)
            ...(updatedAnswers ? { answers: updatedAnswers } : {}),
            // Apply retry config
            ...(retryQuestions ? { retryQuestions } : {}),
            // Apply teacher override flags
            ...(teacherOverrides ? { teacherOverrides } : {})
        };

        // Persist to Notes
        const { error } = await supabase.from('notes').update({ 
            connections: updatedData
        }).eq('id', participant.noteId);

        if (error) {
            console.error("Auto-save failed", error);
            throw error; // Re-throw to let Modal know it failed
        }
        
        // Update local submissions state silently to keep sync
        setSubmissions(prev => prev.map(sub => {
             if (sub.id === participant.noteId) {
                 return { ...sub, connections: updatedData };
             }
             return sub;
        }));
    }, [gradingModal]);

    const saveGrades = async (release: boolean) => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return;

        const totalScore = Object.values(currentGrades).reduce((acc: number, curr: {score: number}) => acc + (curr.score || 0), 0);

        const updatedData = {
            ...participant.data,
            grading: currentGrades,
            score: totalScore,
            graded: true,
            released: release,
            submitted: true 
        };

        // --- OPTIMISTIC UPDATE: Update local state immediately ---
        setSubmissions(prev => prev.map(sub => {
            if (sub.id === participant.noteId) {
                return {
                    ...sub,
                    connections: updatedData,
                    content: release ? `Graded: ${totalScore}` : 'Submitted (Grading)',
                    color: release ? NoteColor.GREEN : NoteColor.WHITE
                };
            }
            return sub;
        }));

        setGradingModal({ isOpen: false, participant: null });

        // Persist to Notes
        await supabase.from('notes').update({ 
            connections: updatedData,
            content: release ? `Graded: ${totalScore}` : 'Submitted (Grading)',
            color: release ? 'bg-green-200' : 'bg-white'
        }).eq('id', participant.noteId);

        // --- NEW: Persist to Grades Table for RLS ---
        if (boardId && participant.id) {
             await supabase.from('grades').upsert({
                student_id: participant.id,
                board_id: boardId,
                score: totalScore,
                feedback: release ? 'See assessment details' : null
            }, { onConflict: 'student_id, board_id' });
        }

        // Fetch authoritative state after delay to ensure sync
        setTimeout(handleForceRefresh, 500);
    };

    const handleSinglePrint = (participant: any, withFeedback: boolean = true) => {
        setPrintKeyMode(false); 
        setPrintWithFeedback(withFeedback);
        setPrintTargets([participant]);
    };

    const handleBulkPrint = () => {
        const targets = students.filter(s => selectedStudentIds.has(s.id));
        if (targets.length === 0) return;
        setPrintKeyMode(false);
        setPrintWithFeedback(true); // Default to true for bulk unless option added there
        setPrintTargets(targets);
    };

    const handlePrintMaster = (withKey: boolean) => {
        setPrintKeyMode(withKey);
        setPrintWithFeedback(false); // No feedback on master key
        setPrintTargets([{ id: 'master-copy', name: "", data: { answers: {} } }]);
    };

    return (
        <div className="h-full bg-[#111] text-white p-6 overflow-hidden flex flex-col relative">
            
            {/* PRINT PORTAL */}
            {printTargets.length > 0 && (
                <AssessmentPrintView 
                    participants={printTargets}
                    questions={questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={className}
                    onAfterPrint={() => {
                        setPrintTargets([]);
                        setPrintKeyMode(false);
                    }}
                    showAnswerKey={printKeyMode}
                    includeFeedback={printWithFeedback}
                />
            )}

            {/* SECTIONS */}
            
            {config?.status === 'setup' && onUpdateConfig && (
                <SetupSection config={config} onUpdateConfig={onUpdateConfig} />
            )}

            <HeaderSection 
                activeStudentsCount={activeStudents.length} 
                submittedCount={students.filter(s => s.status === 'Submitted' || s.status === 'Graded').length}
                onPrintMaster={handlePrintMaster}
                onForceRefresh={handleForceRefresh}
            />

            <BulkActionsSection 
                hasStudents={students.length > 0}
                selectedCount={selectedStudentIds.size}
                totalCount={students.length}
                onSelectAll={selectAll}
                onPrintSelected={handleBulkPrint}
                onAllowRevisionSelected={handleBulkAllowRevision}
            />

            <ParticipantsSection 
                teachers={teachers}
                students={students}
                selectedStudentIds={selectedStudentIds}
                onToggleSelect={toggleSelectStudent}
                onReset={initiateReset}
                onContinue={handleContinue}
                onAllowRevision={handleAllowRevision}
                onPrint={handleSinglePrint}
                onGrade={openGrading}
            />

            {/* MODALS */}
            
            <RetryModal 
                isOpen={retryModal.isOpen} 
                participant={retryModal.participant} 
                onClose={() => setRetryModal({ isOpen: false, participant: null })}
                onConfirm={confirmReset}
            />

            <GradingModal 
                isOpen={gradingModal.isOpen}
                participant={gradingModal.participant}
                onClose={() => setGradingModal({ isOpen: false, participant: null })}
                questions={questions}
                currentGrades={currentGrades}
                setCurrentGrades={setCurrentGrades}
                onSave={saveGrades}
                onAutoSave={handleAutoSave}
                onPrint={(withFeedback, gradesSnapshot) => {
                    const currentTotal = Object.values(gradesSnapshot).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
                    const updatedParticipant = {
                        ...gradingModal.participant,
                        score: currentTotal, 
                        data: {
                            ...gradingModal.participant.data,
                            score: currentTotal,
                            grading: gradesSnapshot 
                        }
                    };
                    setGradingModal({isOpen: false, participant: null});
                    handleSinglePrint(updatedParticipant, withFeedback);
                }}
            />
        </div>
    );
};
