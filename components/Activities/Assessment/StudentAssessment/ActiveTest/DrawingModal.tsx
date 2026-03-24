import React, { useState } from 'react';
import { X, PenTool, RefreshCcw, Check, AlertTriangle, Cloud, ChevronDown, ChevronUp } from 'lucide-react';
import { DrawingCanvas } from '../../../../ui/DrawingCanvas';
import { AssessmentQuestion } from '../../../../../types';
import { parseMath } from '../../../../../utils/mappers';

interface DrawingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDrawEnd: (blob: Blob) => void;
    initialData?: string;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    question?: AssessmentQuestion;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onDrawEnd, initialData, saveStatus, question }) => {
    const [questionExpanded, setQuestionExpanded] = useState(true);

    if (!isOpen) return null;

    const questionHtml = question?.text ? parseMath(question.text) : null;
    const notesHtml = question?.notes ? parseMath(question.notes) : null;

    return (
        // Full viewport overlay — avoids the Chromebook bottom-bar clipping issue
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col">
            {/* Header bar — slim and always visible at the top */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <PenTool size={16} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-white leading-none">Drawing Canvas</h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">Draw your answer below</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Save status indicator */}
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2.5 py-1 rounded-full ${
                        saveStatus === 'idle' ? 'text-gray-500' :
                        saveStatus === 'saving' ? 'text-yellow-400 bg-yellow-500/10' :
                        saveStatus === 'saved' ? 'text-green-400 bg-green-500/10' :
                        'text-red-400 bg-red-500/10'
                    }`}>
                        {saveStatus === 'idle' && <Cloud size={12} className="opacity-40" />}
                        {saveStatus === 'saving' && <RefreshCcw size={12} className="animate-spin" />}
                        {saveStatus === 'saved' && <Check size={12} />}
                        {saveStatus === 'error' && <AlertTriangle size={12} />}
                        <span>
                            {saveStatus === 'idle' && 'Ready'}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'saved' && 'Saved'}
                            {saveStatus === 'error' && 'Save failed'}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-500 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                        <X size={14} />
                        Done
                    </button>
                </div>
            </div>

            {/* Question panel — collapsible so students can maximise canvas space */}
            {questionHtml && (
                <div className="shrink-0 bg-[#0f1117] border-b border-white/10">
                    <button
                        onClick={() => setQuestionExpanded(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-blue-400 hover:bg-white/5 transition-colors"
                    >
                        <span className="uppercase tracking-wider">Question</span>
                        {questionExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {questionExpanded && (
                        <div className="px-4 pb-3 space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            <div
                                className="text-sm text-gray-200 leading-relaxed rich-text-content select-none"
                                dangerouslySetInnerHTML={{ __html: questionHtml }}
                            />
                            {notesHtml && (
                                <div
                                    className="text-xs text-gray-400 italic leading-relaxed rich-text-content select-none bg-white/5 px-3 py-2 rounded-lg border border-white/10"
                                    dangerouslySetInnerHTML={{ __html: notesHtml }}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Canvas — takes all remaining height, never clipped */}
            <div className="flex-1 min-h-0">
                <DrawingCanvas
                    onDrawEnd={onDrawEnd}
                    initialData={initialData}
                    questionId={question?.id}
                    className="h-full"
                />
            </div>
        </div>
    );
};