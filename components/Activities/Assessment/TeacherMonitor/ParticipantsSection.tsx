
import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { ParticipantCard } from './ParticipantCard';

interface Participant {
    id: string;
    name: string;
    role: string;
    disqualified: boolean;
    status: 'Submitted' | 'Graded' | 'In Progress' | 'Revising' | 'Ready';
    violations: number;
    hasLowWordCount: boolean;
    progress: number;
    score: number;
}

interface ParticipantsSectionProps {
    teachers: Participant[];
    students: Participant[];
    selectedStudentIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onReset: (participant: Participant) => void;
    onContinue: (participant: Participant) => void;
    onAllowRevision: (participant: Participant) => void;
    onPrint: (participant: Participant) => void;
    onGrade: (participant: Participant) => void;
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({ 
    teachers, students, selectedStudentIds, onToggleSelect, onReset, onContinue, onAllowRevision, onPrint, onGrade 
}) => {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 space-y-8">
            
            {/* TEACHERS SECTION */}
            {teachers.length > 0 && (
                <div className="animate-in fade-in slide-in-from-left-4">
                    <h3 className="text-pink-500 font-bold uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} /> Teachers ({teachers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {teachers.map((t: Participant) => (
                            <ParticipantCard 
                                key={t.id || Math.random()} 
                                participant={t} 
                                onReset={onReset} 
                                onContinue={onContinue}
                                onAllowRevision={onAllowRevision}
                                onPrint={onPrint}
                                onGrade={onGrade}
                                isSelected={false}
                                onToggleSelect={() => {}}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* STUDENTS SECTION */}
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-blue-500 font-bold uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} /> Students ({students.length})
                </h3>
                
                {students.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No students connected yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {students.map((s: Participant) => (
                            <ParticipantCard 
                                key={s.id || Math.random()} 
                                participant={s} 
                                onReset={onReset} 
                                onContinue={onContinue}
                                onAllowRevision={onAllowRevision}
                                onPrint={onPrint}
                                onGrade={onGrade}
                                isSelected={selectedStudentIds.has(s.id)}
                                onToggleSelect={onToggleSelect}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};
