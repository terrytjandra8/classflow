import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, Camera, PenTool, Search, X, Loader2, Film, Clipboard } from 'lucide-react';
import { CommentAttachment } from '../types';

interface AttachmentPickerProps {
  onSelect: (attachment: CommentAttachment) => void;
  onClose: () => void;
}

const GIPHY_API_KEY = 'RKmBxWsi0EgRtMrBK79HE4hVXpeuTytn';

// Extended Mock Data with Keywords (used as fallback/trending)
const MOCK_GIFS = [
    { url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2J5Y2J5Y2J5Y2J5Y2J5Y2J5Y2J5Y2J5Y2J5Y2J5YyZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/3o7TKSjRrfIPjeiVyM/giphy.gif", title: "cat funny cute animal dance party" },
    { url: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif", title: "happy yes agree nod smile" },
    { url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", title: "sad cry no upset" },
    { url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", title: "shock wow omg surprise" },
    { url: "https://media.giphy.com/media/3o7TKTd0tWwV7G5s8U/giphy.gif", title: "confused thinking what huh" },
    { url: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", title: "excited yay celebrate winner" },
    { url: "https://media.giphy.com/media/jUwpNzg9IcyrK/giphy.gif", title: "homer simpson bushes hide awkward" },
    { url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif", title: "laugh funny lol haha" },
    { url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif", title: "mind blown explosion wow" },
    { url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", title: "angry rage mad" }
];

interface GifResult {
    url: string;
    title: string;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({ onSelect, onClose }) => {
  const [view, setView] = useState<'grid' | 'camera' | 'drawing' | 'link' | 'gif'>('grid');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gifResults, setGifResults] = useState<GifResult[]>(MOCK_GIFS);
  
  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing Refs
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (view === 'gif' && !inputValue.trim()) {
        setGifResults(MOCK_GIFS);
    }
  }, [view, inputValue]);

  const startCamera = async () => {
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Could not access camera");
      setView('grid');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());

        onSelect({ type: 'image', content: dataUrl });
        onClose();
      }
    }
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff'; // White ink for dark mode
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const finishDrawing = () => {
      if (drawCanvasRef.current) {
          const dataUrl = drawCanvasRef.current.toDataURL('image/png');
          onSelect({ type: 'drawing', content: dataUrl });
          onClose();
      }
  };

  const handleLinkSubmit = () => {
      if (inputValue) {
          onSelect({ type: 'link', content: inputValue });
          onClose();
      }
  };

  const handleGifSearch = async () => {
      if (!inputValue.trim()) {
          setGifResults(MOCK_GIFS);
          return;
      }
      setIsLoading(true);
      
      try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(inputValue)}&limit=24&offset=0&rating=g&lang=en`);
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
            const results = data.data.map((gif: any) => ({
                url: gif.images.fixed_height.url,
                title: gif.title
            }));
            setGifResults(results);
        } else {
            setGifResults([]);
        }
      } catch (error) {
          console.error("Error searching Giphy:", error);
          setGifResults([]);
      }
      
      setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          if (view === 'link') handleLinkSubmit();
          if (view === 'gif') handleGifSearch();
      }
  };

  const handleGifSelect = (gifUrl: string) => {
      onSelect({ type: 'image', content: gifUrl });
      onClose();
  };

  const getPlaceholder = () => {
      if (view === 'gif') return "Search GIPHY (Press Enter)...";
      return "Search web or paste URL";
  };

  const MenuButton = ({ icon: Icon, label, theme, onClick, badge }: any) => {
    const themeColors: Record<string, string> = {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        pink: 'text-pink-400',
        orange: 'text-orange-400',
        green: 'text-green-400',
        red: 'text-red-400',
    };
    
    const iconColor = themeColors[theme] || themeColors['blue'];

    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-[#222] hover:bg-[#2a2a2a] rounded-lg transition-colors text-left group border border-white/5 relative overflow-hidden w-full"
        >
            <div className={`flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-gray-200 group-hover:text-white flex-1 truncate">{label}</span>
            {badge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-[#143020] text-[#4ade80] px-1.5 py-0.5 rounded border border-[#1f4a33] uppercase tracking-wide">New</span>
            )}
        </button>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div 
            className="w-full max-w-3xl bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 font-sans"
            onClick={(e) => e.stopPropagation()}
        >
            
            {/* Search Bar */}
            <div className="p-4 flex items-center gap-3 bg-[#1a1a1a]">
                {view !== 'grid' && (
                    <button onClick={() => setView('grid')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                )}
                
                <div className="flex-1 relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder={getPlaceholder()}
                        className="w-full bg-[#111] border border-gray-700 rounded-full pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus={view !== 'grid'}
                    />
                    {inputValue ? (
                        <button onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    ) : (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <Clipboard size={14} />
                        </div>
                    )}
                </div>
                
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="p-4 pt-0 overflow-y-auto custom-scrollbar bg-[#1a1a1a] flex-1">
                
                {view === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MenuButton icon={Link} label="Link" theme="purple" onClick={() => setView('link')} />
                        <MenuButton icon={Camera} label="Camera" theme="blue" onClick={startCamera} />
                        <MenuButton icon={PenTool} label="Draw" theme="red" onClick={() => setView('drawing')} />
                        <MenuButton icon={Film} label="GIF" theme="orange" onClick={() => setView('gif')} />
                    </div>
                )}

                {view === 'camera' && (
                    <div className="flex flex-col items-center pt-2">
                        <video ref={videoRef} autoPlay playsInline className="w-full bg-black rounded-lg object-cover mb-3 h-[300px]" />
                        <canvas ref={canvasRef} width={320} height={240} className="hidden" />
                        <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-all"></button>
                    </div>
                )}

                {view === 'drawing' && (
                    <div className="space-y-2 pt-2 flex flex-col h-full">
                        <canvas 
                            ref={drawCanvasRef}
                            width={700}
                            height={400}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={() => setIsDrawing(false)}
                            onMouseLeave={() => setIsDrawing(false)}
                            className="w-full flex-1 bg-[#222] rounded-lg cursor-crosshair touch-none border border-white/10"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={finishDrawing} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold">Add Drawing</button>
                        </div>
                    </div>
                )}

                {view === 'link' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
                            <Link size={32} />
                        </div>
                        <p className="text-base text-gray-400">Paste a link above and press Enter</p>
                        <button onClick={handleLinkSubmit} className="text-blue-400 text-sm font-bold hover:underline">Add Link</button>
                    </div>
                )}

                {view === 'gif' && (
                    <div className="space-y-2 pt-2">
                        {isLoading ? (
                             <div className="h-64 flex items-center justify-center flex-col gap-3">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                                <p className="text-sm text-gray-500">Searching GIFs...</p>
                            </div>
                        ) : (
                            <>
                                {gifResults.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500">
                                        <Film size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No GIFs found for "{inputValue}"</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {gifResults.map((gif, idx) => (
                                            <div key={idx} className="group relative">
                                                <img 
                                                    src={gif.url} 
                                                    alt={gif.title} 
                                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => handleGifSelect(gif.url)}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[90%] pointer-events-none">
                                                    {gif.title || 'GIF'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                
            </div>
        </div>
    </div>,
    document.body
  );
};