
import React, { useState, useRef } from 'react';
import { LessonStep, LessonStepType } from '../../types';
import { FileText, Video, Globe, BarChart2, Image as ImageIcon, Layout, MousePointer2, Trash2, Plus, X, Presentation, Cast, ZoomIn, ChevronUp, ChevronDown } from 'lucide-react';

interface SidebarProps {
    steps: LessonStep[];
    currentIndex: number;
    onSelectStep: (index: number) => void;
    onUpdateSteps: (steps: LessonStep[]) => void;
    onAddStep: (step: LessonStep) => void;
    width: number;
    onResize: (newWidth: number) => void;
}

const STEP_TYPES: { id: LessonStepType; label: string; icon: any }[] = [
    { id: 'canva', label: 'Canva', icon: Presentation },
    { id: 'google_slide', label: 'G-Slide', icon: Cast },
    { id: 'board', label: 'Board', icon: Layout },
    { id: 'canvas', label: 'Canvas', icon: MousePointer2 },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'poll', label: 'Poll', icon: BarChart2 },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'website', label: 'Web', icon: Globe },
];

export const LessonSidebar: React.FC<SidebarProps> = ({ steps, currentIndex, onSelectStep, onUpdateSteps, onAddStep, width, onResize }) => {
    const currentStep = steps[currentIndex];
    const [rowHeight, setRowHeight] = useState(60); 
    const [propsHeight, setPropsHeight] = useState(300);
    const isResizingWidth = useRef(false);
    const isResizingHeight = useRef(false);

    const addStep = (type: LessonStepType) => {
        const newStep: LessonStep = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}`,
            content: '',
            options: type === 'poll' ? ['Yes', 'No'] : undefined,
            boardSettings: type === 'board' ? { format: 'wall', allow_posting: true } : undefined
        };
        onAddStep(newStep);
    };

    const updateCurrentStep = (updates: Partial<LessonStep>) => {
        const newSteps = [...steps];
        newSteps[currentIndex] = { ...newSteps[currentIndex], ...updates };
        onUpdateSteps(newSteps);
    };

    const updateBoardSettings = (updates: any) => {
        const currentSettings = currentStep.boardSettings || { format: 'wall', allow_posting: true };
        updateCurrentStep({
            boardSettings: { ...currentSettings, ...updates }
        });
    };

    const deleteStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index);
        onUpdateSteps(newSteps);
        if (index === currentIndex && newSteps.length > 0) {
            onSelectStep(Math.max(0, index - 1));
        } else if (index < currentIndex) {
            onSelectStep(currentIndex - 1);
        }
    };

    const startResizingWidth = (e: React.MouseEvent) => {
        isResizingWidth.current = true;
        document.addEventListener('mousemove', handleMouseMoveWidth);
        document.addEventListener('mouseup', stopResizingWidth);
    };

    const handleMouseMoveWidth = (e: MouseEvent) => {
        if (!isResizingWidth.current) return;
        const newWidth = Math.max(250, Math.min(600, e.clientX));
        onResize(newWidth);
    };

    const stopResizingWidth = () => {
        isResizingWidth.current = false;
        document.removeEventListener('mousemove', handleMouseMoveWidth);
        document.removeEventListener('mouseup', stopResizingWidth);
    };

    const startResizingHeight = (e: React.MouseEvent) => {
        isResizingHeight.current = true;
        document.body.style.cursor = 'row-resize';
        document.addEventListener('mousemove', handleMouseMoveHeight);
        document.addEventListener('mouseup', stopResizingHeight);
    };

    const handleMouseMoveHeight = (e: MouseEvent) => {
        if (!isResizingHeight.current) return;
        const containerHeight = window.innerHeight;
        const newHeight = Math.max(150, Math.min(containerHeight - 200, containerHeight - e.clientY));
        setPropsHeight(newHeight);
    };

    const stopResizingHeight = () => {
        isResizingHeight.current = false;
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMoveHeight);
        document.removeEventListener('mouseup', stopResizingHeight);
    };

    return (
        <div className="flex h-full bg-[#161616] relative border-r border-white/10" style={{ width }}>
            
            <div className="flex flex-col flex-1 min-w-0 h-full">
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a] shrink-0">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Slides ({steps.length})</span>
                    <div className="flex items-center gap-2">
                        <ZoomIn size={12} className="text-gray-500" />
                        <input 
                            type="range" 
                            min="40" 
                            max="120" 
                            value={rowHeight} 
                            onChange={(e) => setRowHeight(parseInt(e.target.value))}
                            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-0">
                    {steps.map((step, idx) => {
                        const TypeIcon = STEP_TYPES.find(t => t.id === step.type)?.icon || FileText;
                        return (
                            <div 
                                key={step.id} 
                                onClick={() => onSelectStep(idx)}
                                className={`px-3 rounded-lg flex items-center gap-3 cursor-pointer group border transition-all ${idx === currentIndex ? 'bg-blue-600/20 border-blue-500/50' : 'bg-[#1a1a1a] border-transparent hover:bg-white/5'}`}
                                style={{ height: `${rowHeight}px` }}
                            >
                                <span className="text-[10px] font-mono text-gray-500 w-4">{idx + 1}</span>
                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${idx === currentIndex ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                                    <TypeIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-white">{step.title}</p>
                                    <p className="text-[10px] text-gray-500 truncate capitalize">{step.type.replace('_', ' ')}</p>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteStep(idx); }} 
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 p-2"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {currentStep && (
                    <>
                        <div 
                            className="h-1 bg-[#2a2a2a] hover:bg-blue-500 cursor-row-resize transition-colors w-full shrink-0 z-10"
                            onMouseDown={startResizingHeight}
                        ></div>

                        <div className="flex flex-col border-t border-white/10 bg-[#1a1a1a] shrink-0" style={{ height: propsHeight }}>
                            <div className="p-2 px-3 border-b border-white/10 bg-[#222] flex justify-between items-center shrink-0">
                                <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Properties</h3>
                                <div className="flex gap-1">
                                    <button onClick={() => setPropsHeight(h => Math.min(h + 50, window.innerHeight - 200))} className="p-1 hover:bg-white/10 rounded"><ChevronUp size={12}/></button>
                                    <button onClick={() => setPropsHeight(h => Math.max(h - 50, 100))} className="p-1 hover:bg-white/10 rounded"><ChevronDown size={12}/></button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-1" key={currentStep.id + '_title'}>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Title</label>
                                    <input 
                                        defaultValue={currentStep.title} 
                                        onBlur={(e) => updateCurrentStep({ title: e.target.value })}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                {(currentStep.type === 'video' || currentStep.type === 'image' || currentStep.type === 'website') && (
                                    <div className="space-y-1" key={currentStep.id + '_url'}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500">URL</label>
                                        <input 
                                            defaultValue={currentStep.url || ''} 
                                            onBlur={(e) => updateCurrentStep({ url: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                {currentStep.type === 'board' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-2 bg-[#111] rounded border border-white/10">
                                            <span className="text-xs font-bold text-gray-300">Allow Posting</span>
                                            <div 
                                                onClick={() => updateBoardSettings({ allow_posting: !currentStep.boardSettings?.allow_posting })}
                                                className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${currentStep.boardSettings?.allow_posting ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${currentStep.boardSettings?.allow_posting ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep.type === 'canva' && (
                                    <div className="space-y-3" key={currentStep.id + '_canva'}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                            <Presentation size={10} /> Canva Public Link
                                        </label>
                                        <input 
                                            defaultValue={currentStep.url || ''} 
                                            onBlur={(e) => updateCurrentStep({ url: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="Paste link..."
                                        />
                                        <p className="text-[9px] text-gray-500">Paste the "Public View Link" from Canva share settings.</p>
                                    </div>
                                )}

                                {currentStep.type === 'google_slide' && (
                                    <div className="space-y-3" key={currentStep.id + '_gslide'}>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                            <Cast size={10} /> Google Slides Link
                                        </label>
                                        <input 
                                            defaultValue={currentStep.url || ''} 
                                            onBlur={(e) => updateCurrentStep({ url: e.target.value })}
                                            className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                            placeholder="Paste Link..."
                                        />
                                        <p className="text-[9px] text-gray-500">Use "Publish to Web" link for best results.</p>
                                    </div>
                                )}

                                {currentStep.type === 'poll' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Options</label>
                                        {currentStep.options?.map((opt, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input 
                                                    defaultValue={opt}
                                                    onBlur={(e) => {
                                                        const newOpts = [...(currentStep.options || [])];
                                                        newOpts[i] = e.target.value;
                                                        updateCurrentStep({ options: newOpts });
                                                    }}
                                                    className="flex-1 bg-[#111] border border-white/10 rounded p-1.5 text-xs text-white"
                                                />
                                                <button onClick={() => {
                                                    const newOpts = currentStep.options?.filter((_, idx) => idx !== i);
                                                    updateCurrentStep({ options: newOpts });
                                                }}><X size={14} className="text-gray-500 hover:text-red-500"/></button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => updateCurrentStep({ options: [...(currentStep.options || []), `Option ${currentStep.options?.length ? currentStep.options.length + 1 : 1}`] })}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                                        >
                                            <Plus size={12}/> Add Option
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="p-3 bg-[#1a1a1a] border-t border-white/10 shrink-0">
                    <div className="grid grid-cols-4 gap-2">
                        {STEP_TYPES.map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => addStep(t.id)}
                                className="flex flex-col items-center justify-center p-2 bg-[#222] hover:bg-[#333] rounded-lg transition-colors group"
                                title={t.label}
                            >
                                <t.icon size={18} className="text-gray-400 group-hover:text-white mb-1" />
                                <span className="text-[9px] text-gray-500 group-hover:text-gray-300">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div 
                className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-50 transition-colors flex items-center justify-center group"
                onMouseDown={startResizingWidth}
            >
                <div className="h-8 w-1 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100"></div>
            </div>
        </div>
    );
};
