
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AssessmentQuestion, Board } from '../../../types';
import { Plus, Trash2, CheckCircle, Type, List, X, Layout, GripVertical, AlignLeft, Bold, Italic, Subscript, Superscript, List as ListIcon, Calculator, AlertCircle, PenTool, Image, FileText, UploadCloud, Loader2, Underline, Strikethrough, AlignCenter, AlignRight, AlignJustify, Pilcrow, Quote, Undo, Redo, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react';
import { useSortableList } from '../../../src/logic/dnd/useSortableList';
import { RichTextEditor, FormatState, getActiveFormat } from '../../RichTextEditor';
import { DebouncedInput } from '../../ui/DebouncedInput';
import { parseMath } from '../../../utils/mappers';
import { supabase } from '../../../services/supabaseClient';

interface EditorProps {
    questions: AssessmentQuestion[];
    onUpdateBoard: (updates: Partial<Board>) => void;
}

export const Editor: React.FC<EditorProps> = ({ questions, onUpdateBoard }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeEditor, setActiveEditor] = useState<string | null>(null);
    const [activeFormats, setActiveFormats] = useState<FormatState>({
        bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false,
        subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false,
        alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
    });
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { handleDragStart, handleDragEnter, handleDragEnd, draggedItem, dragOverItem } = useSortableList({
        items: questions,
        onReorder: (newItems: any) => onUpdateBoard({ assessmentQuestions: newItems })
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
                if (currentSectionId) sScores[currentSectionId] += points;
            }
        });
        return { totalMarks: total, sectionScores: sScores };
    }, [questions]);

    const addQuestion = (type: 'mcq' | 'essay' | 'section') => {
        const newQ: AssessmentQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            type, text: type === 'section' ? 'New Section' : '', notes: '',
            options: type === 'mcq' ? ['', ''] : undefined,
            correctAnswer: type === 'mcq' ? '0' : undefined,
            points: type === 'section' ? 0 : (type === 'mcq' ? 1 : 5),
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

    const getQuestionNumber = (index: number) => questions.slice(0, index + 1).filter(q => q.type !== 'section').length;

    const handleCommand = (cmd: string, value?: string) => {
        document.execCommand(cmd, false, value);
        if (activeEditor) {
            const editor = document.getElementById(activeEditor);
            if (editor) {
                const html = editor.innerHTML;
                const [qId, field, optIdx] = activeEditor.split('-');
                if (field === 'options' && optIdx) {
                    const q = questions.find(q => q.id === qId);
                    const newOptions = [...(q?.options || [])];
                    newOptions[parseInt(optIdx)] = html;
                    updateQuestion(qId, { options: newOptions });
                } else {
                    updateQuestion(qId, { [field]: html });
                }
            }
        }
        // Manually trigger format check after command
        const selection = window.getSelection();
        if (selection) {
          const parentTag = (selection.anchorNode?.parentNode as HTMLElement)?.tagName;
          setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            list: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
            subscript: document.queryCommandState('subscript'),
            superscript: document.queryCommandState('superscript'),
            blockquote: getActiveFormat('', ['BLOCKQUOTE']),
            h1: parentTag === 'H1',
            h2: parentTag === 'H2',
            h3: parentTag === 'H3',
            h4: parentTag === 'H4',
            alignLeft: document.queryCommandState('justifyLeft'),
            alignCenter: document.queryCommandState('justifyCenter'),
            alignRight: document.queryCommandState('justifyRight'),
            alignJustify: document.queryCommandState('justifyFull'),
          });
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!activeEditor) return;
        setIsUploading(activeEditor);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `assessment-image-${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage.from('uploads').upload(fileName, file);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            const imageHtml = `<img src="${publicUrl}" style="max-width: 100%; border-radius: 8px;"/>`;
            document.execCommand('insertHTML', false, imageHtml);
            
            const editor = document.getElementById(activeEditor);
            if (editor) {
                const [qId, field, optIdx] = activeEditor.split('-');
                let html = editor.innerHTML;
                if (field === 'options' && optIdx !== undefined) {
                    const question = questions.find(q => q.id === qId);
                    if (question && question.options) {
                        const newOptions = [...question.options];
                        newOptions[parseInt(optIdx)] = html;
                        updateQuestion(qId, { options: newOptions });
                    }
                } else if (field === 'text' || field === 'notes') {
                    updateQuestion(qId, { [field]: html });
                }
            }
        } catch (e) { console.error("Upload failed", e); } 
        finally { setIsUploading(null); }
    };

    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;

    const renderToolbar = (editorKey: string) => {
        if (activeEditor !== editorKey) return null;
        
        const formatBlock = (tag: string) => handleCommand('formatBlock', `<${tag}>`);
        
        return (
            <div className="flex flex-wrap items-center gap-1 p-1 border-b border-white/10 bg-[#111] sticky top-0 z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Undo/Redo */}
                <button onMouseDown={e => { e.preventDefault(); handleCommand('undo'); }} className={getBtnClass(false)} title="Undo (Ctrl+Z)"><Undo size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('redo'); }} className={getBtnClass(false)} title="Redo (Ctrl+Y)"><Redo size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Headings */}
                <button onMouseDown={e => { e.preventDefault(); formatBlock('h1'); }} className={getBtnClass(activeFormats.h1)} title="Heading 1"><Heading1 size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); formatBlock('h2'); }} className={getBtnClass(activeFormats.h2)} title="Heading 2"><Heading2 size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); formatBlock('h3'); }} className={getBtnClass(activeFormats.h3)} title="Heading 3"><Heading3 size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); formatBlock('h4'); }} className={getBtnClass(activeFormats.h4)} title="Heading 4"><Heading4 size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                
                {/* Basic Formatting */}
                <button onMouseDown={e => { e.preventDefault(); handleCommand('bold'); }} className={getBtnClass(activeFormats.bold)} title="Bold (Ctrl+B)"><Bold size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('italic'); }} className={getBtnClass(activeFormats.italic)} title="Italic (Ctrl+I)"><Italic size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('underline'); }} className={getBtnClass(activeFormats.underline)} title="Underline (Ctrl+U)"><Underline size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('strikeThrough'); }} className={getBtnClass(activeFormats.strikeThrough)} title="Strikethrough"><Strikethrough size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                
                {/* Sub/Superscript */}
                <button onMouseDown={e => { e.preventDefault(); handleCommand('subscript'); }} className={getBtnClass(activeFormats.subscript)} title="Subscript"><Subscript size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('superscript'); }} className={getBtnClass(activeFormats.superscript)} title="Superscript"><Superscript size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Lists & Quote */}
                <button onMouseDown={e => { e.preventDefault(); handleCommand('insertUnorderedList'); }} className={getBtnClass(activeFormats.list)} title="Bulleted List (Ctrl+Shift+8)"><ListIcon size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('insertOrderedList'); }} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><List size={14} /></button>
                <button onMouseDown={e => { e.preventDefault(); formatBlock('blockquote'); }} className={getBtnClass(activeFormats.blockquote)} title="Blockquote"><Quote size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Alignment */}
                <button onMouseDown={e => { e.preventDefault(); handleCommand('justifyLeft'); }} className={getBtnClass(activeFormats.alignLeft)} title="Align Left"><AlignLeft size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('justifyCenter'); }} className={getBtnClass(activeFormats.alignCenter)} title="Align Center"><AlignCenter size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('justifyRight'); }} className={getBtnClass(activeFormats.alignRight)} title="Align Right"><AlignRight size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); handleCommand('justifyFull'); }} className={getBtnClass(activeFormats.alignJustify)} title="Justify"><AlignJustify size={14}/></button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>

                {/* Image Upload */}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                <button onClick={() => fileInputRef.current?.click()} className={`${getBtnClass(false)} ${isUploading === editorKey ? 'text-yellow-500' : ''}`} title="Upload Image" disabled={!!isUploading}>
                    {isUploading === editorKey ? <Loader2 size={14} className="animate-spin"/> : <Image size={14}/>}
                </button>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-[#111] overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-[#161616] border-r border-white/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/10 bg-[#1a1a1a] flex justify-between items-center">
                    <h3 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Structure</h3>
                    <div className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs font-bold border border-blue-500/30 flex items-center gap-1"><Calculator size={12} />Total: {totalMarks} Marks</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {questions.map((q, idx) => (
                        <div key={q.id} draggable onDragStart={(e) => handleDragStart(e, q)} onDragEnter={(e) => handleDragEnter(e, q)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} onClick={() => setEditingId(q.id)}
                            className={`group relative p-3 rounded-lg cursor-pointer border transition-all select-none ${editingId === q.id ? 'bg-blue-600/10 border-blue-500/50 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/5'} ${draggedItem?.id === q.id ? 'opacity-30' : ''} ${dragOverItem?.id === q.id && draggedItem?.id !== q.id ? 'border-t-2 border-t-blue-500' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="text-gray-600 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"><GripVertical size={12} /></div>
                                {q.type === 'section' ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-yellow-500/20 flex items-center gap-1"><Layout size={10} /> Section</span>
                                        <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{sectionScores[q.id] || 0} Marks</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2"><span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${editingId === q.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>{getQuestionNumber(idx)}</span><span className="text-[10px] text-gray-500 uppercase font-medium">{q.type}</span></div>
                                        <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 rounded ${editingId === q.id ? 'text-blue-300' : 'text-gray-500'}`}>{q.points} Marks</span>
                                    </div>
                                )}
                            </div>
                            <div className={`text-xs truncate ml-6 pr-2 leading-relaxed ${q.type === 'section' ? 'font-bold text-yellow-100 uppercase tracking-wide' : 'text-gray-300'}`} dangerouslySetInnerHTML={{ __html: parseMath(q.text) || '<em>Untitled</em>' }} />
                        </div>
                    ))}
                    {questions.length === 0 && <div className="text-center py-10 text-gray-500 text-xs">No questions yet.</div>}
                </div>
                <div className="p-3 border-t border-white/10 grid grid-cols-3 gap-2 bg-[#1a1a1a]">
                    <button onClick={() => addQuestion('section')} className="bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"><Layout size={14}/> Section</button>
                    <button onClick={() => addQuestion('mcq')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"><List size={14}/> MCQ</button>
                    <button onClick={() => addQuestion('essay')} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 p-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"><Type size={14}/> Essay</button>
                </div>
            </div>

            {/* Editor Panel */}
            <div className="flex-1 bg-[#111] p-6 md:p-10 overflow-y-auto custom-scrollbar">
                {editingId && questions.find(qu => qu.id === editingId) ? (() => {
                    const q = questions.find(qu => qu.id === editingId)!;
                    const isSection = q.type === 'section';
                    const editorFocusHandler = (key: string) => { setActiveEditor(key); };

                    return (
                        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className={`text-xl font-bold flex items-center gap-3 ${isSection ? 'text-yellow-500' : 'text-white'}`}><div className={`p-2 rounded-lg ${isSection ? 'bg-yellow-500/20' : (q.type === 'mcq' ? 'bg-blue-500/20' : 'bg-purple-500/20')}`}>{isSection ? <Layout size={20}/> : (q.type === 'mcq' ? <List size={20}/> : <Type size={20}/>)}</div>{isSection ? 'Section Header' : 'Edit Question'}</h2>
                                <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:bg-red-900/20 hover:text-red-300 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-transparent hover:border-red-500/30"><Trash2 size={14}/> Delete</button>
                            </div>

                            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{isSection ? 'Section Title' : 'Question Prompt'}</label>
                                    <div className={`bg-[#111] border rounded-xl p-2 focus-within:border-blue-500 transition-colors ${activeEditor === `${q.id}-text` ? 'border-blue-500' : 'border-white/10'}`} onFocus={() => editorFocusHandler(`${q.id}-text`)}>
                                        {renderToolbar(`${q.id}-text`)}
                                        <RichTextEditor id={`${q.id}-text`} value={q.text} onChange={(val: string) => updateQuestion(q.id, { text: val })} onFormatChange={setActiveFormats} placeholder="Type your question here..." className="w-full text-base text-white placeholder-white/20 min-h-[100px] focus:outline-none p-2" />
                                    </div>
                                </div>

                                {!isSection && (
                                     <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><FileText size={12}/> Sub-text / Notes (Optional)</label>
                                        <div className={`bg-[#111] border rounded-xl p-2 focus-within:border-blue-500 transition-colors ${activeEditor === `${q.id}-notes` ? 'border-blue-500' : 'border-white/10'}`} onFocus={() => editorFocusHandler(`${q.id}-notes`)}>
                                            {renderToolbar(`${q.id}-notes`)}
                                            <RichTextEditor id={`${q.id}-notes`} value={q.notes || ''} onChange={(val: string) => updateQuestion(q.id, { notes: val })} onFormatChange={setActiveFormats} placeholder="Add instructions, hints, or context..." className="w-full text-sm text-white placeholder-white/20 min-h-[60px] focus:outline-none p-2" />
                                        </div>
                                    </div>
                                )}

                                {!isSection && <div className="grid grid-cols-2 gap-6 p-4 bg-[#111] rounded-xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Score Value</label>
                                        <div className="flex items-center gap-2"><DebouncedInput type="number" value={q.points} onChange={(val: any) => updateQuestion(q.id, { points: parseInt(val) || 0 })} className="w-24 bg-[#222] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500 text-center font-bold text-lg" /><span className="text-sm text-gray-500 font-bold">Marks</span></div>
                                    </div>
                                    {q.type === 'essay' && <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><AlignLeft size={14}/> Word Count Min.</label><div className="flex items-center gap-2"><DebouncedInput type="number" value={q.minWords || 0} onChange={(val: any) => updateQuestion(q.id, { minWords: parseInt(val) || 0 })} className="w-24 bg-[#222] border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500 text-center font-bold" /><span className="text-sm text-gray-500">Words</span></div></div>}
                                </div>}

                                {q.type === 'mcq' && (
                                    <div className="space-y-4 pt-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><span>Answer Options</span><span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20 normal-case">Select the correct answer</span></label>
                                        <div className="space-y-3">
                                            {q.options?.map((opt, idx) => (
                                                <div key={idx} className="flex items-start gap-3 group relative">
                                                    <button onClick={() => updateQuestion(q.id, { correctAnswer: idx.toString() })} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-8 ${q.correctAnswer === idx.toString() ? 'border-green-500 bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'border-gray-600 hover:border-gray-400 bg-transparent text-transparent'}`}><CheckCircle size={16}/></button>
                                                    <div className={`flex-1 bg-[#111] border rounded-lg text-sm text-white outline-none focus-within:border-blue-500 transition-colors p-2 ${q.correctAnswer === idx.toString() ? 'border-green-500/30 bg-green-900/10' : 'border-white/10'} ${activeEditor === `${q.id}-options-${idx}` ? 'border-blue-500' : 'border-white/10'}`} onFocus={() => editorFocusHandler(`${q.id}-options-${idx}`)}>
                                                        {renderToolbar(`${q.id}-options-${idx}`)}
                                                        <RichTextEditor id={`${q.id}-options-${idx}`} value={opt} onChange={(val: string) => {const newOpts = [...(q.options || [])]; newOpts[idx] = val; updateQuestion(q.id, { options: newOpts });}} onFormatChange={setActiveFormats} placeholder={`Option ${idx + 1}`} className="w-full text-sm text-white placeholder-white/20 min-h-[30px] focus:outline-none p-2"/>
                                                    </div>
                                                    <button onClick={() => updateQuestion(q.id, { options: q.options?.filter((_, i) => i !== idx) })} className="absolute right-3 top-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><X size={16}/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 mt-4 px-3 py-2 hover:bg-blue-500/10 rounded-lg transition-colors w-fit"><Plus size={14}/> Add Option</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })() : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50 select-none"><div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><Layout size={48} className="text-gray-600"/></div><p className="text-sm font-medium">Select an item to edit</p></div>
                )}
            </div>
        </div>
    );
};
