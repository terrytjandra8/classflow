
import React from 'react';
import { Code, Trash2, Upload, AlertTriangle, ShieldAlert, Check, Eye } from 'lucide-react';
import { parseMath } from '../../../../../../utils/mappers';
import { countQualityWords } from '../../../../../../utils/validation';

interface StudentAnswerProps {
    qId: string;
    answer: string;
    question: any; // Consider creating a more specific type
    rawView: boolean;
    setRawView: (qId: string, value: boolean) => void;
    setLightboxImageUrl: (url: string) => void;
    handleClearAnswer: (qId: string) => void;
    handleStudentAnswerImageUpload: (qId: string) => void;
}

const AnswerToolbar: React.FC<Pick<StudentAnswerProps, 'qId' | 'rawView' | 'setRawView' | 'handleClearAnswer' | 'handleStudentAnswerImageUpload'> & {type: string}> = 
({ qId, rawView, setRawView, handleClearAnswer, handleStudentAnswerImageUpload, type }) => {
    if (type !== 'essay') return null;

    return (
        <div className="flex items-center gap-2">
            <button onClick={() => handleStudentAnswerImageUpload(qId)} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"><Upload size={12}/> Upload</button>
            <button onClick={() => setRawView(qId, !rawView)} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"><Code size={12}/> {rawView ? 'Rich View' : 'Raw HTML'}</button>
            <button onClick={() => handleClearAnswer(qId)} className="text-xs flex items-center gap-1.5 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={12}/> Clear</button>
        </div>
    );
};

const WordCountIndicator: React.FC<{ answer: string; minWords?: number }> = ({ answer, minWords }) => {
    const wordCount = countQualityWords(answer);
    const rawWordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    const isSpamming = (rawWordCount - wordCount > 5);
    const isUnderWordLimit = minWords && wordCount < minWords;

    if (!isSpamming && !isUnderWordLimit) {
        return <div className="text-right text-xs mt-1.5 text-gray-400">{wordCount} / {minWords || '-'} words</div>;
    }

    return (
        <div className={`text-right text-xs mt-1.5 font-bold flex items-center justify-end gap-1.5 ${isUnderWordLimit || isSpamming ? 'text-amber-500' : 'text-gray-400'}`}>
            {isSpamming && <><ShieldAlert size={14} /><span>Spam Detected</span></>}
            {isUnderWordLimit && !isSpamming && <><AlertTriangle size={14} /><span>Under Word Limit</span></>}
            <span className="ml-2">{wordCount} / {minWords || '-'} words</span>
        </div>
    );
};

export const StudentAnswer: React.FC<StudentAnswerProps> = ({
    qId, answer, question, rawView, setRawView, setLightboxImageUrl, handleClearAnswer, handleStudentAnswerImageUpload
}) => {
    const renderAnswerContent = () => {
        if (question.type === 'mcq') {
            return (
                <div className="space-y-2">{
                    question.options?.map((opt: string, optIdx: number) => { 
                        const isSelected = answer === optIdx.toString();
                        const isCorrectOpt = question.correctAnswer === optIdx.toString();
                        let c = 'border-white/10 bg-black/20';
                        if (isSelected && isCorrectOpt) c = 'border-green-500 bg-green-900/30 text-green-200';
                        else if (isSelected && !isCorrectOpt) c = 'border-red-500 bg-red-900/30 text-red-200';
                        else if (isCorrectOpt) c = 'border-green-500/50';
                        
                        return (
                            <div key={optIdx} className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${c}`}>
                                <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-500'}`}>
                                    {isSelected && <Check size={10} className="text-white"/>}
                                </div>
                                <div className="text-sm rich-text-content" dangerouslySetInnerHTML={{ __html: parseMath(opt) }} />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Essay and other text-based answers
        const isImageURL = answer.startsWith('http') && !answer.includes('<');
        const isImageHTML = answer.includes('<img');

        if (rawView) {
            return <pre className="bg-black/50 p-3 rounded-lg text-xs whitespace-pre-wrap break-all border border-white/10"><code>{answer || 'No answer submitted.'}</code></pre>;
        }

        if (isImageURL || isImageHTML) {
            const imageUrl = isImageURL ? answer : (answer.match(/src="(.*?)"/) || [])[1];
            return (
                <div 
                    className="bg-black/30 p-2 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-colors relative group"
                    onClick={() => imageUrl && setLightboxImageUrl(imageUrl)}
                >
                    <div className="w-full rich-text-content" dangerouslySetInnerHTML={{ __html: isImageURL ? `<img src="${answer}" class="max-w-full w-full rounded-md bg-white" alt="Student submission"/>` : answer }} />
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={24} className="text-white" />
                    </div>
                </div>
            );
        }

        return (
            <div 
                className="bg-black/30 p-3 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-white/10 rich-text-content"
                dangerouslySetInnerHTML={{ __html: parseMath(answer || '<p class="text-gray-500">No answer submitted.</p>') }} 
            />
        );
    };

    const isTextAnswer = question.type === 'essay' && !answer.startsWith('http') && !answer.includes('<img');

    return (
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-400">Student's Answer</h4>
                <AnswerToolbar qId={qId} rawView={rawView} setRawView={(id, val) => setRawView(prev => ({...prev, [id]: val}))} handleClearAnswer={handleClearAnswer} handleStudentAnswerImageUpload={handleStudentAnswerImageUpload} type={question.type} />
            </div>
            {renderAnswerContent()}
            {isTextAnswer && <WordCountIndicator answer={answer} minWords={question.minWords} />}
        </div>
    );
};
