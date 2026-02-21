
import React, { useMemo, useState, useCallback } from 'react';
import { AssessmentQuestion, Note, AssessmentConfig, NoteColor } from '../../../../types';
import { supabase } from '../../../../services/supabaseClient';
import { AssessmentPrintView, PrintMode } from '../AssessmentPrintView';
import { mapNote } from '../../../../utils/mappers';

// Sub-components
import { SetupSection } from './SetupSection';
import { HeaderSection } from './HeaderSection';
import { BulkActionsSection } from './BulkActionsSection';
import { ParticipantsSection } from './ParticipantsSection';
import { GradingModal } from './gradingModal';
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
    
    const [submissions, setSubmissions] = useState<Note[]>(initialSubmissions);
    
    useMemo(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    const handleForceRefresh = useCallback(async () => {
        if (boardId) {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('board_id', boardId)
                .eq('type', 'assessment_submission');
            
            if (data && !error) {
                const mapped = data.map(mapNote);
                setSubmissions(mapped);
            } else {
                console.error("Error fetching submissions:", error);
            }
        }
    }, [boardId]);

    // Modal States
    const [retryModal, setRetryModal] = useState<{isOpen: boolean, participant: any}>({isOpen: false, participant: null});
    const [gradingModal, setGradingModal] = useState<{isOpen: boolean, participant: any}>({isOpen: false, participant: null});
    
    // Printing State
    const [printInfo, setPrintInfo] = useState<{targets: any[], mode: PrintMode} | null>(null);
    
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    // Assets
    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

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

        const rawParticipants = submissions.map(sub => {
            let data = sub.connections as any; 
            if (Array.isArray(data)) data = {};

            const isDQ = data?.disqualified === true;
            const score = isDQ ? 0 : (data?.score || 0);
            const hasLowWordCount = checkWordCounts(data?.answers || {});
            
            let status = 'In Progress';
            if (isDQ) status = 'Disqualified';
            else if (data?.released) status = 'Graded & Released';
            else if (data?.graded) status = 'Graded';
            else if (data?.submitted) status = 'Submitted';

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

        const uniqueParticipantsMap = new Map();
        rawParticipants.forEach(p => {
            const existing = uniqueParticipantsMap.get(p.id);
            if (!existing || p.submittedAt > existing.submittedAt) {
                uniqueParticipantsMap.set(p.id, p);
            }
        });
        
        const mappedSubmissions = Array.from(uniqueParticipantsMap.values());

        const submissionIds = new Set(mappedSubmissions.map((s: any) => s.id));
        const pendingStudents = activeStudents
            .filter(u => u.id && !submissionIds.has(u.id))
            .map(u => ({
                id: u.id,
                noteId: null,
                name: u.user || 'Unknown',
                role: u.role || 'student',
                status: 'Ready',
                progress: 0,
                data: {},
            }));

        const all = [...mappedSubmissions, ...pendingStudents];

        return {
            teachers: all.filter((p: any) => p.role === 'teacher'),
            students: all.filter((p: any) => p.role !== 'teacher').sort((a: any, b: any) => a.name.localeCompare(b.name))
        };
    }, [submissions, questions, activeStudents]); 

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

    const handleContinue = async (participant: any) => {
        if (!participant.noteId) return;
        const updatedData = { ...participant.data, submitted: false, disqualified: false, graded: false, released: false };
        await supabase.from('notes').update({ connections: updatedData, content: 'In Progress', color: 'bg-white' }).eq('id', participant.noteId);
        handleForceRefresh();
    };

    const handleAllowRevision = async (participant: any) => {
        if (!participant.noteId) return;
        const updatedData = { ...participant.data, submitted: false, graded: false, released: false, retryQuestions: [] };
        await supabase.from('notes').update({ connections: updatedData, content: 'Revising', color: 'bg-white' }).eq('id', participant.noteId);
        handleForceRefresh();
    };
    
    const handleBulkAllowRevision = async () => {
        if (selectedStudentIds.size === 0 || !confirm(`Allow revision for ${selectedStudentIds.size} selected students?`)) return;

        const targets = students.filter(s => selectedStudentIds.has(s.id));
        const noteIdsToUpdate = targets.map(p => p.noteId).filter(Boolean);

        const updates = noteIdsToUpdate.map(noteId => {
             const p = targets.find(t => t.noteId === noteId);
             const updatedData = { ...(p?.data || {}), submitted: false, graded: false, released: false, retryQuestions: [] };
             return supabase.from('notes').update({ connections: updatedData, content: 'Revising', color: 'bg-white' }).eq('id', noteId);
        });

        await Promise.all(updates);
        handleForceRefresh();
        setSelectedStudentIds(new Set());
    };

    const handleBulkReleaseGrades = async () => {
        if (selectedStudentIds.size === 0) return;
    
        const targets = students.filter(s => selectedStudentIds.has(s.id) && s.data?.graded && !s.data?.released);
    
        if (targets.length === 0) {
            alert("No selected students are ready for grade release (must be graded but not yet released).");
            return;
        }
    
        if (!confirm(`This will release grades to ${targets.length} selected students. They will be able to see their scores and feedback immediately. Proceed?`)) return;
    
        try {
            const noteUpdates = targets.map(p => {
                const updatedData = { ...(p.data || {}), released: true };
                const submissionContent = `Graded: ${p.score}`;
                return supabase.from('notes').update({
                    connections: updatedData,
                    content: submissionContent,
                    color: 'bg-green-200'
                }).eq('id', p.noteId);
            });
    
            const gradeUpserts = targets.map(p => {
                return supabase.from('grades').upsert({ 
                    student_id: p.id, 
                    board_id: boardId, 
                    score: p.score, 
                    feedback: 'See assessment details' 
                }, { onConflict: 'student_id, board_id' });
            });
    
            await Promise.all([...noteUpdates, ...gradeUpserts]);
    
            handleForceRefresh();
            setSelectedStudentIds(new Set());
            alert(`${targets.length} grades released successfully.`);
    
        } catch (error) {
            console.error("Failed to bulk release grades:", error);
            alert("An error occurred while releasing grades. Please try again.");
        }
    };

    const confirmReset = async () => {
        const { participant } = retryModal;
        if (!participant || !participant.noteId) return;

        const updatedData = { ...participant.data, answers: {}, violations: 0, score: 0, submitted: false, disqualified: false, graded: false, released: false, retryQuestions: [] };
        await supabase.from('notes').update({ connections: updatedData, content: 'Restarted', color: 'bg-white' }).eq('id', participant.noteId);
        
        handleForceRefresh();
        setRetryModal({ isOpen: false, participant: null });
    };

    const openGrading = (participant: any) => {
        if (!participant.noteId) {
            alert(`Student ${participant.name} has not started the assessment yet.`);
            return;
        }
        setGradingModal({ isOpen: true, participant });
    };

    const handleAutoSave = useCallback(async (grades: Record<string, { score: number, feedback: string }>, updatedAnswers?: Record<string, string>) => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return;

        const totalScore = Object.values(grades).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
        const updatedData = {
            ...participant.data,
            grading: grades,
            score: totalScore,
            graded: true,
            ...(updatedAnswers && { answers: updatedAnswers }),
        };

        const { error } = await supabase.from('notes').update({ connections: updatedData }).eq('id', participant.noteId);
        if (error) {
            console.error("Autosave error:", error);
            return;
        }
        
        setSubmissions(prev => prev.map(sub => sub.id === participant.noteId ? { ...sub, connections: updatedData } : sub));

    }, [gradingModal.participant]);

    const saveGrades = async (grades: Record<string, { score: number, feedback: string }>, release: boolean, retryIds?: string[]): Promise<boolean> => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return false;

        const totalScore = Object.values(grades).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
        const isRevision = retryIds && retryIds.length > 0;
        const updatedData = { 
            ...participant.data, 
            grading: grades, 
            score: totalScore, 
            graded: !isRevision,
            released: release && !isRevision,
            submitted: !isRevision,
            ...(isRevision && { retryQuestions: retryIds, submitted: false, graded: false, released: false }),
        };

        const submissionContent = isRevision ? 'Revising' : (release ? `Graded: ${totalScore}` : 'Submitted (Graded)');

        try {
            const { error: noteError } = await supabase.from('notes').update({
                connections: updatedData,
                content: submissionContent,
                color: release ? 'bg-green-200' : 'bg-white'
            }).eq('id', participant.noteId);

            if (noteError) throw noteError;

            if (boardId && participant.id && release && !isRevision) {
                 const { error: gradeError } = await supabase.from('grades').upsert({ 
                     student_id: participant.id, 
                     board_id: boardId, 
                     score: totalScore, 
                     feedback: 'See assessment details' 
                 }, { onConflict: 'student_id, board_id' });
                 if (gradeError) throw gradeError;
            }
            
            if (!release) {
                setGradingModal({ isOpen: false, participant: null });
            }

            handleForceRefresh(); 
            return true;

        } catch (error) {
            console.error("Failed to save grades:", error);
            alert(`An error occurred while saving grades for ${participant.name}. Please try again.`);
            return false;
        }
    };

    const handlePrint = (targets: any[], mode: PrintMode) => {
        setPrintInfo({ targets, mode });
    };

    const handlePrintMaster = (isKey: boolean) => {
        const mode: PrintMode = isKey ? 'ANSWER_KEY' : 'BLANK';
        const name = isKey ? 'Answer Key' : 'Question Paper';
        handlePrint([{ id: 'master-copy', name, data: { answers: {} } }], mode);
    };

    return (
        <div className="h-full bg-[#111] text-white p-6 overflow-hidden flex flex-col relative">
            
            {printInfo && (
                <AssessmentPrintView 
                    participants={printInfo.targets}
                    questions={questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={className}
                    printMode={printInfo.mode}
                    onAfterPrint={() => setPrintInfo(null)}
                />
            )}
            
            {config?.status === 'setup' && onUpdateConfig && (
                <SetupSection config={config} onUpdateConfig={onUpdateConfig} />
            )}

            <HeaderSection 
                activeStudentsCount={activeStudents.length} 
                submittedCount={students.filter(s => s.status.includes('Graded') || s.status.includes('Submitted')).length}
                onPrintMaster={handlePrintMaster}
                onForceRefresh={handleForceRefresh}
            />

            <BulkActionsSection 
                hasStudents={students.length > 0}
                selectedCount={selectedStudentIds.size}
                totalCount={students.length}
                onSelectAll={selectAll}
                onPrintSelected={() => handlePrint(students.filter(s => selectedStudentIds.has(s.id)), 'WITH_ANSWERS_AND_FEEDBACK')}
                onAllowRevisionSelected={handleBulkAllowRevision}
                onReleaseGradesSelected={handleBulkReleaseGrades}
            />

            <ParticipantsSection 
                teachers={teachers}
                students={students}
                selectedStudentIds={selectedStudentIds}
                onToggleSelect={toggleSelectStudent}
                onReset={initiateReset}
                onContinue={handleContinue}
                onAllowRevision={handleAllowRevision}
                onPrint={(participant, mode) => handlePrint([participant], mode)}
                onGrade={openGrading}
            />
            
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
                onSave={saveGrades}
                onAutoSave={handleAutoSave}
            />
        </div>
    );
};
