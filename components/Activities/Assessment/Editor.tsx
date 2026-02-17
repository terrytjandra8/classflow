
import React, { useState, useEffect, useMemo } from 'react';
import { AssessmentQuestion, Board } from '../../../types';
import { Plus, Trash2, CheckCircle, Type, List, Save, X, Layout, GripVertical, AlignLeft, Bold, Italic, List as ListIcon, Calculator, AlertCircle, PenTool, Image, FileText } from 'lucide-react';
import { useSortableList } from '../../../src/logic/dnd/useSortableList';
import { RichTextEditor } from '../../RichTextEditor';
import { DebouncedInput } from '../../ui/DebouncedInput';
import { parseMath } from '../../../utils/mappers';

interface EditorProps {
    questions: AssessmentQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
}

const DebouncedRichTextEditor = ({ value, onChange, className, placeholder, small }: any) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localValue, onChange, value]);

    const execCmd = (cmd: string) => {
        document.execCommand(cmd, false, undefined);
    };

    return (
        <div className={className}>
            <div className="flex items-center gap-1 mb-2 border-b border-white/10 pb-2">
                <button 
                    onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} 
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={14}/>
                </button>
                <button 
                    onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} 
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={14}/>
                </button>
                <button 
                    onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} 
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="List"
                >
                    <ListIcon size={14}/>
                </button>
            </div>
            <RichTextEditor 
                value={localValue} 
                onChange={setLocalValue} 
                className={`w-full outline-none bg-transparent text-white placeholder-gray-500 ${small ? 'min-h-[60px] text-sm' : 'min-h-[100px] text-lg leading-relaxed'}`}
                placeholder={placeholder}
            />
        </div>
    );
};

export const Editor: React.FC<EditorProps> = ({ questions, onUpdateBoard }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const { handleDragStart, handleDragEnter, handleDragEnd, draggedItem, dragOverItem } = useSortableList({
        items: questions,
        onReorder: (newItems: any) => {
            onUpdateBoard({ assessmentQuestions: newItems });
        }
    });

    const { totalMarks, sectionScores } = useMemo(() => {
        let total = 0;
        const sScores: Record<string, number> = {};
        let currentSectionId = '';

        questions.forEach(q => {
            if (q.type === 'section') {
                currentSectionId = q.id;
                sScores[currentSectionId] = 0;
            } else {
                const points = q.points || 0;
                total += points;
                if (currentSectionId) {
                    sScores[currentSectionId] += points;
                }
            }
        });

        return { totalMarks: total, sectionScores: sScores };
    }, [questions]);

    const addQuestion = (type: 'mcq' | 'essay' | 'section') => {
        const newQ: AssessmentQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            text: type === 'section' ? 'New Section' : (type === 'mcq' ? 'New Multiple Choice Question' : 'New Essay Question'),
            notes: '',
            options: type === 'mcq' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : undefined,
            correctAnswer: type === 'mcq' ? '0' : undefined,
            points: type === 'section' ? 0 : (type === 'mcq' ? 1 : 5),
            minWords: type === 'essay' ? 0 : undefined,
            responseType: 'text'
        };
        const newQuestions = [...questions, newQ];
        onUpdateBoard({ assessmentQuestions: newQuestions });
        setEditingId(newQ.id);
    };

    const updateQuestion = (id: string, updates: Partial<AssessmentQuestion>) => {
        const newQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q);
        onUpdateBoard({ assessmentQuestions: newQuestions });
    };

    const deleteQuestion = (id: string) => {
        const newQuestions = questions.filter(q => q.id !== id);
        onUpdateBoard({ assessmentQuestions: newQuestions });
        if (editingId === id) setEditingId(null);
    };

    const getQuestionNumber = (index: number) => {
        return questions.filter((q, i) => i <= index && q.type !== 'section').length;
    };

    return (
        <div className="flex h-full bg-[#111] overflow-hidden">
            <div className="w-80 bg-[#161616] border-r border-white/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/10 bg-[#1a1a1a] flex justify-between items-center">
                    <h3 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Structure</h3>
                    <div className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs font-bold border border-blue-500/30 flex items-center gap-1">
                        <Calculator size={12} />
                        Total: {totalMarks} Marks
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {questions.map((q, idx) => {
                        const isEditing = editingId === q.id;
                        const isSection = q.type === 'section';

                        return (
                            <div 
                                key={q.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, q)}
                                onDragEnter={(e) => handleDragEnter(e, q)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => setEditingId(q.id)}
                                className={`
                                    group relative p-3 rounded-lg cursor-pointer border transition-all select-none
                                    ${isEditing 
                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-white/5'}
                                    ${draggedItem?.id === q.id ? 'opacity-30' : ''}
                                    ${dragOverItem?.id === q.id && draggedItem?.id !== q.id ? 'border-t-2 border-t-blue-500' : ''}
                                `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-gray-600 group-hover:text-gray-400 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={12} />
                                    </div>
                                    
                                    {isSection ? (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-yellow-500/20 flex items-center gap-1">
                                                <Layout size={10} /> Section
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                {sectionScores[q.id] || 0} Marks
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isEditing ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                    {getQuestionNumber(idx)}
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase font-medium">{q.type}</span>
                                            </div>
                                            <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 rounded ${isEditing ? 'text-blue-300' : 'text-gray-500'}`}>
                                                {q.points} Marks
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div 
                                    className={`text-xs truncate ml-6 pr-2 leading-relaxed ${isSection ? 'font-bold text-yellow-100 uppercase tracking-wide' : 'text-gray-300'}`}
                                    dangerouslySetInnerHTML={{ __html: parseMath(q.text) }}
                                />
                            </div>
                        );
                    })}
                    
                    {questions.length === 0 && (
                         <div className="text-center py-10 text-gray-500 text-xs">
                             No questions yet. Add one below.
                         </div>
                    )}
                </div>

                <div className="p-3 border-t border-white/10 grid grid-cols-3 gap-2 bg-[#1a1a1a]">
                    <button onClick={() => addQuestion('section')} className="bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                        <Layout size={14}/> Section
                    </button>
                    <button onClick={() => addQuestion('mcq')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                        <List size={14}/> MCQ
                    </button>
                    <button onClick={() => addQuestion('essay')} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors">
                        <Type size={14}/> Essay
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#111] p-6 md:p-10 overflow-y-auto">
                {editingId ? (() => {
                    const q = questions.find(qu => qu.id === editingId);
                    if (!q) return null;
                    const isSection = q.type === 'section';

                    return (
                        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            <div className="flex justify-between items-center mb-2">
                                <h2 className={`text-xl font-bold flex items-center gap-3 ${isSection ? 'text-yellow-500' : 'text-white'}`}>
                                    <div className={`p-2 rounded-lg ${isSection ? 'bg-yellow-500/20' : (q.type === 'mcq' ? 'bg-blue-500/20' : 'bg-purple-500/20')}`}>
                                        {isSection ? <Layout size={20}/> : (q.type === 'mcq' ? <List size={20}/> : <Type size={20}/>)}
                                    </div>
                                    {isSection ? 'Section Header' : 'Edit Question'}
                                </h2>
                                <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:bg-red-900/20 hover:text-red-300 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-transparent hover:border-red-500/30">
                                    <Trash2 size={14}/> Delete
                                </button>
                            </div>

                            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                        {isSection ? 'Section Title' : 'Question Prompt'}
                                    </label>
                                    
                                    {isSection ? (
                                        <DebouncedInput 
                                            key={q.id}
                                            value={q.text}
                                            onChange={(val: string) => updateQuestion(q.id, { text: val })}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-yellow-500 text-2xl font-bold placeholder-gray-600 transition-colors"
                                            placeholder="e.g. Part A: Multiple Choice"
                                        />
                                    ) : (
                                        <DebouncedRichTextEditor 
                                            key={q.id}
                                            value={q.text}
                                            onChange={(val: string) => updateQuestion(q.id, { text: val })}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus-within:border-blue-500 transition-colors min-h-[120px]"
                                            placeholder="Type your question here. Use ($Y_{FE}$) for subscript and ($X^{2}$) for superscript."
                                        />
                                    )}
                                </div>

                                {!isSection && (
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={12}/> Sub-text / Notes (Optional)
                                        </label>
                                        <DebouncedRichTextEditor 
                                            key={`notes-${q.id}`}
                                            value={q.notes || ''}
                                            onChange={(val: string) => updateQuestion(q.id, { notes: val })}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white focus-within:border-blue-500 transition-colors"
                                            placeholder="Add additional instructions, hints, or context here..."
                                            small
                                        />
                                    </div>
                                )}

                                {!isSection && (
                                    <div className="grid grid-cols-2 gap-6 p-4 bg-[#111] rounded-xl border border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Score Value</label>
                                            <div className="flex items-center gap-2">
                                                <DebouncedInput 
                                                    key={`points-${q.id}`}
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(val: any) => updateQuestion(q.id, { points: parseInt(val) || 0 })}
                                                    className="w-24 bg-[#222] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500 text-center font-bold text-lg"
                                                />
                                                <span className="text-sm text-gray-500 font-bold">Marks</span>
                                            </div>
                                        </div>

                                        {q.type === 'essay' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                                        <AlignLeft size={14}/> Minimum Requirement
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <DebouncedInput 
                                                            key={`minWords-${q.id}`}
                                                            type="number"
                                                            value={q.minWords || 0}
                                                            onChange={(val: any) => updateQuestion(q.id, { minWords: parseInt(val) || 0 })}
                                                            className="w-24 bg-[#222] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500 text-center font-bold"
                                                        />
                                                        <span className="text-sm text-gray-500">Words</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Response Type</label>
                                                    <div className="flex gap-1 bg-[#222] p-1 rounded-lg">
                                                        <button 
                                                            onClick={() => updateQuestion(q.id, { responseType: 'text' })}
                                                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${q.responseType === 'text' || (!q.responseType && !q.allowDrawing) ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            <Type size={12} /> Text
                                                        </button>
                                                        <button 
                                                            onClick={() => updateQuestion(q.id, { responseType: 'drawing' })}
                                                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${q.responseType === 'drawing' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            <PenTool size={12} /> Draw
                                                        </button>
                                                        <button 
                                                            onClick={() => updateQuestion(q.id, { responseType: 'both' })}
                                                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${(q.responseType === 'both' || q.allowDrawing) && q.responseType !== 'drawing' && q.responseType !== 'text' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                                        >
                                                            <Image size={12} /> Both
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {q.type === 'mcq' && (
                                    <div className="space-y-4 pt-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Answer Options</span>
                                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20 normal-case">Select the correct answer</span>
                                        </label>
                                        <div className="space-y-3">
                                            {q.options?.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-3 group relative">
                                                    <button 
                                                        onClick={() => updateQuestion(q.id, { correctAnswer: idx.toString() })}
                                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${q.correctAnswer === idx.toString() ? 'border-green-500 bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'border-gray-600 hover:border-gray-400 bg-transparent text-transparent'}`}
                                                    >
                                                        <CheckCircle size={16}/>
                                                    </button>
                                                    <DebouncedInput 
                                                        key={`opt-${q.id}-${idx}`}
                                                        value={opt}
                                                        onChange={(val: string) => {
                                                            const newOpts = [...(q.options || [])];
                                                            newOpts[idx] = val;
                                                            updateQuestion(q.id, { options: newOpts });
                                                        }}
                                                        className={`flex-1 bg-[#111] border rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors ${q.correctAnswer === idx.toString() ? 'border-green-500/30 bg-green-900/10' : 'border-white/10'}`}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const newOpts = q.options?.filter((_, i) => i !== idx);
                                                            updateQuestion(q.id, { options: newOpts });
                                                        }}
                                                        className="absolute right-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <X size={16}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                                            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 mt-4 px-3 py-2 hover:bg-blue-500/10 rounded-lg transition-colors w-fit"
                                        >
                                            <Plus size={14}/> Add Option
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })() : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50 select-none">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Layout size={48} className="text-gray-600"/>
                        </div>
                        <p className="text-sm font-medium">Select an item from the sidebar to edit</p>
                    </div>
                )}
            </div>
        </div>
    );
};
