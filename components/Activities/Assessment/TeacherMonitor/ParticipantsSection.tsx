
import React from 'react';
import { ParticipantCard } from './ParticipantCard';
import { PrintMode } from '../AssessmentPrintView';

interface ParticipantsSectionProps {
    teachers: any[];
    students: any[];
    selectedStudentIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onReset: (participant: any) => void;
    onContinue: (participant: any) => void;
    onAllowRevision: (participant: any) => void;
    onPrint: (participant: any, mode: PrintMode) => void;
    onGrade: (participant: any) => void;
    totalPoints: number;
}

export const ParticipantsSection: React.FC<ParticipantsSectionProps> = ({ 
    teachers, students, selectedStudentIds, onToggleSelect, onReset, onContinue, 
    onAllowRevision, onPrint, onGrade, totalPoints
}) => {
    
    return (
        <div className="flex-1 overflow-y-auto pb-20 no-scrollbar animate-in fade-in">
            {/* Teachers Section */}
            {teachers.length > 0 && (
                 <div className="mb-8">
                    <h2 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Teachers ({teachers.length})</h2>
                    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                        {teachers.map(t => (
                           <div key={t.id} className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 flex items-center justify-between">
                                <span className="font-bold text-sm text-gray-300">{t.name}</span>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Monitoring
                                </span>
                           </div>
                        ))}
                    </div>
                </div>
            )}
           
            {/* Students Section */}
            <div>
                <h2 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Students ({students.length})</h2>
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                    {students.map(s => (
                        <ParticipantCard 
                            key={s.id}
                            participant={s}
                            isSelected={selectedStudentIds.has(s.id)}
                            onToggleSelect={onToggleSelect}
                            onReset={onReset}
                            onContinue={onContinue}
                            onAllowRevision={onAllowRevision}
                            onPrint={onPrint}
                            onGrade={onGrade}
                            totalPoints={totalPoints}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
