
export const SOLIDS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Whites/Greys
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', // Reds/Oranges/Yellows/Greens
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', // Teals/Blues/Indigos
  '#8b5cf6', '#d946ef', '#f43f5e', '#881337', // Purples/Pinks/Roses
  '#fff1f2', '#fff7ed', '#f0fdf4', '#f0f9ff', // Pastels
  '#0f172a', '#1e293b', '#334155', '#000000'  // Darks
];

export const GRADIENTS = [
  { label: 'Sunset', value: 'linear-gradient(to bottom right, #fdba74, #fca5a5)' },
  { label: 'Ocean', value: 'linear-gradient(to bottom right, #93c5fd, #60a5fa)' },
  { label: 'Forest', value: 'linear-gradient(to bottom right, #86efac, #3b82f6)' },
  { label: 'Midnight', value: 'linear-gradient(to bottom right, #1e293b, #0f172a)' },
  { label: 'Aurora', value: 'linear-gradient(to top right, #6366f1, #a855f7, #ec4899)' },
  { label: 'Dawn', value: 'linear-gradient(to right, #ffafbd, #ffc3a0)' },
  { label: 'Peachy', value: 'linear-gradient(to top, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { label: 'Cool Blues', value: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' },
  { label: 'Night', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
];

export const TEXTURES = [
  { id: 'cubes', label: 'Cubes', value: "url('https://www.transparenttextures.com/patterns/cubes.png')" },
  { id: 'dark-matter', label: 'Dark Matter', value: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" },
  { id: 'wood', label: 'Wood', value: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')" },
  { id: 'cork', label: 'Cork', value: "url('https://www.transparenttextures.com/patterns/black-linen.png')" },
  { id: 'graph', label: 'Graph Paper', value: "url('https://www.transparenttextures.com/patterns/graphy.png')" },
  { id: 'notebook', label: 'Notebook', value: "url('https://www.transparenttextures.com/patterns/notebook.png')" },
  { id: 'blueprint', label: 'Blueprint', value: "url('https://www.transparenttextures.com/patterns/blueprint.png')" },
  { id: 'linen', label: 'Linen', value: "url('https://www.transparenttextures.com/patterns/white-linen.png')" },
  { id: 'brick', label: 'Brick', value: "url('https://www.transparenttextures.com/patterns/brick-wall.png')" },
  { id: 'carbon', label: 'Carbon', value: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" },
  { id: 'mosaic', label: 'Mosaic', value: "url('https://www.transparenttextures.com/patterns/gplay.png')" },
  { id: 'stars', label: 'Stardust', value: "url('https://www.transparenttextures.com/patterns/stardust.png')" },
  { id: 'paper', label: 'Paper', value: "url('https://www.transparenttextures.com/patterns/lined-paper-2.png')" },
];

export const IMAGES = [
    // Fun & Themes (New)
    { id: 'anime', label: 'Anime Night', value: 'url("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80")' },
    { id: 'clash', label: 'Clash Royale', value: 'url("https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=200&q=80")' },

    // Economics / Financial
    { id: 'economics', label: 'Econ. Analysis', value: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80")' },
    { id: 'market', label: 'Stock Market', value: 'url("https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=200&q=80")' },
    { id: 'growth', label: 'Growth Trend', value: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80")' },
    { id: 'calculus', label: 'Equilibrium', value: 'url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=200&q=80")' },

    // Education Themes
    { id: 'mandarin', label: 'Mandarin', value: 'url("https://images.unsplash.com/photo-1535025639604-9a804c092faa?auto=format&fit=crop&w=200&q=80")' },
    { id: 'science', label: 'Science', value: 'url("https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=200&q=80")' },
    { id: 'history', label: 'History', value: 'url("https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=200&q=80")' },
    { id: 'literature', label: 'Literature', value: 'url("https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=200&q=80")' },
    { id: 'chalkboard', label: 'Chalkboard', value: 'url("https://images.unsplash.com/photo-1581093583449-ed25213444e9?auto=format&fit=crop&w=200&q=80")' },
    
    // Space & Nature
    { id: 'space', label: 'Deep Space', value: 'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&w=200&q=80")' },
    { id: 'galaxy', label: 'Galaxy', value: 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=200&q=80")' },
    { id: 'nebula', label: 'Nebula', value: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80")' },
    { id: 'sky', label: 'Sky', value: 'url("https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=200&q=80")' },
    { id: 'leaves', label: 'Nature', value: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=200&q=80")' },
    { id: 'desert', label: 'Desert', value: 'url("https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=200&q=80")' },
    { id: 'mountains', label: 'Mountains', value: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80")' },
    { id: 'ocean', label: 'Ocean', value: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80")' },
    { id: 'abstract', label: 'Abstract', value: 'url("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=80")' },
];

export const ICONS = [
    '🇨🇳', '🏮', '🧧', '🥢', '🐼', '🐲', '🀄', 
    '🎓', '📚', '✏️', '📝', '🧠', '💡', '🎒', '🏫', '🍎', '🔬', '🧬', '🔭', '🧮', '📐', '🎨', '🎭', '🎵', '⚽', '🏀', '🏆', 
    '🇮🇩', '🇺🇸', '🇬🇧', '🇯🇵', '🇰🇷', '🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇧🇷', '🇦🇺', '🇨🇦', '🇮🇳', '🇷🇺', '🇵🇸', '🇺🇦',
    '💻', '📱', '🚀', '🛸', '⚡', '🔋', '⚙️', '🤖', '👾', '🎮', '🕹️', '🌐', '🌍', '🌋', '🌊', '☀️', '🌙', '⭐',
    '🌱', '🌲', '🌵', '🌹', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐨', '🐯', '🦁', '🐮', '🐷', '🦄', '🐝', '🦕',
    '🎉', '🎈', '🎁', '🎂', '🍕', '🍔', '🍟', '🍿', '🍩', '🍪', '🍫', '🍬', '🚗', '✈️', '⚓', '⌚', '📷', '🎥', '🎬', '🎤',
    '✅', '❌', '⚠️', '🛑', '🏁', '🚩', '🔥', '💧', '❤️', '💯', '👋', '👍', '👎', '👏', '🤝'
];
