
import React from 'react';
import { Zap, HelpCircle, User, Palette, MessageSquare, Layout, Settings, GripVertical, ShieldCheck, Award, ThumbsUp, Eye, Trash2, Lock, Unlock, Users, Star, BrainCircuit, GitBranch, Lightbulb, CheckCircle, Search, Filter, Columns, Rows, Image, Link as LinkIcon, Edit, FileDown } from 'lucide-react';

// Reusable components for documentation
const DocCard: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode}> = ({ icon, title, children }) => (
    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-100 dark:bg-white/5 flex items-center gap-3 border-b border-gray-200 dark:border-white/10">
            {icon}
            <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="p-4 text-sm text-slate-600 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

const IconDesc: React.FC<{icon: React.ReactNode, children: React.ReactNode}> = ({ icon, children }) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 rounded-lg">{icon}</div>
        <p className="text-sm text-slate-600 dark:text-gray-300 pt-1.5">{children}</p>
    </div>
);

// --- Teacher Guide Detailed Components ---

const TeacherDashboardNav = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard & Filters</h2>
        <p className="text-slate-600 dark:text-gray-300">The dashboard is your central hub for managing all your ClassBoards. Here, you can create new boards, search for existing ones, and see their status at a glance.</p>
        <DocCard icon={<Star size={18} className="text-amber-500" />} title="Creating from a Template">
            <p>Templates are pre-configured boards designed for common classroom activities. Click the <strong>+ Make</strong> button to open the template gallery.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong className="text-slate-700 dark:text-white">Brainstorming:</strong> A freeform canvas for capturing and connecting ideas.</li>
                <li><strong className="text-slate-700 dark:text-white">Class Debate:</strong> A structured board with columns for arguments and rebuttals.</li>
                <li><strong className="text-slate-700 dark:text-white">Exit Ticket:</strong> A simple grid for quick end-of-lesson assessments.</li>
            </ul>
        </DocCard>
        <DocCard icon={<Search size={18} className="text-blue-500" />} title="Search & Filter">
            <p>Quickly find the board you're looking for.</p>
             <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Use the <strong className="text-slate-700 dark:text-white">Search bar</strong> to find boards by title.</li>
                <li>Click the <strong className="text-slate-700 dark:text-white">Filter</strong> button to sort by layout, status (Live/Draft), or creation date.</li>
            </ul>
        </DocCard>
    </div>
);

const TeacherLayouts = () => (
     <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Choosing a Layout</h2>
        <p className="text-slate-600 dark:text-gray-300">ClassBoard offers three distinct layouts to suit different learning objectives. You choose a layout when you create a new board.</p>
        <DocCard icon={<Rows size={18} className="text-cyan-500" />} title="Wall Layout">
            <p>The Wall is a simple, grid-based layout. It's perfect for activities where you want to see a gallery of student responses, like an exit ticket or a quick poll.</p>
        </DocCard>
        <DocCard icon={<Columns size={18} className="text-indigo-500" />} title="Columns Layout">
            <p>This layout organizes content into vertical columns that you can define. It's ideal for structured activities like KWL charts, pros and cons lists, or class debates.</p>
        </DocCard>
        <DocCard icon={<GitBranch size={18} className="text-rose-500" />} title="Canvas Layout">
            <p>The Canvas is a freeform, infinite space. Students can place notes anywhere, resize them, and draw connections between them. This is the ultimate tool for brainstorming, mind mapping, and exploring complex relationships between ideas.</p>
        </DocCard>
    </div>
);

const TeacherSettingsDoc = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Board Settings</h2>
        <p className="text-slate-600 dark:text-gray-300">Each board has a powerful set of options, accessible via the <Settings size={16} className="inline-block" /> icon. These settings allow you to tailor the activity to your specific needs.</p>
        <DocCard icon={<ShieldCheck size={18} className="text-green-500" />} title="Participation & Privacy">
            <ul className="list-disc list-inside space-y-3">
                <li><strong className="text-slate-700 dark:text-white">Anonymity:</strong> Allow students to post as "Anonymous". Great for encouraging participation from shy students.</li>
                <li><strong className="text-slate-700 dark:text-white">Content Moderation (PRO):</strong> Require your approval before posts, comments, or connections become visible to the class.</li>
                <li><strong className="text-slate-700 dark:text-white">Participation Controls (PRO):</strong> Fine-tune permissions. You can disable posts, comments, or reactions entirely.</li>
            </ul>
        </DocCard>
        <DocCard icon={<Palette size={18} className="text-pink-500" />} title="Content & Display">
             <ul className="list-disc list-inside space-y-3">
                <li><strong className="text-slate-700 dark:text-white">Post Size:</strong> Adjust the default size of new notes.</li>
                <li><strong className="text-slate-700 dark:text-white">Board Wallpaper:</strong> Customize the background with a color or image to set the mood.</li>
            </ul>
        </DocCard>
    </div>
);

const TeacherColumnManagement = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Columns & Content</h2>
        <p className="text-slate-600 dark:text-gray-300">In the <strong>Columns</strong> layout, you have full control over the structure. You can also moderate content directly on the board.</p>
        <DocCard icon={<GripVertical size={18} className="text-orange-500" />} title="Managing Columns">
             <ul className="list-disc list-inside space-y-3">
                <li><strong className="text-slate-700 dark:text-white">Add Column:</strong> Click the "+ Add Column" button to create a new category.</li>
                <li><strong className="text-slate-700 dark:text-white">Rename Column:</strong> Click on any column title to edit it.</li>
                <li><strong className="text-slate-700 dark:text-white">Rearrange Columns:</strong> Drag and drop column headers to change their order.</li>
            </ul>
        </DocCard>
        <DocCard icon={<Edit size={18} className="text-purple-500" />} title="Moderating Content">
             <ul className="list-disc list-inside space-y-3">
                <li><strong className="text-slate-700 dark:text-white">Edit Post:</strong> Click the pencil icon on a student's post to edit its content.</li>
                <li><strong className="text-slate-700 dark:text-white">Delete Post:</strong> Click the trash can icon to remove a post from the board.</li>
            </ul>
        </DocCard>
    </div>
);

const TeacherActivities = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Activities: Quiz & Assessment</h2>
        <p className="text-slate-600 dark:text-gray-300">ClassBoard transforms static boards into dynamic learning activities. Use the format switcher in the top toolbar to change modes.</p>
        
        <DocCard icon={<BrainCircuit size={18} className="text-pink-500" />} title="Synchronized Quiz">
            <p>Engage students with a real-time, teacher-controlled quiz.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong className="text-slate-700 dark:text-white">Teacher Control:</strong> You control the pace. Students' screens update instantly as you move through questions.</li>
                <li><strong className="text-slate-700 dark:text-white">Live Leaderboard:</strong> Watch the scoreboard update in real-time as students submit answers.</li>
                <li><strong className="text-slate-700 dark:text-white">Gamified Feedback:</strong> Students receive instant visual feedback on their performance.</li>
            </ul>
        </DocCard>

        <DocCard icon={<GitBranch size={18} className="text-blue-500" />} title="Structured Assessment">
            <p>Run formal evaluations with phased control.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong className="text-slate-700 dark:text-white">Reading Phase:</strong> Students can view materials but cannot edit or create notes.</li>
                <li><strong className="text-slate-700 dark:text-white">Active Phase:</strong> Students can create and edit their submissions within the board.</li>
                <li><strong className="text-slate-700 dark:text-white">Auto-Lock:</strong> Switch to 'Finished' mode to instantly revoke editing permissions for all students.</li>
            </ul>
        </DocCard>
    </div>
);

const TeacherAdmin = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Class Management</h2>
        <p className="text-slate-600 dark:text-gray-300">The <strong>Class</strong> tab gives you a comprehensive overview of student activity and control over their access.</p>
         <DocCard icon={<Users size={18} className="text-teal-500" />} title="Student Roster">
            <p>See a list of all students who have joined the board. From here, you can:</p>
             <ul className="list-disc list-inside space-y-3 mt-2">
                <li><strong className="text-slate-700 dark:text-white">View a student's posts:</strong> Click on a student's name to see all of their contributions in one place.</li>
                <li><strong className="text-slate-700 dark:text-white">Block a student:</strong> If necessary, you can prevent a student from further participation by blocking them.</li>
            </ul>
        </DocCard>
    </div>
);

const TeacherGrading = () => (
     <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grading (PRO)</h2>
        <p className="text-slate-600 dark:text-gray-300">Our integrated grading system allows you to assess student work directly within ClassBoard.</p>
         <DocCard icon={<Award size={18} className="text-red-500" />} title="Assessing Participation">
            <p>The <strong>Grades</strong> tab provides a table of all students and their work.</p>
             <ul className="list-disc list-inside space-y-3 mt-2">
                <li><strong className="text-slate-700 dark:text-white">Grade Posts:</strong> Review each student's posts and assign a grade (e.g., Check, Check-plus, Check-minus).</li>
                <li><strong className="text-slate-700 dark:text-white">Add Comments:</strong> Provide private feedback to students on their work.</li>
            </ul>
        </DocCard>
        <DocCard icon={<FileDown size={18} className="text-green-500" />} title="Exporting Grades">
            <p>Easily transfer grades to your official gradebook. Click the <strong>Export CSV</strong> button to download a spreadsheet of all grades and feedback for the current board.</p>
        </DocCard>
    </div>
);

const TeacherIcons = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Icon Legend</h2>
        <p className="text-slate-600 dark:text-gray-300">A quick reference for the icons you'll see around the app.</p>
        <div className="space-y-4">
            <IconDesc icon={<Layout />}><strong className="text-slate-700 dark:text-white">Layouts:</strong> Represents board layouts like Wall, Columns, or Canvas.</IconDesc>
            <IconDesc icon={<Zap />}><strong className="text-slate-700 dark:text-white">Real-Time:</strong> Indicates live, instantaneous updates.</IconDesc>
            <IconDesc icon={<ShieldCheck />}><strong className="text-slate-700 dark:text-white">Management & Security:</strong> Found in settings related to class management and board security.</IconDesc>
            <IconDesc icon={<Settings />}><strong className="text-slate-700 dark:text-white">Settings:</strong> Opens the board settings panel.</IconDesc>
            <IconDesc icon={<Award />}><strong className="text-slate-700 dark:text-white">Grading:</strong> Relates to features for assessment and feedback.</IconDesc>
            <IconDesc icon={<Users />}><strong className="text-slate-700 dark:text-white">Groups & Class:</strong> Used for student management and group activities.</IconDesc>
            <IconDesc icon={<Star />}><strong className="text-slate-700 dark:text-white">Templates:</strong> Denotes board templates for quick setup.</IconDesc>
            <IconDesc icon={<CheckCircle />}><strong className="text-slate-700 dark:text-white">Success / Published:</strong> Indicates a successful action or a published state.</IconDesc>
        </div>
    </div>
);

// --- Student Guide Detailed Components ---

const StudentBasics = () => (
    <div className="space-y-6">
        <p className="text-slate-600 dark:text-gray-300">Joining a ClassBoard is simple and doesn't require an account.</p>
        <DocCard icon={<User size={18} className="text-blue-500" />} title="How to Join">
            <ol className="list-decimal list-inside space-y-2">
                <li>Get the 6-digit join code from your teacher.</li>
                <li>Go to the ClassBoard website and enter the code.</li>
                <li>Enter your name (or a nickname) and you're in!</li>
            </ol>
        </DocCard>
        <DocCard icon={<Eye size={18} className="text-purple-500" />} title="What You'll See">
            <p>You will be taken directly to the board. You can see posts from your teacher and classmates as they appear in real-time. If the board is in 'Draft' mode, you may have to wait for your teacher to make it 'Live'.</p>
        </DocCard>
    </div>
);

const StudentContent = () => (
    <div className="space-y-6">
        <p className="text-slate-600 dark:text-gray-300">Express your ideas by creating rich, multimedia notes.</p>
        <DocCard icon={<Edit size={18} className="text-green-500" />} title="Creating & Editing Notes">
             <ul className="list-disc list-inside space-y-3">
                <li><strong className="text-slate-700 dark:text-white">Create a note:</strong> Double-click anywhere or click the 'Add Note' button.</li>
                <li><strong className="text-slate-700 dark:text-white">Rich Content:</strong> Use Markdown for formatting, add bullet points, or highlight text.</li>
                <li><strong className="text-slate-700 dark:text-white">Multimedia:</strong> Embed images (<Image size={14} className="inline-block"/>) and attach files or links (<LinkIcon size={14} className="inline-block"/>).</li>
                <li><strong className="text-slate-700 dark:text-white">Interactions:</strong> Like classmates' posts, leave comments, and drag notes to organize ideas.</li>
             </ul>
        </DocCard>
        <DocCard icon={<BrainCircuit size={18} className="text-pink-500" />} title="Interactive Activities">
            <p>Your screen will change automatically when your teacher starts a Quiz or Assessment.</p>
             <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong className="text-slate-700 dark:text-white">Live Quiz:</strong> Vote on questions in real-time and climb the leaderboard.</li>
                <li><strong className="text-slate-700 dark:text-white">Controlled Exams:</strong> Follow the 'Reading' and 'Active' phases as directed by your teacher.</li>
            </ul>
        </DocCard>
    </div>
);


// --- Main Guide Components (wiring up the detailed sections) ---

export const TEACHER_SECTIONS = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'dashboard', label: 'Dashboard & Filters' },
    { id: 'layouts', label: 'Choosing a Layout' },
    { id: 'activities', label: 'Quiz & Assessment' },
    { id: 'settings', label: 'Board Settings' },
    { id: 'columns', label: 'Columns & Content' },
    { id: 'management', label: 'Class Management' },
    { id: 'grading', label: 'Grading' },
    { id: 'concepts', label: 'Key Concepts' },
    { id: 'icons', label: 'Icon Legend' },
];

export const TeacherGuide: React.FC = () => (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Teacher Guide</h1>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                Welcome to ClassBoard. This manual follows the natural flow of setting up a classroom environment, from creation to assessment.
            </p>
        </div>
        <hr className="border-gray-200 dark:border-white/10" />
        <section id="quick-start" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><Zap size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quick Start</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 1</div>
                    <p className="text-base font-bold mb-2">Create</p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Go to "Make", select a layout (like "Wall"), and give it a title.</p>
                </div>
                <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 2</div>
                    <p className="text-base font-bold mb-2">Share</p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Click the <strong className="text-pink-500">Share</strong> button. Provide the 6-digit code to students.</p>
                </div>
                 <div className="bg-slate-100 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-2">Step 3</div>
                    <p className="text-base font-bold mb-2">Live</p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Toggle from <strong>Draft</strong> to <strong>Live</strong> so students can enter.</p>
                </div>
            </div>
        </section>
        <section id="dashboard" className="scroll-mt-24"><TeacherDashboardNav /></section>
        <section id="layouts" className="scroll-mt-24"><TeacherLayouts /></section>
        <section id="activities" className="scroll-mt-24"><TeacherActivities /></section>
        <section id="settings" className="scroll-mt-24"><TeacherSettingsDoc /></section>
        <section id="columns" className="scroll-mt-24"><TeacherColumnManagement /></section>
        <section id="management" className="scroll-mt-24"><TeacherAdmin /></section>
        <section id="grading" className="scroll-mt-24"><TeacherGrading /></section>
        <section id="concepts" className="scroll-mt-24 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><HelpCircle size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Key Concepts</h2>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
                <h3 className="font-bold text-lg mb-2">Draft vs. Live</h3>
                <p className="text-sm text-slate-600 dark:text-gray-300">Think of this like a curtain on a stage. 'Draft' is when you are setting up; 'Live' is when students can join.</p>
            </div>
        </section>
        <section id="icons" className="scroll-mt-24"><TeacherIcons /></section>
    </div>
);

// --- STUDENT GUIDE ---
export const STUDENT_SECTIONS = [
    { id: 'getting-started', label: 'Joining & Basics' },
    { id: 'creating-posts', label: 'Creating Posts' },
    { id: 'interaction', label: 'Interacting' },
];

export const StudentGuide: React.FC = () => (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Student Guide</h1>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                Everything you need to know to participate in ClassBoard activities.
            </p>
        </div>
        <hr className="border-gray-200 dark:border-white/10" />
        <section id="getting-started" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><User size={24}/></div> <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Joining & Basics</h2></div>
            <StudentBasics />
        </section>
        <section id="creating-posts" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg"><Palette size={24}/></div> <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Creating Content</h2></div>
            <StudentContent />
        </section>
        <section id="interaction" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3"><div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><MessageSquare size={24}/></div> <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Interacting</h2></div>
             <p className="text-slate-600 dark:text-gray-300">ClassBoard is built for collaboration. Here's how you can interact with others:</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="font-bold text-blue-500 mb-2">Comments</div>
                    <p className="text-xs text-gray-500">Click the bubble icon on any post to start a thread or reply to someone else.</p>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="font-bold text-red-500 mb-2">Reactions</div>
                    <p className="text-xs text-gray-500">Tap the heart icon to show appreciation for a classmate's idea.</p>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="font-bold text-orange-500 mb-2">Connections</div>
                    <p className="text-xs text-gray-500">In Canvas mode, drag lines between notes to visually link related concepts.</p>
                </div>
            </div>
        </section>
    </div>
);

// --- ABOUT SECTION ---
export const AppHistory: React.FC<{ theme: string, role: string }> = ({ theme, role }) => (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 pb-20">
         <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">About ClassBoard</h1>
            <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                ClassBoard is a real-time collaborative platform for the modern classroom, designed to foster engagement, creativity, and critical thinking.
            </p>
        </div>
    </div>
);
