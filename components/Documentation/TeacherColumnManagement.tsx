
import React from 'react';
import { 
    Plus, GripVertical, Lock, Unlock, MessageSquare, Reply, 
    EyeOff, Ghost, VenetianMask, Move 
} from 'lucide-react';

export const TeacherColumnManagement: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <GripVertical size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Managing Columns & Content</h2>
        </div>

        <p className="text-slate-600 dark:text-gray-300 mb-8 leading-relaxed">
            In <strong>Columns</strong> mode, you have granular control. You can lock specific columns while leaving others open, or hide sensitive topics until you are ready to reveal them.
        </p>

        <div className="space-y-8">
            
            {/* Section 1: Basic Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <Plus size={16} className="text-green-500"/> Adding Columns
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-gray-400">
                        <li>Scroll to the far right of your board.</li>
                        <li>Click the large dotted button labeled <strong>Add Group / Section</strong>.</li>
                        <li>Alternatively, you can insert a column between two others by clicking the small <span className="bg-blue-500 text-white rounded-full px-1 text-[8px]">+</span> line that appears when you hover between them.</li>
                    </ol>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <GripVertical size={16} className="text-orange-500"/> Rearranging
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-gray-400">
                        <li>Locate the <strong>Drag Handle</strong> <GripVertical size={12} className="inline text-gray-400"/> to the left of the column title.</li>
                        <li>Click and hold the handle.</li>
                        <li>Drag the column left or right to its new position.</li>
                    </ol>
                </div>
            </div>

            {/* Section 2: Per-Column Toggles */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/5">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Per-Column Controls</h3>
                </div>
                <div className="p-5">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-500/20 mb-6 text-xs text-blue-800 dark:text-blue-300">
                        <strong>How to access:</strong> Hover your mouse over the column header (the title area). A row of small control icons will appear on the right side.
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-500 w-fit rounded-lg"><Lock size={16}/></div>
                            <span className="text-xs font-bold">Lock / Unlock</span>
                            <p className="text-[10px] text-gray-500">Stops students from adding new posts to this column only.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-500 w-fit rounded-lg"><VenetianMask size={16}/></div>
                            <span className="text-xs font-bold">Blur Content</span>
                            <p className="text-[10px] text-gray-500">Hides the text of cards in this column. Good for hiding answers or spoilers.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-500 w-fit rounded-lg"><EyeOff size={16}/></div>
                            <span className="text-xs font-bold">Hide Column</span>
                            <p className="text-[10px] text-gray-500">Completely removes the column from student view. Useful for prep.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-500 w-fit rounded-lg"><Ghost size={16}/></div>
                            <span className="text-xs font-bold">Anonymous</span>
                            <p className="text-[10px] text-gray-500">Hides student names for posts in this column only.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-500 w-fit rounded-lg"><MessageSquare size={16}/></div>
                            <span className="text-xs font-bold">Comments</span>
                            <p className="text-[10px] text-gray-500">Toggle ability to comment on notes in this column.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-500 w-fit rounded-lg"><Reply size={16}/></div>
                            <span className="text-xs font-bold">Replies</span>
                            <p className="text-[10px] text-gray-500">Toggle threaded replies.</p>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-500 w-fit rounded-lg"><Move size={16}/></div>
                            <span className="text-xs font-bold">Student Drag</span>
                            <p className="text-[10px] text-gray-500">Allow students to reorder or move cards within this column.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
