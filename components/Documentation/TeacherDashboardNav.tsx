
import React from 'react';
import { Filter, ChevronDown, Layout } from 'lucide-react';

export const TeacherDashboardNav: React.FC = () => (
    <div className="mb-12 border-b border-gray-200 dark:border-white/10 pb-8 last:border-0">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Layout size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard & Filters</h2>
        </div>

        <div className="space-y-8">
            
            {/* Class Filter */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">New Feature</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Filtering by Class</h3>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                        If you teach multiple classes, your dashboard might get crowded. Use the global class filter to focus on one group at a time.
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Visual Aid */}
                        <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-lg border border-dashed border-slate-300 dark:border-white/10 flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 shadow-sm">
                                <Filter size={14} className="text-gray-500"/>
                                <span className="text-xs font-bold">History 101</span>
                                <ChevronDown size={14} className="text-gray-400"/>
                            </div>
                            <div className="text-xs text-gray-500">&lt;- Look for this in the top bar</div>
                        </div>

                        {/* Steps */}
                        <div className="flex-1">
                            <ol className="relative border-l border-gray-200 dark:border-white/10 ml-3 space-y-6">
                                <li className="mb-2 ml-6">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full -left-3 ring-4 ring-white dark:ring-[#111]">
                                        <span className="text-blue-600 dark:text-blue-300 text-xs font-bold">1</span>
                                    </span>
                                    <h4 className="font-bold text-sm mb-1">Locate the Filter</h4>
                                    <p className="text-xs text-gray-500">
                                        Look at the top-left of your screen, right next to the "ClassBoard" logo. You will see a dropdown that says "All Classes" by default.
                                    </p>
                                </li>
                                <li className="mb-2 ml-6">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full -left-3 ring-4 ring-white dark:ring-[#111]">
                                        <span className="text-blue-600 dark:text-blue-300 text-xs font-bold">2</span>
                                    </span>
                                    <h4 className="font-bold text-sm mb-1">Select a Class</h4>
                                    <p className="text-xs text-gray-500">
                                        Click it and choose a class (e.g., "Science 7A").
                                    </p>
                                </li>
                                <li className="mb-2 ml-6">
                                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full -left-3 ring-4 ring-white dark:ring-[#111]">
                                        <span className="text-blue-600 dark:text-blue-300 text-xs font-bold">3</span>
                                    </span>
                                    <h4 className="font-bold text-sm mb-1">View Results</h4>
                                    <p className="text-xs text-gray-500">
                                        The dashboard will instantly hide all boards that don't belong to that class.
                                    </p>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
