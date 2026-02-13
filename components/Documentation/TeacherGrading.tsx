
import React from 'react';
import { Award, Sliders, Hash, Check, X, Users, BookOpen } from 'lucide-react';

export const TeacherGrading: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <Award size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grading & Assessment</h2>
        </div>

        <p className="text-slate-600 dark:text-gray-300 mb-8 leading-relaxed">
            ClassBoard includes a built-in grading system that links directly to your class roster. 
            You can grade participation right from the board.
        </p>

        <div className="space-y-8">
            
            {/* Step 1: Setup */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">Step 1</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Link a Class</h3>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                        Before you can grade, the board needs to know which students are supposed to be here.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 dark:text-gray-300 marker:font-bold marker:text-gray-400">
                        <li>Open the <strong>Settings</strong> menu (top right).</li>
                        <li>Scroll down to the <strong>Grading & Assessment</strong> section.</li>
                        <li>Find the <strong>"Assigned Class"</strong> dropdown.</li>
                        <li>Select the class group (e.g., "History 101") that this board belongs to.</li>
                    </ol>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex gap-3 items-start">
                        <Users size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>Note:</strong> This will automatically populate the "Student Scores" list with every student in that class, even if they haven't posted yet.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 2: Configuration */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">Step 2</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Configure Scale</h3>
                </div>
                <div className="p-5 space-y-6">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                        Choose how you want to score this activity. You can change this at any time.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash size={16} className="text-blue-500"/>
                                <span className="font-bold text-sm">Numeric Mode</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">Best for assignments or quizzes.</p>
                            <ul className="text-xs space-y-1 text-slate-600 dark:text-gray-400 list-disc pl-4">
                                <li>Set a <strong>Max Score</strong> (e.g., 100, 10, or 5).</li>
                                <li>Type exact numbers for each student.</li>
                            </ul>
                        </div>

                        <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Check size={16} className="text-purple-500"/>
                                <span className="font-bold text-sm">Binary Mode</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">Best for quick participation checks.</p>
                            <ul className="text-xs space-y-1 text-slate-600 dark:text-gray-400 list-disc pl-4">
                                <li><strong>Pass / Check:</strong> Gives full points.</li>
                                <li><strong>Fail / X:</strong> Gives zero points.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 3: Grading */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">Step 3</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Enter Grades</h3>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">A</div>
                            <div>
                                <strong className="text-sm">In Board Settings (Mini-Gradebook)</strong>
                                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                                    While viewing the board, stay in the <strong>Grading</strong> settings tab. You will see a list of students.
                                    <br/>
                                    • If Numeric: Type the score in the box.
                                    <br/>
                                    • If Binary: Click the <span className="inline-block bg-green-500 text-white rounded px-1 text-[9px]"><Check size={8} className="inline"/></span> or <span className="inline-block bg-red-500 text-white rounded px-1 text-[9px]"><X size={8} className="inline"/></span> buttons.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">B</div>
                            <div>
                                <strong className="text-sm">In Admin Dashboard (Full Gradebook)</strong>
                                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                                    Go to your Dashboard &rarr; <strong>Classroom</strong> tab &rarr; <strong>Gradebook</strong> sub-tab.
                                    <br/>
                                    This shows a spreadsheet view of ALL boards for that class. You can grade multiple assignments at once here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
