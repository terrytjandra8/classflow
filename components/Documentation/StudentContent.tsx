
import React from 'react';
import { PenTool, Image, Link, Palette, PlayCircle } from 'lucide-react';

export const StudentContent: React.FC = () => (
    <div className="mb-12">
        <div className="flex gap-4 mb-8">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Creating Rich Posts</h3>
                <p className="text-slate-600 dark:text-gray-300 mb-4">
                    Click the <strong className="text-pink-500">+ (Plus)</strong> button to create a post. You can add more than just text:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><Image size={16}/> Visuals</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload images, draw sketches directly on the board, or search for GIFs to express yourself.</p>
                    </div>
                    
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><Link size={16}/> Embeds</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Paste links to automatically embed content.</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-bold border border-red-500/20">YouTube</span>
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-[10px] font-bold border border-blue-500/20">Behance</span>
                            <span className="px-2 py-1 bg-sky-500/10 text-sky-500 rounded text-[10px] font-bold border border-sky-500/20">Vimeo</span>
                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded text-[10px] font-bold border border-indigo-500/20">ArtStation</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>Note:</strong> Adaptive colors will ensure your text is always readable, whether your note is white, yellow, or pink!
                </div>
            </div>
        </div>
    </div>
);
