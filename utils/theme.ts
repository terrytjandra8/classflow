
import { NoteColor } from '../types';

export const WALLPAPERS_MAP: Record<string, string> = {
  // --- Textures (Transparent patterns that sit on top of colors) ---
  'cubes': "url('https://www.transparenttextures.com/patterns/cubes.png')",
  'dark-matter': "url('https://www.transparenttextures.com/patterns/dark-matter.png')",
  'wood': "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
  'cork': "url('https://www.transparenttextures.com/patterns/black-linen.png')",
  'graph': "url('https://www.transparenttextures.com/patterns/graphy.png')",
  'notebook': "url('https://www.transparenttextures.com/patterns/notebook.png')",
  'blueprint': "url('https://www.transparenttextures.com/patterns/blueprint.png')",
  'linen': "url('https://www.transparenttextures.com/patterns/white-linen.png')",
  'brick': "url('https://www.transparenttextures.com/patterns/brick-wall.png')",
  'carbon': "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
  'mosaic': "url('https://www.transparenttextures.com/patterns/gplay.png')",
  'stars': "url('https://www.transparenttextures.com/patterns/stardust.png')",
  'paper': "url('https://www.transparenttextures.com/patterns/lined-paper-2.png')",
  
  // --- Gradients ---
  'orange': 'linear-gradient(to bottom right, #fdba74, #fca5a5)',
  'blue': 'linear-gradient(to bottom right, #93c5fd, #60a5fa)',
  
  // --- Fun & Games ---
  'anime': 'url("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=2000&q=80")',
  'clash': 'url("https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=2000&q=80")',

  // --- Economics & Data (Fixed) ---
  // Financial Charts / Analysis
  'economics': 'url("https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=2000&q=80")',
  // Stock Market Board
  'market': 'url("https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=2000&q=80")',
  // Growth Graph
  'growth': 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2000&q=80")',
  // Math / Equilibrium
  'calculus': 'url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=2000&q=80")',

  // --- Education & Culture ---
  'mandarin': 'url("https://images.unsplash.com/photo-1535025639604-9a804c092faa?auto=format&fit=crop&w=2000&q=80")',
  'science': 'url("https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=2000&q=80")',
  'history': 'url("https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=2000&q=80")',
  'literature': 'url("https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=2000&q=80")',
  'chalkboard': 'url("https://images.unsplash.com/photo-1581093583449-ed25213444e9?auto=format&fit=crop&w=2000&q=80")',
  
  // --- Space & Nature ---
  'space': 'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&w=2000&q=80")',
  'galaxy': 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=80")',
  'nebula': 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80")',
  'sky': 'url("https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=2000&q=80")',
  'leaves': 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=2000&q=80")',
  'desert': 'url("https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=2000&q=80")',
  'mountains': 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80")',
  'ocean': 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80")',
  'abstract': 'url("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=2000&q=80")',
};

// Specific background colors for transparent textures to ensure visibility
const TEXTURE_BACKGROUNDS: Record<string, string> = {
    'blueprint': '#2563eb', // Blue
    'graph': '#ffffff',     // White
    'notebook': '#fefce8',  // Light Yellow
    'paper': '#f8fafc',     // Off white
    'cork': '#78350f',      // Brownish
    'wood': '#7c2d12',      // Dark Wood
    'brick': '#7f1d1d',     // Red Brick
    'stars': '#0f172a',     // Dark Blue
    'dark-matter': '#111111', // Black
    'cubes': '#334155',     // Slate
    'carbon': '#171717',    // Dark Grey
    'mosaic': '#475569',    // Slate
    'linen': '#e2e8f0',     // Light Grey
};

export const FONTS: Record<string, string> = {
  'sans': 'font-sans',
  'serif': 'font-serif',
  'mono': 'font-mono',
  'hand': 'font-hand',
};

export const resolveBackgroundStyle = (wallpaper: string, theme: 'light' | 'dark' = 'dark') => {
    const resolved = WALLPAPERS_MAP[wallpaper] || wallpaper || '#222';
    const isTexture = resolved.includes('transparenttextures.com');
    const isUrl = resolved.includes('url(') || resolved.includes('gradient');
    
    // Determine fallback background color
    let backgroundColor: string | undefined;
    
    if (!isUrl) {
        // It's a hex code
        backgroundColor = resolved;
    } else if (isTexture) {
        // Use specific background map, or default based on theme
        backgroundColor = TEXTURE_BACKGROUNDS[wallpaper] || (theme === 'light' ? '#f8fafc' : '#111');
    } else {
        // For images, provide a dark fallback so it's not transparent while loading
        backgroundColor = '#111';
    }

    return {
        backgroundImage: isUrl ? resolved : 'none',
        backgroundColor,
        backgroundSize: isTexture ? 'auto' : 'cover',
        backgroundRepeat: isTexture ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center'
    };
};

export const getNoteColorClasses = (color: NoteColor) => {
    switch (color) {
        // Yellows
        case NoteColor.YELLOW:
            return 'bg-[#FFFFBA] dark:bg-[#E2E2A5] border-[#EAEAAB] dark:border-[#CFCF95] text-slate-900';
        case NoteColor.CREAM:
            return 'bg-[#FEF9C3] dark:bg-[#EFE9AE] border-[#FEF08A] dark:border-[#E2D870] text-slate-900';
        case NoteColor.AMBER:
            return 'bg-amber-200 dark:bg-amber-300 border-amber-300 dark:border-amber-400 text-slate-900';
        
        // Blues
        case NoteColor.BLUE:
            return 'bg-[#BAE1FF] dark:bg-[#95B8D6] border-[#A8CDEB] dark:border-[#83A2BD] text-slate-900';
        case NoteColor.ICE:
            return 'bg-[#E0F2FE] dark:bg-[#B9E6FE] border-[#BAE6FD] dark:border-[#7DD3FC] text-slate-900';
        case NoteColor.SKY:
            return 'bg-sky-200 dark:bg-sky-300 border-sky-300 dark:border-sky-400 text-slate-900';
        case NoteColor.CYAN:
            return 'bg-cyan-200 dark:bg-cyan-300 border-cyan-300 dark:border-cyan-400 text-slate-900';
        
        // Greens
        case NoteColor.GREEN:
            return 'bg-[#BAFFC9] dark:bg-[#97D6A5] border-[#A9EBBC] dark:border-[#85C293] text-slate-900';
        case NoteColor.MINT:
            return 'bg-[#D1FAE5] dark:bg-[#A7F3D0] border-[#6EE7B7] dark:border-[#34D399] text-slate-900';
        case NoteColor.EMERALD:
            return 'bg-emerald-200 dark:bg-emerald-300 border-emerald-300 dark:border-emerald-400 text-slate-900';
        case NoteColor.LIME:
            return 'bg-lime-200 dark:bg-lime-300 border-lime-300 dark:border-lime-400 text-slate-900';
        case NoteColor.TEAL:
            return 'bg-teal-200 dark:bg-teal-300 border-teal-300 dark:border-teal-400 text-slate-900';
        
        // Pinks & Reds
        case NoteColor.PINK:
            return 'bg-[#FFB3BA] dark:bg-[#D69299] border-[#EBA4AB] dark:border-[#BD8087] text-slate-900';
        case NoteColor.BLUSH:
            return 'bg-[#FFE4E6] dark:bg-[#FDA4AF] border-[#FECDD3] dark:border-[#FB7185] text-slate-900';
        case NoteColor.ROSE:
            return 'bg-rose-200 dark:bg-rose-300 border-rose-300 dark:border-rose-400 text-slate-900';
        case NoteColor.RED:
            return 'bg-red-200 dark:bg-red-300 border-red-300 dark:border-red-400 text-slate-900';
        case NoteColor.FUCHSIA:
            return 'bg-fuchsia-200 dark:bg-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-400 text-slate-900';
        
        // Purples
        case NoteColor.PURPLE:
            return 'bg-[#E1BAFF] dark:bg-[#BE9BD6] border-[#D0A9EB] dark:border-[#A888BD] text-slate-900';
        case NoteColor.LILAC:
            return 'bg-[#F3E8FF] dark:bg-[#E9D5FF] border-[#D8B4FE] dark:border-[#C084FC] text-slate-900';
        case NoteColor.VIOLET:
            return 'bg-violet-200 dark:bg-violet-300 border-violet-300 dark:border-violet-400 text-slate-900';
        case NoteColor.INDIGO:
            return 'bg-indigo-200 dark:bg-indigo-300 border-indigo-300 dark:border-indigo-400 text-slate-900';
        case NoteColor.PERIWINKLE:
            return 'bg-[#E0E7FF] dark:bg-[#C7D2FE] border-[#A5B4FC] dark:border-[#818CF8] text-slate-900';
        
        // Oranges
        case NoteColor.ORANGE:
            return 'bg-orange-200 dark:bg-orange-300 border-orange-300 dark:border-orange-400 text-slate-900';
        case NoteColor.PEACH:
            return 'bg-[#FFEDD5] dark:bg-[#FED7AA] border-[#FDBA74] dark:border-[#FB923C] text-slate-900';
        
        // Greys
        case NoteColor.SLATE:
            return 'bg-slate-200 dark:bg-slate-300 border-slate-300 dark:border-slate-400 text-slate-900';
        case NoteColor.GRAY:
            return 'bg-gray-200 dark:bg-gray-300 border-gray-300 dark:border-gray-400 text-slate-900';
        case NoteColor.ZINC:
            return 'bg-zinc-200 dark:bg-zinc-300 border-zinc-300 dark:border-zinc-400 text-slate-900';
        case NoteColor.NEUTRAL:
            return 'bg-neutral-200 dark:bg-neutral-300 border-neutral-300 dark:border-neutral-400 text-slate-900';
        case NoteColor.STONE:
            return 'bg-stone-200 dark:bg-stone-300 border-stone-300 dark:border-stone-400 text-slate-900';
        
        case NoteColor.TRANSPARENT:
            return 'bg-transparent border-transparent text-slate-900 dark:text-white';
        default: 
            return 'bg-white dark:bg-[#333333] border-slate-200 dark:border-white/20 text-slate-800 dark:text-gray-100';
    }
};

export const getColorName = (color: NoteColor): string => {
    switch (color) {
        // Reds/Pinks
        case NoteColor.RED: return "Cherry Red";
        case NoteColor.ROSE: return "Rose Petal";
        case NoteColor.BLUSH: return "Sweet Blush";
        case NoteColor.PINK: return "Cotton Candy";
        case NoteColor.FUCHSIA: return "Hot Pink";
        // Purples
        case NoteColor.LILAC: return "Soft Lilac";
        case NoteColor.PURPLE: return "Lavender Dream";
        case NoteColor.VIOLET: return "Amethyst";
        case NoteColor.INDIGO: return "Twilight";
        case NoteColor.PERIWINKLE: return "Periwinkle";
        // Blues
        case NoteColor.BLUE: return "Baby Blue";
        case NoteColor.ICE: return "Glacier Ice";
        case NoteColor.SKY: return "Clear Sky";
        case NoteColor.CYAN: return "Aqua";
        // Greens
        case NoteColor.TEAL: return "Ocean Foam";
        case NoteColor.EMERALD: return "Sea Glass";
        case NoteColor.MINT: return "Fresh Mint";
        case NoteColor.GREEN: return "Matcha Latte";
        case NoteColor.LIME: return "Key Lime";
        // Yellows/Oranges
        case NoteColor.YELLOW: return "Lemon Drop";
        case NoteColor.CREAM: return "Vanilla Cream";
        case NoteColor.AMBER: return "Honey";
        case NoteColor.ORANGE: return "Tangerine";
        case NoteColor.PEACH: return "Peachy Keen";
        // Neutrals
        case NoteColor.STONE: return "Pebble";
        case NoteColor.NEUTRAL: return "Sand";
        case NoteColor.ZINC: return "Chrome";
        case NoteColor.GRAY: return "Fog";
        case NoteColor.SLATE: return "Storm";
        // Special
        case NoteColor.WHITE: return "Paper White";
        case NoteColor.TRANSPARENT: return "Ghost (Transparent)";
        default: return "Custom";
    }
};
