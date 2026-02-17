import React, { useMemo, useState, useCallback } from 'react';
import { AssessmentQuestion, Note, AssessmentConfig, Board, UserRole, ParticipantStatus, Participant } from '../../../../types';
import { supabase } from '../../../../services/supabaseClient';
import { AssessmentPrintView } from '../AssessmentPrintView';
import { mapNote } from '../../../../utils/mappers';
import { SetupSection } from './SetupSection';
import { HeaderSection } from './HeaderSection';
import { BulkActionsSection } from './BulkActionsSection';
import { ParticipantsSection } from './ParticipantsSection';
import { GradingModal } from './GradingModal';
import { RetryModal } from './RetryModal';

// Define a local, specific participant type for this monitor view to avoid global type conflicts.
interface MonitorParticipant extends Participant {
    noteId: string | null;
    hasLowWordCount: boolean;
    data: any;
    lastActivity: string;
    status: ParticipantStatus;
}

interface ActiveStudent {
    id: string;
    user?: string;
    role?: UserRole;
}

interface TeacherMonitorProps {
    board: Board;
    questions: AssessmentQuestion[];
    submissions: Note[];
    activeStudents: ActiveStudent[];
    config?: AssessmentConfig;
    onUpdateConfig?: (config: Partial<AssessmentConfig>) => void;
    className?: string;
    onForceRefresh?: () => void;
}

export const TeacherMonitor: React.FC<TeacherMonitorProps> = ({ 
    board, questions, submissions: initialSubmissions, activeStudents, config, onUpdateConfig, className 
}) => {
    const [submissions, setSubmissions] = useState<Note[]>(initialSubmissions);
    
    useMemo(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    const handleForceRefresh = async () => {
        if (board.id) {
            const { data } = await supabase
                .from('notes')
                .select('*')
                .eq('board_id', board.id)
                .eq('type', 'assessment_submission');
            
            if (data) {
                const mapped = data.map(n => mapNote(n as any));
                setSubmissions(mapped);
            }
        }
    };

    const [retryModal, setRetryModal] = useState<{isOpen: boolean, participant: MonitorParticipant | null}>({isOpen: false, participant: null});
    const [gradingModal, setGradingModal] = useState<{isOpen: boolean, participant: MonitorParticipant | null}>({isOpen: false, participant: null});
    
    const [printTargets, setPrintTargets] = useState<MonitorParticipant[]>([]); 
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [printKeyMode, setPrintKeyMode] = useState(false); 
    const [printWithFeedback, setPrintWithFeedback] = useState(true);

    const ipekaLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/ipeka.png').data.publicUrl;
    const ibLogoUrl = supabase.storage.from('uploads').getPublicUrl('Logo/IB.png').data.publicUrl;

    const [currentGrades, setCurrentGrades] = useState<Record<string, {score: number, feedback: string}>>({});

    const { teachers, students } = useMemo(() => {
        const checkWordCounts = (answers: Record<string, string>) => {
            return questions.some(q => {
                if(q.type !== 'essay' || !q.minWords) return false;
                const text = answers[q.id] || "";
                const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                return count < q.minWords;
            });
        };

        const rawParticipants: MonitorParticipant[] = submissions.map(sub => {
            let data = sub.connections as any;
            if (Array.isArray(data)) data = {};

            const isDQ = data?.disqualified === true;
            const score = isDQ ? 0 : (data?.score || 0);
            const hasLowWordCount = checkWordCounts(data?.answers || {});
            
            let status: ParticipantStatus = 'In Progress';
            if (isDQ) status = 'Disqualified';
            else if (data?.graded || data?.released) status = 'Graded';
            else if (data?.submitted) status = 'Submitted';

            const answers = data?.answers || {};
            const answeredCount = Object.values(answers).filter((val: unknown) => val && typeof val === 'string' && val.trim().length > 0).length;
            const totalQuestions = questions.filter(q => q.type !== 'section').length || 1;

            return {
                id: sub.authorId as string,
                noteId: sub.id, 
                name: sub.authorName as string,
                role: sub.authorRole || 'student',
                violations: data?.violations || [],
                score: score,
                status: status,
                progress: answeredCount / totalQuestions,
                disqualified: isDQ,
                hasLowWordCount: hasLowWordCount && !isDQ && data?.submitted,
                data: data,
                submittedAt: new Date(sub.createdAt).toISOString(), 
                lastActivity: new Date(sub.updatedAt || sub.createdAt).getTime().toString()
            };
        });

        const uniqueParticipantsMap = new Map<string, MonitorParticipant>();
        rawParticipants.forEach(p => {
            const existing = uniqueParticipantsMap.get(p.id);
            if (!existing || new Date(p.submittedAt) > new Date(existing.submittedAt)) {
                uniqueParticipantsMap.set(p.id, p);
            }
        });
        
        const mappedSubmissions = Array.from(uniqueParticipantsMap.values());

        const submissionIds = new Set(mappedSubmissions.map((s) => s.id));
        const pendingStudents: MonitorParticipant[] = activeStudents
            .filter(u => u.id && !submissionIds.has(u.id))
            .map(u => ({
                id: u.id,
                noteId: null,
                name: u.user || 'Unknown',
                role: u.role || 'student',
                violations: [],
                score: 0,
                status: 'Ready',
                progress: 0,
                disqualified: false,
                hasLowWordCount: false,
                data: {},
                submittedAt: new Date().toISOString(),
                lastActivity: Date.now().toString()
            }));

        const all: MonitorParticipant[] = [...mappedSubmissions, ...pendingStudents];

        return {
            teachers: all.filter((p) => p.role === 'teacher'),
            students: all.filter((p) => p.role !== 'teacher').sort((a, b) => (a.name || '').localeCompare(b.name || ''))
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

    const initiateReset = (participant: MonitorParticipant) => {
        if (!participant.noteId) return;
        setRetryModal({ isOpen: true, participant });
    };

    const handleContinue = async (participant: MonitorParticipant) => {
        if (!participant.noteId) return;

        const updatedData = {
            ...participant.data,
            submitted: false,
            disqualified: false,
            graded: false,
            released: false
        };

        setSubmissions(prev => prev.map(sub => 
            sub.id === participant.noteId ? { ...sub, connections: updatedData, content: 'In Progress', color: 'gray' } : sub
        ));

        await supabase.from('notes').update({ 
            connections: updatedData, content: 'In Progress', color: 'bg-white'
        }).eq('id', participant.noteId);

        setTimeout(handleForceRefresh, 500);
    };

    const handleAllowRevision = async (participant: MonitorParticipant) => {
        if (!participant.noteId) return;

        const updatedData = {
            ...participant.data,
            submitted: false,
            graded: false,
            released: false,
            retryQuestions: [] 
        };

        setSubmissions(prev => prev.map(sub => 
            sub.id === participant.noteId ? { ...sub, connections: updatedData, content: 'Revising', color: 'gray' } : sub
        ));

        await supabase.from('notes').update({ 
            connections: updatedData, content: 'Revising', color: 'bg-white'
        }).eq('id', participant.noteId);

        setTimeout(handleForceRefresh, 500);
    };    
    
    const handleBulkAllowRevision = async () => {
        if (selectedStudentIds.size === 0) return;
        if (!confirm(`Allow revision for ${selectedStudentIds.size} selected students?`)) return;

        setSubmissions(prev => prev.map(sub => {
            const pId = sub.authorId;
            if (pId && selectedStudentIds.has(pId)) {
                 const oldData = sub.connections as any || {};
                 const updatedData = {
                    ...oldData,
                    submitted: false, graded: false, released: false, retryQuestions: [] 
                };
                return { ...sub, connections: updatedData, content: 'Revising', color: 'gray' };
            }
            return sub;
        }));

        const updates = students
            .filter(s => selectedStudentIds.has(s.id) && s.noteId)
            .map(p => {
                 const updatedData = {
                    ...p.data, submitted: false, graded: false, released: false, retryQuestions: [] 
                };
                return supabase.from('notes').update({
                    connections: updatedData, content: 'Revising', color: 'bg-white'
                }).eq('id', p.noteId as string);
            });

        await Promise.all(updates);
        
        setTimeout(handleForceRefresh, 500);
        setSelectedStudentIds(new Set());
    };

    const confirmReset = async () => {
        const { participant } = retryModal;
        if (!participant || !participant.noteId) return;

        const updatedData = {
            ...participant.data,
            answers: {}, violations: [], score: 0,
            submitted: false, disqualified: false, graded: false, released: false, retryQuestions: []
        };

        setSubmissions(prev => prev.map(sub => 
            sub.id === participant.noteId ? { ...sub, connections: updatedData, content: 'Restarted', color: 'gray' } : sub
        ));

        const { error } = await supabase.from('notes').update({ 
            connections: updatedData, content: 'Restarted', color: 'bg-white'
        }).eq('id', participant.noteId);

        if (error) alert("Failed to reset status.");
        
        setTimeout(handleForceRefresh, 500);
        setRetryModal({ isOpen: false, participant: null });
    };

    const openGrading = (participant: MonitorParticipant) => {
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

            const mcqAnswer = q.answer;

            if (existingGrades[q.id]) {
                initGrades[q.id] = existingGrades[q.id];
            } else {
                let score = 0;
                if (mcqAnswer !== undefined && answers[q.id] === mcqAnswer) {
                    score = q.points || 0;
                }
                initGrades[q.id] = { score, feedback: '' };
            }
        });

        setCurrentGrades(initGrades);
        setGradingModal({ isOpen: true, participant: { ...participant, data } });
    };

    const handleAutoSave = useCallback(async (
        grades: Record<string, { score: number, feedback: string }>, 
        updatedAnswers?: Record<string, string>, 
        retryQuestions?: string[],
        teacherOverrides?: Record<string, boolean>
    ) => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return;

        const totalScore = Object.values(grades).reduce((acc, curr) => acc + (curr.score || 0), 0);
        
        const updatedData = {
            ...participant.data,
            grading: grades,
            score: totalScore,
            graded: true, 
            submitted: true,
            ...(updatedAnswers && { answers: updatedAnswers }),
            ...(retryQuestions && { retryQuestions: retryQuestions }),
            ...(teacherOverrides && { teacherOverrides: teacherOverrides })
        };

        const { error } = await supabase.from('notes').update({ 
            connections: updatedData
        }).eq('id', participant.noteId);

        if (error) {
            console.error("Auto-save failed", error);
            throw error;
        }
        
        setSubmissions(prev => prev.map(sub => 
             sub.id === participant.noteId ? { ...sub, connections: updatedData } : sub
        ));
    }, [gradingModal]);

    const saveGrades = async (release: boolean) => {
        const { participant } = gradingModal;
        if (!participant || !participant.noteId) return;

        const totalScore = Object.values(currentGrades).reduce((acc, curr) => acc + (curr.score || 0), 0);

        const updatedData = {
            ...participant.data,
            grading: currentGrades,
            score: totalScore,
            graded: true,
            released: release,
            submitted: true 
        };

        setSubmissions(prev => prev.map(sub => 
            sub.id === participant.noteId ? { ...sub, connections: updatedData, content: release ? `Graded: ${totalScore}` : 'Submitted (Grading)', color: release ? 'green' : 'gray' } : sub
        ));

        setGradingModal({ isOpen: false, participant: null });

        await supabase.from('notes').update({ 
            connections: updatedData,
            content: release ? `Graded: ${totalScore}` : 'Submitted (Grading)',
            color: release ? 'green' : 'gray'
        }).eq('id', participant.noteId);

        if (board.id && participant.id) {
             await supabase.from('grades').upsert({
                student_id: participant.id,
                board_id: board.id,
                score: totalScore,
                feedback: release ? 'See assessment details' : undefined
            }, { onConflict: 'student_id, board_id' });
        }

        setTimeout(handleForceRefresh, 500);
    };

    const handleSinglePrint = (participant: MonitorParticipant, withFeedback: boolean = true) => {
        setPrintKeyMode(false); 
        setPrintWithFeedback(withFeedback);
        setPrintTargets([participant]);
    };

    const handleBulkPrint = () => {
        const targets = students.filter(s => selectedStudentIds.has(s.id));
        if (targets.length === 0) return;
        setPrintKeyMode(false);
        setPrintWithFeedback(true);
        setPrintTargets(targets);
    };

    const handlePrintMaster = (withKey: boolean) => {
        setPrintKeyMode(withKey);
        setPrintWithFeedback(false);
        setPrintTargets([{ id: 'master-copy', name: "", role: 'teacher', disqualified: false, status: 'Graded', violations: 0, hasLowWordCount: false, progress: 1, score: 100, noteId: "master-copy-note-id", submittedAt: new Date().toISOString(), data: { answers: {} }, lastActivity: Date.now().toString() }]);
    };

    return (
        <div className="h-full bg-[#111] text-white p-6 overflow-hidden flex flex-col relative">
            
            {printTargets.length > 0 && (
                <AssessmentPrintView 
                    participants={printTargets as Participant[]}
                    questions={questions}
                    ipekaLogoUrl={ipekaLogoUrl}
                    ibLogoUrl={ibLogoUrl}
                    className={className}
                    onAfterPrint={() => { setPrintTargets([]); setPrintKeyMode(false); }}
                    showAnswerKey={printKeyMode}
                    includeFeedback={printWithFeedback}
                />
            )}

            {config?.status === 'setup' && onUpdateConfig && (
                <SetupSection config={config} onUpdateConfig={onUpdateConfig} />
            )}

            <HeaderSection 
                activeStudentsCount={activeStudents.length} 
                submittedCount={students.filter(s => s.status === 'Submitted' || s.status === 'Graded').length}
                totalParticipants={students.length}
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
                teachers={teachers as Participant[]}
                students={students as Participant[]}
                selectedStudentIds={selectedStudentIds}
                onToggleSelect={toggleSelectStudent}
                onReset={initiateReset as any}
                onContinue={handleContinue as any}
                onAllowRevision={handleAllowRevision as any}
                onPrint={handleSinglePrint as any}
                onGrade={openGrading as any}
            />

            <RetryModal 
                isOpen={retryModal.isOpen} 
                participant={retryModal.participant as Participant | null}
                onClose={() => setRetryModal({ isOpen: false, participant: null })}
                onConfirm={confirmReset}
            />

            <GradingModal 
                isOpen={gradingModal.isOpen}
                participant={gradingModal.participant as Participant | null}
                onClose={() => setGradingModal({ isOpen: false, participant: null })}
                questions={questions}
                currentGrades={currentGrades}
                setCurrentGrades={setCurrentGrades}
                onSave={saveGrades}
                onAutoSave={handleAutoSave}
                onPrint={(withFeedback, gradesSnapshot) => {
                    const currentTotal = Object.values(gradesSnapshot).reduce((acc: number, curr: {score: number, feedback: string}) => acc + (curr.score || 0), 0);
                    const updatedParticipant: MonitorParticipant = {
                        ...(gradingModal.participant as MonitorParticipant),
                        score: currentTotal, 
                        data: {
                            ...gradingModal.participant?.data,
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
