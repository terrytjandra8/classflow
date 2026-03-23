
import React, { useState } from 'react';
import { QuizQuestion, Board } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface QuizEditorProps {
    questions: QuizQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
    onClose?: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ questions, onUpdateBoard, onClose }) => {
    const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

    const addQuestion = () => {
        const newQ: QuizQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            question: "New Question",
            options: ["", "", "", ""],
            correctIndex: 0,
            timeLimit: 20
        };
        onUpdateBoard({ quizQuestions: [...questions, newQ] });
        setEditingQuestion(newQ);
    };

    const updateQuestion = (q: QuizQuestion) => {
        const newQuestions = questions.map(exist => exist.id === q.id ? q : exist);
        onUpdateBoard({ quizQuestions: newQuestions });
        setEditingQuestion(null);
    };

    const deleteQuestion = (id: string) => {
        onUpdateBoard({ quizQuestions: questions.filter(q => q.id !== id) });
        if (editingQuestion?.id === id) setEditingQuestion(null);
    };

    return (
        <div className="w-96 bg-[#1a1a1a] border-r border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-left-5 shrink-0 h-full text-white font-sans">
            
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#161616]">
                <h3 className="font-bold text-gray-200">Questions ({questions.length})</h3>
                <button onClick={addQuestion} className="bg-purple-600 text-white p-1.5 rounded-md hover:bg-purple-700 transition-colors"><Plus size={16}/></button>
            </div>

            {editingQuestion ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1a1a]">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Question</label>
                        <textarea 
                            value={editingQuestion.question}
                            onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-purple-500 min-h-[80px]"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Options (Select Correct)</label>
                        <div className="space-y-2">
                            {editingQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="correct" 
                                        checked={editingQuestion.correctIndex === i} 
                                        onChange={() => setEditingQuestion({...editingQuestion, correctIndex: i})}
                                        className="accent-green-500 w-4 h-4 cursor-pointer shrink-0"
                                    />
                                    <input 
                                        value={opt}
                                        placeholder={`Option ${i + 1}`}
                                        onChange={(e) => {
                                            const newOpts = [...editingQuestion.options];
                                            newOpts[i] = e.target.value;
                                            setEditingQuestion({...editingQuestion, options: newOpts});
                                        }}
                                        className={`flex-1 bg-[#111] border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-500 ${editingQuestion.correctIndex === i ? 'border-green-500 text-green-400 font-bold' : 'border-white/10'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Time (Seconds)</label>
                        <input 
                            type="number"
                            value={editingQuestion.timeLimit}
                            onChange={(e) => setEditingQuestion({...editingQuestion, timeLimit: parseInt(e.target.value) || 10})}
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-sm"
                        />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button onClick={() => setEditingQuestion(null)} className="flex-1 py-2 text-gray-400 hover:text-white text-xs font-bold">Cancel</button>
                        <button onClick={() => updateQuestion(editingQuestion)} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold">Save</button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-[#222] border border-white/5 rounded-xl p-3 hover:bg-[#2a2a2a] transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-500 text-[10px]">Q{idx+1}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingQuestion(q)} className="p-1 hover:bg-white/10 rounded text-blue-400"><Edit2 size={12}/></button>
                                    <button onClick={() => deleteQuestion(q.id)} className="p-1 hover:bg-white/10 rounded text-red-400"><Trash2 size={12}/></button>
                                </div>
                            </div>
                            <p className="font-bold text-xs text-white line-clamp-2">{q.question}</p>
                        </div>
                    ))}
                    {questions.length === 0 && <div className="text-center text-gray-500 text-xs mt-8">No questions. Add one to start.</div>}
                </div>
            )}
        </div>
    );
};
