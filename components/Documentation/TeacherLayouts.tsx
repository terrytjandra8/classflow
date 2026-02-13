
import React from 'react';
import { Layout, GripVertical, Kanban, Map, MousePointer2, AlignLeft } from 'lucide-react';

export const TeacherLayouts: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Layout size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Board Layouts</h2>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-gray-300 leading-relaxed">
            <p>ClassBoard offers flexible layouts for different teaching needs:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center gap-2 font-bold mb-1 text-slate-800 dark:text-white"><Kanban size={16}/> Columns</div>
                    <p className="text-xs">Organize content into categories. Ideal for "Kanban", "Pros & Cons", or "KWL Charts".</p>
                    <div className="mt-2 text-xs bg-blue-500/10 text-blue-600 p-2 rounded flex gap-2">
                        <GripVertical size={14} className="shrink-0" />
                        <span><strong>New:</strong> Use the drag handle next to the column title to reorder columns.</span>
                    </div>
                </li>
                <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center gap-2 font-bold mb-1 text-slate-800 dark:text-white"><Layout size={16}/> Wall</div>
                    <p className="text-xs">A classic brick-like layout. Great for brainstorming and general posts. Optimizes space automatically.</p>
                </li>
                <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center gap-2 font-bold mb-1 text-slate-800 dark:text-white"><MousePointer2 size={16}/> Canvas</div>
                    <p className="text-xs">Freeform space. Students can drag notes anywhere and connect them with lines. Perfect for mind mapping.</p>
                </li>
                <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center gap-2 font-bold mb-1 text-slate-800 dark:text-white"><AlignLeft size={16}/> Stream</div>
                    <p className="text-xs">Vertical feed, similar to social media. Good for chronological discussions or assignments.</p>
                </li>
            </ul>
        </div>
    </div>
);
