
import React from 'react';
import { User, Hash, MessageSquare, Heart } from 'lucide-react';

export const StudentBasics: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex gap-4 mb-8">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Joining a Class</h3>
                <div className="text-slate-600 dark:text-gray-300 leading-relaxed space-y-2">
                    <p>You can join a board in two ways:</p>
                    <ul className="list-disc pl-5 marker:text-blue-500">
                        <li><strong>Class Code:</strong> Click the "Join a Class" button on your dashboard and enter the 6-character code (e.g., <code className="bg-black/10 dark:bg-white/10 px-1 rounded">X7Y2Z9</code>) provided by your teacher.</li>
                        <li><strong>Dashboard:</strong> If your teacher assigned you to a class, the boards will automatically appear in your "My Classes" list.</li>
                    </ul>
                </div>
            </div>
        </div>

        <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Interacting</h3>
                <div className="text-slate-600 dark:text-gray-300 leading-relaxed space-y-2">
                    <p>ClassBoard is collaborative! You can:</p>
                    <ul className="list-disc pl-5 marker:text-blue-500">
                        <li><strong>Comment:</strong> Click the <MessageSquare size={12} className="inline"/> icon on any post to leave a comment or reply to a thread.</li>
                        <li><strong>Like:</strong> Show appreciation by clicking the <Heart size={12} className="inline"/> heart icon.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);
