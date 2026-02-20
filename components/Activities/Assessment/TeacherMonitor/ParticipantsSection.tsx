
import React, { useState } from 'react';
import { File, CheckCircle, AlertTriangle, RefreshCw, Printer, User, UserCheck, XCircle, FileText, FileX } from 'lucide-react';
import { PrintMode } from '../AssessmentPrintView';

interface Participant {
    id: string;
    noteId: string | null;
    name: string;
    role: string;
    violations?: number;
    score?: number;
    status: 'In Progress' | 'Submitted' | 'Graded' | 'Disqualified' | 'Ready' | 'Revising';
    progress: number;
    disqualified?: boolean;
    hasLowWordCount?: boolean;
    data: any;
}

interface ParticipantsSectionProps {
    teachers: Participant[];
    students: Participant[];
    selectedStudentIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onReset: (participant: Participant) => void;
    onContinue: (participant: Participant) => void;
    onGrade: (participant: Participant) => void;
    onPrint: (participant: Participant, mode: PrintMode) => void;
    onAllowRevision: (participant: Participant) => void;
}

const TeacherCard = ({ teacher }: { teacher: Participant }) => (
    <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
            {teacher.name.charAt(0)}
        </div>
        <div>
            <p className="font-bold">{teacher.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Monitoring
            </p>
        </div>
    </div>
);

const StudentCard = ({ student, selected, onToggleSelect, onReset, onContinue, onGrade, onPrint, onAllowRevision }: {
    student: Participant;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onReset: (participant: Participant) => void;
    onContinue: (participant: Participant) => void;
    onGrade: (participant: Participant) => void;
    onPrint: (participant: Participant, mode: PrintMode) => void;
    onAllowRevision: (participant: Participant) => void;
}) => {
    const statusConfig = {
        'Ready': { text: 'Ready', color: 'text-gray-400', icon: <User size={12}/> },
        'In Progress': { text: 'In Progress', color: 'text-yellow-400', icon: <RefreshCw size={12} className="animate-spin"/> },
        'Submitted': { text: 'Submitted', color: 'text-blue-400', icon: <CheckCircle size={12}/> },
        'Graded': { text: 'Graded', color: 'text-green-400', icon: <UserCheck size={12}/> },
        'Disqualified': { text: 'Disqualified', color: 'text-red-500', icon: <XCircle size={12}/> },
        'Revising': { text: 'Revising', color: 'text-orange-400', icon: <RefreshCw size={12}/> },
    };

    const currentStatus = statusConfig[student.status] || statusConfig['Ready'];
    const [printMenuOpen, setPrintMenuOpen] = useState(false);

    return (
        <div className={`bg-[#1a1a1a] p-4 rounded-lg border transition-colors ${selected ? 'border-blue-500' : 'border-white/10'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${student.role === 'teacher' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {student.role}
                        </div>
                    </div>
                    <p className="font-bold">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className={`text-xs font-bold flex items-center gap-1.5 ${currentStatus.color}`}>
                            {currentStatus.icon} {currentStatus.text}
                        </p>
                        {student.hasLowWordCount && <p className="text-xs font-bold text-amber-500 flex items-center gap-1"><AlertTriangle size={12}/> Low WC</p>}
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    checked={selected} 
                    onChange={() => onToggleSelect(student.id)}
                    className="w-4 h-4 rounded bg-black/20 border-white/20 text-blue-500 focus:ring-blue-500"
                />
            </div>

            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Progress</span>
                    <span className="text-xs font-bold">{Math.round(student.progress * 100)}%</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${student.progress * 100}%` }}></div>
                </div>
            </div>
            
            <div className="flex justify-between items-end mt-2">
                <div>
                    {student.disqualified && (
                        <button onClick={() => onContinue(student)} className="text-xs font-bold text-green-400 hover:text-white bg-green-500/10 px-2 py-1 rounded border border-green-500/30">
                            Re-enable
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Final Score</span>
                    <p className="font-bold text-green-500 text-lg leading-none">{student.score ?? '—'} <span className="text-sm">pts</span></p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {student.status === 'Submitted' || student.status === 'Graded' ? (
                        <button onClick={() => onAllowRevision(student)} className="text-center font-bold text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:text-white px-3 py-1 rounded-lg transition-colors">
                            Revise
                        </button>
                    ) : student.status === 'Revising' ? (
                         <span className="text-xs font-bold text-orange-400">Revising...</span>
                    ) : (
                         <button onClick={() => onReset(student)} disabled={!student.noteId || student.status === 'Ready'} className="text-center font-bold text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Reset
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {(student.status === 'Submitted' || student.status === 'Graded' || student.status === 'Revising') ? (
                        <>
                            <button onClick={() => onGrade(student)} className="flex-1 text-center font-bold text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                                {student.status === 'Graded' ? 'View Grade' : 'Grade'}
                            </button>
                            <div className="relative">
                                <button 
                                    onClick={() => setPrintMenuOpen(p => !p)} 
                                    className="p-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Printer size={16} />
                                </button>
                                {printMenuOpen && (
                                    <div 
                                        className="absolute right-0 bottom-full mb-2 w-56 rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 z-50 bg-[#2a2a2a] border-white/10"
                                        onMouseLeave={() => setPrintMenuOpen(false)}
                                    >
                                        <button onClick={() => { onPrint(student, 'WITH_ANSWERS_AND_FEEDBACK'); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                                            <FileText size={14} /> Print Graded Paper
                                        </button>
                                        <button onClick={() => { onPrint(student, 'WITH_ANSWERS'); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                                            <File size={14} /> Print Student Submission
                                        </button>
                                        <button onClick={() => { onPrint(student, 'BLANK'); setPrintMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                                            <FileX size={14} /> Print Blank Paper
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        student.status === 'In Progress' && (
                            <button onClick={() => onContinue(student)} className="text-xs font-bold text-gray-300">
                                Continue
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};


export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({ 
    teachers, students, selectedStudentIds, onToggleSelect, onReset, onContinue, onGrade, onPrint, onAllowRevision 
}) => {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-3 pr-3">
            {teachers.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User size={14} /> Teachers ({teachers.length})
                    </h3>
                    <div className="space-y-3">
                        {teachers.map(t => <TeacherCard key={t.id} teacher={t} />)}
                    </div>
                </div>
            )}
            
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User size={14} /> Students ({students.length})
                </h3>
                {students.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {students.map(s => (
                            <StudentCard 
                                key={s.id} 
                                student={s}
                                selected={selectedStudentIds.has(s.id)}
                                onToggleSelect={onToggleSelect}
                                onReset={onReset}
                                onContinue={onContinue}
                                onGrade={onGrade}
                                onPrint={onPrint}
                                onAllowRevision={onAllowRevision}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-lg">
                        <p className="text-gray-400">No students have joined yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
