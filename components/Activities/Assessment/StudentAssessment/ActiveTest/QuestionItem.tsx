import React, { memo, useState } from 'react';
import { AssessmentQuestion, AssessmentConfig } from '../../../../../types';
import { Bold, Italic, Underline, List, ListOrdered, Subscript, Superscript, Minus, Square, PenTool, ShieldAlert, Check, Heading1, Heading2, Heading3, Heading4 } from 'lucide-react';
import { RichTextEditor, FormatState, getActiveFormat, RichTextEditorRef, DebouncedRichTextEditor } from '../../../../RichTextEditor';
import { parseMath } from '../../../../../utils/mappers';
import { countQualityWords } from '../../../../../utils/validation';

interface QuestionItemProps {
    q: AssessmentQuestion;
    answer: string;
    onAnswerChange: (id: string, val: string) => void;
    isReadingMode: boolean;
    setActiveDrawingQId: (id: string) => void;
    questionNumber: number;
    isReadOnly: boolean;
    config: AssessmentConfig;
}

export const QuestionItem = memo(({ 
    q, answer, onAnswerChange, isReadingMode, setActiveDrawingQId, questionNumber, isReadOnly, config
}: QuestionItemProps) => {
    const editorRef = React.useRef<RichTextEditorRef>(null);
    const [activeFormats, setActiveFormats] = useState<FormatState & { box: boolean }>({
        bold: false, italic: false, underline: false, strikeThrough: false, list: false, orderedList: false,
        subscript: false, superscript: false, blockquote: false, h1: false, h2: false, h3: false, h4: false,
        alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
        box: false, // New format for the box
    });
    
    if (q.type === 'section') {
        return (
            <div className="pt-8 pb-2 border-b border-white/10 mb-4">
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight" dangerouslySetInnerHTML={{ __html: parseMath(q.text) }} />
            </div>
        );
    }

    const isEssay = q.type === 'essay';
    const responseType = q.responseType || (q.allowDrawing ? 'both' : 'text');
    const allowText = responseType === 'text' || responseType === 'both';
    const allowDrawing = responseType === 'drawing' || responseType === 'both';

    // --- Composite answer parsing for 'both' mode ---
    // Format: JSON {"d":"drawing-url","t":"text-html"} or legacy plain string.
    let drawingUrl: string | undefined;
    let textValue: string;
    if (responseType === 'both' && answer) {
        try {
            const parsed = JSON.parse(answer);
            if (parsed && typeof parsed === 'object' && ('d' in parsed || 't' in parsed)) {
                drawingUrl = parsed.d || undefined;
                textValue = parsed.t || '';
            } else { throw new Error(); }
        } catch {
            // Legacy plain answer: URL → drawing, anything else → text
            if (answer.startsWith('http') || answer.startsWith('blob:')) {
                drawingUrl = answer;
                textValue = '';
            } else {
                drawingUrl = undefined;
                textValue = answer;
            }
        }
    } else {
        // Single-mode: answer is either a URL (drawing) or text
        const isUrl = !!answer && (answer.startsWith('http') || answer.startsWith('blob:'));
        drawingUrl = isUrl ? answer : undefined;
        textValue = isUrl ? '' : (answer || '');
    }

    const isDrawingAnswer = isEssay && !!drawingUrl;
    const isTextAnswer = isEssay && !isDrawingAnswer;
    const isDrawingVisible = allowDrawing && isDrawingAnswer;
    // When responseType is 'both', text field always stays visible
    const isTextVisible = allowText && (responseType === 'both' || !isDrawingAnswer);

    // Word-count uses the actual text content (not a URL)
    const wc = isTextVisible ? countQualityWords(textValue) : 0;
    const rawWc = isTextVisible ? textValue.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    const isSpamming = isTextVisible && !isReadingMode && !isReadOnly && (rawWc - wc > 5);
    const isUnderWordLimit = isTextVisible && q.minWords && wc < q.minWords;

    // Compose answer for text changes (preserves drawing URL in 'both' mode)
    const handleTextChange = (val: string) => {
        if (responseType === 'both') {
            onAnswerChange(q.id, JSON.stringify({ d: drawingUrl || '', t: val }));
        } else {
            onAnswerChange(q.id, val);
        }
    };

    
    const renderedText = parseMath(q.text);
    const renderedNotes = q.notes ? parseMath(q.notes) : null;

    const handleCommand = (cmd: string, value?: string) => {
        if (cmd === 'formatBlock' && value === 'box') {
            const isBoxActive = getActiveFormat('', ['SPAN.box']);
            document.execCommand('removeFormat');
            if (!isBoxActive) {
                document.execCommand('insertHTML', false, `<span class="box">${window.getSelection()?.toString()}</span>`);
            }
        } else if (cmd === 'formatBlock' && value && value.startsWith('H')) {
            const level = value.toLowerCase();
            editorRef.current?.execCommand(`inline-${level}`);
        } else if (cmd === 'insertHorizontalRule') {
            document.execCommand(cmd, false);
        } else {
            editorRef.current?.execCommand(cmd);
        }
    }

    const handleMouseDown = (e: React.MouseEvent, cmd: string, val?: string) => {
        e.preventDefault();
        handleCommand(cmd, val);
    };

    const getBtnClass = (isActive: boolean) => 
        `p-1.5 rounded transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`;

    return (
        <div className={`rounded-2xl p-6 shadow-lg transition-all ${isReadingMode || isReadOnly ? 'bg-[#1a1a1a]/50 border border-white/5 opacity-80' : 'bg-[#1a1a1a] border border-white/10'}`}>
            <div className="flex justify-between mb-4">
                <span className="text-sm font-bold text-blue-400">Question {questionNumber}</span>
                <span className="text-xs font-bold text-gray-500">{q.points} pts</span>
            </div>
            
            <div 
                className="text-lg font-medium mb-4 leading-relaxed rich-text-content select-none"
                dangerouslySetInnerHTML={{ __html: renderedText }}
            />

            {renderedNotes && (
                <div 
                    className="text-sm text-gray-400 mb-6 leading-relaxed rich-text-content select-none bg-black/20 p-4 rounded-lg border border-white/5"
                    dangerouslySetInnerHTML={{ __html: renderedNotes }}
                />
            )}

            {q.type === 'mcq' && (
                <div className="space-y-3">
                    {q.options?.map((opt: string, optIdx: number) => (
                        <label 
                            key={optIdx} 
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                isReadingMode || isReadOnly ? 'cursor-not-allowed opacity-50 bg-[#111] border-transparent' : 
                                (answer === optIdx.toString() ? 'bg-blue-600/20 border-blue-500 cursor-pointer' : 'bg-[#111] border-white/10 hover:border-white/30 cursor-pointer')
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answer === optIdx.toString() ? 'border-blue-500' : 'border-gray-500'}`}>
                                {answer === optIdx.toString() && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                            <input 
                                type="radio" 
                                name={q.id} 
                                value={optIdx} 
                                checked={answer === optIdx.toString()}
                                onChange={() => onAnswerChange(q.id, optIdx.toString())}
                                className="hidden"
                                disabled={isReadingMode || isReadOnly}
                            />
                            <div className="text-gray-200 select-none" dangerouslySetInnerHTML={{__html: parseMath(opt)}} />
                        </label>
                    ))}
                </div>
            )}

            {q.type === 'essay' && (
                <>
                    {allowDrawing && (
                        <div className="mb-4">
                            {isDrawingVisible ? (
                                <div className="relative group border border-white/10 rounded-xl overflow-hidden">
                                    <img src={drawingUrl} alt="Drawing Answer" className="w-full h-auto max-h-[400px] object-contain bg-white" />
                                    {!isReadingMode && !isReadOnly && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button 
                                                onClick={() => setActiveDrawingQId(q.id)}
                                                className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                                            >
                                                <PenTool size={16}/> Edit Drawing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-end mb-2">
                                    <button 
                                        onClick={() => setActiveDrawingQId(q.id)}
                                        disabled={isReadingMode || isReadOnly}
                                        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-white bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <PenTool size={14} /> Draw Answer
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isTextVisible && (
                        <div className={`relative bg-[#111] border rounded-xl focus-within:border-blue-500 transition-colors ${isReadingMode || isReadOnly ? 'border-transparent opacity-70' : 'border-white/10'}`}>
                            {!(isReadingMode || isReadOnly) && (
                                <div className="flex items-center gap-1 p-1 border-b border-white/10 bg-[#111] sticky top-0 z-10 rounded-t-xl overflow-x-auto no-scrollbar">
                                    <button onMouseDown={e => handleMouseDown(e, 'formatBlock', 'H1')} className={getBtnClass(activeFormats.h1)} title="Heading 1"><Heading1 size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'formatBlock', 'H2')} className={getBtnClass(activeFormats.h2)} title="Heading 2"><Heading2 size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'formatBlock', 'H3')} className={getBtnClass(activeFormats.h3)} title="Heading 3"><Heading3 size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'formatBlock', 'H4')} className={getBtnClass(activeFormats.h4)} title="Heading 4"><Heading4 size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => handleMouseDown(e, 'bold')} className={getBtnClass(activeFormats.bold)} title="Bold (Ctrl+B)"><Bold size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'italic')} className={getBtnClass(activeFormats.italic)} title="Italic (Ctrl+I)"><Italic size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'underline')} className={getBtnClass(activeFormats.underline)} title="Underline (Ctrl+U)"><Underline size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => handleMouseDown(e, 'subscript')} className={getBtnClass(activeFormats.subscript)} title="Subscript"><Subscript size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'superscript')} className={getBtnClass(activeFormats.superscript)} title="Superscript"><Superscript size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => handleMouseDown(e, 'insertUnorderedList')} className={getBtnClass(activeFormats.list)} title="Bulleted List"><List size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'insertOrderedList')} className={getBtnClass(activeFormats.orderedList)} title="Numbered List"><ListOrdered size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <button onMouseDown={e => handleMouseDown(e, 'insertHorizontalRule')} className={getBtnClass(activeFormats.strikeThrough)} title="Line"><Minus size={14}/></button>
                                    <button onMouseDown={e => handleMouseDown(e, 'formatBlock', 'box')} className={getBtnClass(activeFormats.box)} title="Box"><Square size={14}/></button>
                                </div>
                            )}
                            <DebouncedRichTextEditor 
                                ref={editorRef}
                                value={textValue}
                                onChange={handleTextChange}
                                onFormatChange={(formats: FormatState) => setActiveFormats({ ...formats, box: getActiveFormat('', ['SPAN.box']) })}
                                imageUploadDisabled={!config.allowStudentImages}
                                readOnly={isReadingMode || isReadOnly}
                                className={`w-full bg-transparent p-4 text-white outline-none min-h-[150px] leading-relaxed`}
                                placeholder={isReadingMode ? "Reading time active..." : (isReadOnly ? "This question is locked for revision." : "Type your answer here...")}
                            />
                            {isSpamming && (
                                <div className="absolute bottom-4 right-4 text-xs font-bold text-red-500 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded">
                                    <ShieldAlert size={12} /> Spam Detected
                                </div>
                            )}
                        </div>
                    )}
                    
                    {q.minWords && q.minWords > 0 && isTextAnswer && (
                        <div className={`flex justify-end mt-2 text-xs font-bold ${isUnderWordLimit ? 'text-amber-500' : 'text-green-500'}`}>
                            {wc} / {q.minWords} valid words {isUnderWordLimit && '(Under Limit)'}
                        </div>
                    )}
                </>
            )}
        </div>
    );
});