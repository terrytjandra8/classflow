
// Preset color palette for groups
export const GROUP_COLORS = [
    { label: 'Blue', accent: '#3b82f6', bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)' },
    { label: 'Purple', accent: '#a855f7', bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)' },
    { label: 'Green', accent: '#22c55e', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.45)' },
    { label: 'Amber', accent: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)' },
    { label: 'Red', accent: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.45)' },
    { label: 'Pink', accent: '#ec4899', bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.45)' },
    { label: 'Cyan', accent: '#06b6d4', bg: 'rgba(6,182,212,0.18)', border: 'rgba(6,182,212,0.45)' },
    { label: 'Slate', accent: '#94a3b8', bg: 'rgba(148,163,184,0.18)', border: 'rgba(148,163,184,0.45)' },
];

export type GroupColorConfig = typeof GROUP_COLORS[number];

// Helper: get color config for a hex accent
export const getColorConfig = (accent: string): GroupColorConfig =>
    GROUP_COLORS.find(c => c.accent === accent) || GROUP_COLORS[0];
