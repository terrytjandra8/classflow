
import { MessageSquare, Boxes, BookOpen, Lightbulb, Clock, Layout, BarChart3, ListChecks, Wand2, Users, ThumbsUp, Scale, HelpCircle } from 'lucide-react';
import { AiRecipe, Section, BoardGuide } from '../../types';

// ----------------------------------------------------------------------
// 🚨 SUPER ADMIN CONFIGURATION 🚨
// ----------------------------------------------------------------------
export const SUPER_ADMIN_EMAIL = 'terry.tjandra@integrated.ipeka.sch.id'; 
// ----------------------------------------------------------------------

// AI Recipes Disabled to prevent costs
export const AI_RECIPES: AiRecipe[] = [];

// Custom Education Templates
export const TEMPLATES: Array<{
    id: string;
    title: string;
    desc: string;
    format: string;
    icon: any;
    wallpaper: string;
    sections: Section[];
    guide?: BoardGuide;
}> = [
    { 
        id: 'padlet_wall', 
        title: 'Padlet Wall', 
        desc: 'A classic brick-like layout for brainstorming and collecting ideas.', 
        format: 'wall', 
        icon: Layout, 
        wallpaper: 'url("https://www.transparenttextures.com/patterns/cork-board.png")', 
        sections: [],
        guide: {
            id: 'padlet_wall_guide',
            title: 'Padlet Wall',
            description: 'A flexible space for sharing ideas.',
            steps: [
                { text: 'Click the + button to add a post.', actionIcon: 'plus' },
                { text: 'Drag posts to rearrange them.', actionIcon: 'move' },
                { text: 'Share the link with your class.', actionLabel: 'Share', actionIcon: 'share' }
            ]
        }
    },
    { 
        id: 'breakout_groups', 
        title: 'Breakout groups', 
        desc: 'Organize class into small working groups.', 
        format: 'columns', 
        icon: Users, 
        wallpaper: 'url(\'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80\')', 
        sections: [
            { id: 'bg1', title: 'Breakout group 1' },
            { id: 'bg2', title: 'Breakout group 2' },
            { id: 'bg3', title: 'Breakout group 3' }
        ],
        guide: {
            id: 'breakout_groups_guide',
            title: 'Breakout groups',
            description: 'Create focused, smaller team groups for specific tasks or discussions.',
            steps: [
                { text: 'Personalize the title in settings.', actionLabel: 'Open settings', actionIcon: 'settings' },
                { text: 'Rename columns to match your groups.', actionIcon: 'edit' },
                { text: 'Share breakout links with students.', actionLabel: 'Share', actionIcon: 'share' }
            ]
        }
    },
    { 
        id: 'exit_ticket', 
        title: 'Exit Ticket', 
        desc: 'Check understanding at the end of a lesson.', 
        format: 'grid', 
        icon: ThumbsUp, 
        wallpaper: 'linear-gradient(to bottom right, #10b981, #3b82f6)',
        sections: [],
        guide: {
            id: 'exit_ticket_guide',
            title: 'Exit Ticket',
            description: 'Quickly assess student understanding.',
            steps: [
                { text: 'Set the question in the board description.', actionLabel: 'Edit description', actionIcon: 'settings' },
                { text: 'Students post their answers.', actionIcon: 'edit' }
            ]
        }
    },
    { 
        id: 'brainstorm', 
        title: 'Brainstorming', 
        desc: 'Collect and organize ideas in a freeform space.', 
        format: 'canvas', 
        icon: Lightbulb, 
        wallpaper: "url('https://www.transparenttextures.com/patterns/notebook.png')",
        sections: [],
        guide: {
            id: 'brainstorming_guide',
            title: 'Brainstorming',
            description: 'Collaborative space for ideas.',
            steps: [
                { text: 'Double click to add thoughts.', actionIcon: 'edit' },
                { text: 'Drag notes to group them.', actionIcon: 'edit' },
                { text: 'Connect related ideas.', actionIcon: 'edit' }
            ]
        }
    },
    { 
        id: 'debate', 
        title: 'Class Debate', 
        desc: 'Arguments for and against a topic.', 
        format: 'columns', 
        icon: MessageSquare, 
        wallpaper: '#334155',
        sections: [
            { id: 's1', title: 'Proposition (For)' },
            { id: 's2', title: 'Opposition (Against)' },
            { id: 's3', title: 'Rebuttals' }
        ],
        guide: {
            id: 'class_debate_guide',
            title: 'Class Debate',
            description: 'Structure arguments for debates.',
            steps: [
                { text: 'Define the motion in the description.', actionLabel: 'Edit description', actionIcon: 'settings' },
                { text: 'Assign teams to columns.', actionIcon: 'edit' },
                { text: 'Add evidence to posts.', actionIcon: 'edit' }
            ]
        }
    },
    { 
        id: 'pros_cons', 
        title: 'Pros and Cons', 
        desc: 'Evaluate a topic by weighing positives and negatives.', 
        format: 'columns', 
        icon: Scale, 
        wallpaper: 'linear-gradient(to right, #ffafbd, #ffc3a0)',
        sections: [
            { id: 's1', title: 'Pros' },
            { id: 's2', title: 'Cons' }
        ],
        guide: {
            id: 'pros_cons_guide',
            title: 'Pros & Cons',
            description: 'Simple evaluation framework.',
            steps: [
                { text: 'Set the topic as Board Title.', actionLabel: 'Edit title', actionIcon: 'settings' },
                { text: 'Add arguments to columns.', actionIcon: 'edit' }
            ]
        }
    },
    { 
        id: 'kwl', 
        title: 'KWL Chart', 
        desc: 'What I Know, What I Wonder, What I Learned.', 
        format: 'columns', 
        icon: HelpCircle, 
        wallpaper: '#1e293b',
        sections: [
            { id: 's1', title: 'What I Know' },
            { id: 's2', title: 'What I Wonder' },
            { id: 's3', title: 'What I Learned' }
        ],
        guide: {
            id: 'kwl_chart_guide',
            title: 'KWL Chart',
            description: 'Track learning progress.',
            steps: [
                { text: 'Fill "What I Know" first.', actionIcon: 'edit' },
                { text: 'Add student questions to "Wonder".', actionIcon: 'edit' },
                { text: 'Reflect in "Learned" at the end.', actionIcon: 'edit' }
            ]
        }
    },
];

export const QUOTES = [
    "The beautiful thing about learning is that no one can take it away from you.",
    "Education is the passport to the future.",
    "Mistakes are proof that you are trying.",
    "Believe you can and you're halfway there.",
    "The expert in anything was once a beginner.",
    "It always seems impossible until it's done.",
    "Creativity is intelligence having fun."
];
