
import React from 'react';
import { MessageCircle, Heart, ShieldAlert, Reply, Move, EyeOff, UserX, Ghost, Link, Kanban, CopyX, CameraOff, Clock } from 'lucide-react';
import { Board } from '../../types';

interface EngagementSectionProps {
    board: Board;
    onUpdate: (updates: Partial<Board>) => void;
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({ board, onUpdate }) => {
    const isColumnFormat = board.format === 'columns';
    
    const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        const minutes = value === '' ? undefined : parseInt(value, 10);
        onUpdate({ settings: { ...(board.settings || {}), editTimeLimit: minutes } });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Engagement</h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 space-y-4">
                
                {/* Comments */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><MessageCircle size={18}/></div>
                        <div>
                            <div className="text-sm font-bold text-gray-200">Comments</div>
                            <div className="text-xs text-gray-500">Allow users to comment on posts</div>
                        </div>
                    </div>
                    <div 
                        onClick={() => onUpdate({ settings: { ...(board.settings || {}), commentsEnabled: !board.settings?.commentsEnabled } }) }
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.settings?.commentsEnabled ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.settings?.commentsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {/* Threaded Replies */}
                {board.settings?.commentsEnabled && (
                    <div className="flex items-center justify-between pl-4 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-300 rounded-lg"><Reply size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-gray-200">Replies</div>
                                <div className="text-xs text-gray-500">Allow commenting in a comment</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ settings: { ...(board.settings || {}), repliesEnabled: board.settings?.repliesEnabled === false ? true : false } })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.settings?.repliesEnabled !== false ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.settings?.repliesEnabled !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )}

                {/* Reactions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><Heart size={18}/></div>
                        <div>
                            <div className="text-sm font-bold text-gray-200">Reactions</div>
                            <div className="text-xs text-gray-500">Allow users to like posts</div>
                        </div>
                    </div>
                    <div 
                        onClick={() => onUpdate({ settings: { ...(board.settings || {}), reactionsEnabled: !board.settings?.reactionsEnabled } })}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.settings?.reactionsEnabled ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.settings?.reactionsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                <div className="h-px bg-white/5 my-2"></div>
                
                {/* Edit Time Limit */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Clock size={18}/></div>
                        <div>
                            <div className="text-sm font-bold text-gray-200">Edit Time Limit</div>
                            <div className="text-xs text-gray-500">Limit post editing time (in minutes)</div>
                        </div>
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={board.settings?.editTimeLimit ?? ''}
                        onChange={handleTimeLimitChange}
                        placeholder="Off"
                        className="bg-white/10 rounded-md px-2 py-1 text-sm w-24 text-center border-white/10 border"
                    />
                </div>
                
                <div className="h-px bg-white/5 my-2"></div>


                {/* Student Rearrange Posts */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Move size={18}/></div>
                        <div>
                            <div className="text-sm font-bold text-gray-200">Student Rearrange Posts</div>
                            <div className="text-xs text-gray-500">Allow students to move/order posts</div>
                        </div>
                    </div>
                    <div 
                        onClick={() => onUpdate({ settings: { ...(board.settings || {}), studentsCanDrag: !board.settings?.studentsCanDrag } })}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.settings?.studentsCanDrag ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.settings?.studentsCanDrag ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {/* Student Rearrange Columns (Only for Column View) */}
                {isColumnFormat && (
                    <div className="flex items-center justify-between pl-4 border-t border-purple-500/10 pt-2 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg"><Kanban size={14}/></div>
                            <div>
                                <div className="text-xs font-bold text-gray-300">Rearrange Columns</div>
                                <div className="text-[10px] text-gray-500">Allow students to reorder columns</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ settings: { ...(board.settings || {}), studentsCanDragColumns: !board.settings?.studentsCanDragColumns } })}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${board.settings?.studentsCanDragColumns ? 'bg-purple-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${board.settings?.studentsCanDragColumns ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )}

                {/* ANTI-CHEATING GROUP */}
                <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-3 space-y-3 mt-4">
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert size={12} /> Anti-Cheating & Integrity
                    </h4>

                    {/* Disable Paste (Input) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><ShieldAlert size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-gray-200">Disable Copy/Paste Input</div>
                                <div className="text-xs text-gray-500">Prevent pasting into notes/comments</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ settings: { ...(board.settings || {}), disablePaste: !board.disablePaste } })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.disablePaste ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.disablePaste ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    {/* Allow Links Exception */}
                    {board.disablePaste && (
                        <div className="flex items-center justify-between pl-4 animate-in fade-in slide-in-from-top-1 border-t border-red-500/10 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg"><Link size={14}/></div>
                                <div>
                                    <div className="text-xs font-bold text-gray-300">Allow Links</div>
                                    <div className="text-[10px] text-gray-500">Permit pasting valid URLs</div>
                                </div>
                            </div>
                            <div 
                                onClick={() => onUpdate({ settings: { ...(board.settings || {}), allowLinks: !board.settings?.allowLinks } })}
                                className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${board.settings?.allowLinks ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${board.settings?.allowLinks ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    )}

                    {/* Disable Copy (Output) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><CopyX size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-gray-200">Prevent Copying Text</div>
                                <div className="text-xs text-gray-500">Stop students from copying questions/notes</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ settings: { ...(board.settings || {}), disableCopy: !board.disableCopy } })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.disableCopy ? 'bg-orange-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.disableCopy ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    {/* Anti-Screenshot / Watermark */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><CameraOff size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-gray-200">Anti-Screenshot Mode</div>
                                <div className="text-xs text-gray-500">Watermark screen & blur on focus loss</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ blockScreenshots: !board.blockScreenshots })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.blockScreenshots ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.blockScreenshots ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    {/* Focus Guard Sub-toggle */}
                    {board.blockScreenshots && (
                        <div className="flex items-center justify-between pl-4 animate-in fade-in slide-in-from-top-1 border-t border-yellow-500/10 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg"><Clock size={14}/></div>
                                <div>
                                    <div className="text-xs font-bold text-gray-300">Stay Focused Guard</div>
                                    <div className="text-[10px] text-gray-500">Blur screen when student switches tabs</div>
                                </div>
                            </div>
                            <div 
                                onClick={() => onUpdate({ disableFocusGuard: !board.disableFocusGuard })}
                                className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${!board.disableFocusGuard ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${!board.disableFocusGuard ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ANONYMITY MODE */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-500/20 text-gray-200 rounded-lg"><Ghost size={18}/></div>
                        <div>
                            <div className="text-sm font-bold text-gray-200">Anonymous Mode</div>
                            <div className="text-xs text-gray-500">Hide student names from peers</div>
                        </div>
                    </div>
                    <div 
                        onClick={() => onUpdate({ settings: { ...(board.settings || {}), isAnonymous: !board.settings?.isAnonymous } })}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.settings?.isAnonymous ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.settings?.isAnonymous ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {/* Blur Feature Group */}
                <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-3 space-y-3">
                    {/* Main Blur Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><EyeOff size={18}/></div>
                            <div>
                                <div className="text-sm font-bold text-gray-200">Blur Other Posts</div>
                                <div className="text-xs text-gray-500">Students cannot see each other's posts</div>
                            </div>
                        </div>
                        <div 
                            onClick={() => onUpdate({ settings: { ...(board.settings || {}), blurOtherPosts: !board.blurOtherPosts } })}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${board.blurOtherPosts ? 'bg-indigo-500' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${board.blurOtherPosts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    {/* Sub-toggle: Blur Teacher Posts */}
                    {board.blurOtherPosts && (
                        <div className="flex items-center justify-between pl-4 border-t border-indigo-500/10 pt-2 animate-in fade-in">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><UserX size={14}/></div>
                                <div>
                                    <div className="text-xs font-bold text-gray-300">Also Blur Teacher?</div>
                                    <div className="text-[10px] text-gray-500">Hide teacher posts from students</div>
                                </div>
                            </div>
                            <div 
                                onClick={() => onUpdate({ settings: { ...(board.settings || {}), blurTeacherPosts: !board.blurTeacherPosts } })}
                                className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${board.blurTeacherPosts ? 'bg-indigo-500' : 'bg-white/20 hover:bg-white/30'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${board.blurTeacherPosts ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
