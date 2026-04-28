
import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, Check, Hash, Link as LinkIcon, Edit2, Save, Loader2, RefreshCw, Maximize2, Users } from 'lucide-react';
import { Board } from '../types';
import { supabase } from '../services/supabaseClient';
import { Tooltip } from './Tooltip';
import { PresentationMode } from './Share/PresentationMode';
import { CollaboratorManager } from './Share/CollaboratorManager';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  onUpdateBoard?: (updates: Partial<Board>) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, board, onUpdateBoard }) => {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [privacy, setPrivacy] = useState<'secret' | 'public' | 'private'>('secret');
  const [isPresenting, setIsPresenting] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  
  // Code State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  // Custom Slug State
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState(board.customSlug || board.id);

  // Sync state with prop if board changes
  useEffect(() => {
    setCustomSlug(board.customSlug || board.id);
    if (board.classCode) {
        setGeneratedUrl(`${window.location.origin}/?code=${board.classCode}`);
    }
  }, [board.customSlug, board.id, board.classCode]);

  // Handle ESC to exit presentation
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') setIsPresenting(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?board=${customSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      navigator.clipboard.writeText(board.classCode || '');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveSlug = () => {
      if (onUpdateBoard && customSlug.trim()) {
          onUpdateBoard({ customSlug: customSlug.trim() });
          setIsEditingSlug(false);
      }
  };

  const generateNewCode = async () => {
      setIsGenerating(true);
      
      // Generate random 6-char code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
      let newCode = '';
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Update Board
      if (onUpdateBoard) {
          onUpdateBoard({ classCode: newCode });
          await supabase.from('boards').update({ class_code: newCode }).eq('id', board.id);
      }
      
      setGeneratedUrl(`${window.location.origin}/?code=${newCode}`);
      setIsGenerating(false);
  };

  // Check if it's a quiz to apply special styling
  const isQuiz = board.format === 'quiz';

  const containerClass = isQuiz 
    ? "bg-[#0f0720] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-white" 
    : "bg-[#1a1a1a] text-white border border-white/10 shadow-2xl";

  const headerClass = isQuiz
    ? "bg-[#1a0b2e] border-b border-purple-500/20"
    : "bg-[#161616] border-b border-white/5";

  const highlightClass = isQuiz
    ? "bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30"
    : "bg-gradient-to-r from-pink-900/20 to-purple-900/20 border-white/10";

  const buttonClass = isQuiz
    ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
    : "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400";

  // --- PRESENTATION MODE VIEW ---
  if (isPresenting) {
      return <PresentationMode board={board} onClose={() => setIsPresenting(false)} />;
  }

  // --- STANDARD MODAL VIEW ---
  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-300 animate-fade-in ${!board.settings?.disableModalBlur ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className={`rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${containerClass}`}>
        
        <div className={`p-4 flex items-center justify-between ${headerClass}`}>
            <h2 className={`font-bold text-lg ${isQuiz ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-white'}`}>
                {isQuiz ? 'Invite Players' : 'Share Board'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-white/5 bg-[#111]">
            <button 
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'student' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Students
            </button>
            <button 
                onClick={() => setActiveTab('teacher')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'teacher' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Users size={12} /> Teachers
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {activeTab === 'teacher' ? (
                <CollaboratorManager board={board} onUpdateBoard={onUpdateBoard!} />
            ) : (
                <>
                    {/* PART 1: Random Code Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-gray-400 uppercase text-xs font-bold tracking-wider">
                            <div className="flex items-center gap-2"><Hash size={12} /> Join Code</div>
                        </div>
                        
                        <div className={`border rounded-xl p-6 text-center relative group ${highlightClass}`}>
                            <button 
                                onClick={() => setIsPresenting(true)}
                                className="absolute top-3 right-3 p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                title="Projector Mode"
                            >
                                <Maximize2 size={20} />
                            </button>

                            <p className="text-gray-400 text-xs mb-4">Share this code with students to join instantly.</p>
                            
                            <div className="flex items-center justify-center gap-3 mb-4 relative">
                                <Tooltip content={codeCopied ? "Copied!" : "Click to copy"}>
                                    <button 
                                        onClick={handleCopyCode}
                                        className={`rounded-lg py-3 px-6 text-center font-mono text-3xl font-bold uppercase tracking-[0.2em] text-white shadow-inner transition-all duration-300 ${isQuiz ? 'bg-purple-900/40 border-purple-500/50 hover:bg-purple-800/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-black/30 border border-white/20 hover:scale-105 hover:border-white/40'}`}
                                    >
                                        {board.classCode || '------'}
                                    </button>
                                </Tooltip>
                            </div>
                            
                            <button 
                                onClick={generateNewCode}
                                disabled={isGenerating}
                                className={`text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors ${isQuiz ? 'text-purple-400 hover:text-purple-300' : 'text-pink-400 hover:text-pink-300'}`}
                            >
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                {board.classCode ? 'Regenerate Code' : 'Generate Code'}
                            </button>

                            {/* QR Code Display */}
                            {board.classCode && (
                                <div className="flex flex-col items-center animate-fade-in mt-6 pt-4 border-t border-white/10 cursor-pointer" onClick={() => setIsPresenting(true)}>
                                    <div className={`bg-white p-2 rounded-lg mb-3 shadow-lg transition-shadow ${isQuiz ? 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'group-hover:shadow-pink-500/20'}`}>
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedUrl || `${window.location.origin}/?code=${board.classCode}`)}`}
                                            alt="QR Code"
                                            className="w-32 h-32 object-contain aspect-square"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1 group-hover:text-white transition-colors">
                                        <Maximize2 size={10} /> Click to Present
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/5"></div>

                    {/* Custom Link Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
                            <LinkIcon size={12} /> Board Link
                        </div>

                        <div className={`rounded-xl p-3 border ${isQuiz ? 'bg-[#150a25] border-purple-500/20' : 'bg-[#111] border-white/10'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-gray-500 text-sm">.../?board=</span>
                                {isEditingSlug ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input 
                                        type="text" 
                                        value={customSlug}
                                        onChange={(e) => setCustomSlug(e.target.value)}
                                        className="flex-1 bg-black border border-blue-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                        autoFocus
                                        />
                                        <button onClick={handleSaveSlug} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            <Save size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-between group">
                                        <span className="font-bold text-white text-sm truncate">{board.customSlug || board.id}</span>
                                        <button onClick={() => setIsEditingSlug(true)} className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleCopyLink}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${buttonClass}`}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied link' : 'Copy link to clipboard'}
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-white/5"></div>

                    {/* Privacy Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
                            <Lock size={12} /> Privacy
                        </div>
                        
                        <div className={`border rounded-xl overflow-hidden ${isQuiz ? 'bg-[#150a25] border-purple-500/20' : 'bg-[#111] border-white/10'}`}>
                            <button 
                                onClick={() => setPrivacy('secret')}
                                className={`w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors ${privacy === 'secret' ? 'bg-white/5' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                                        <Lock size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Secret</div>
                                        <div className="text-xs text-gray-500">Hidden from public. Accessible by code.</div>
                                    </div>
                                </div>
                                {privacy === 'secret' && <Check size={16} className="text-amber-500" />}
                            </button>
                            <button 
                                onClick={() => setPrivacy('public')}
                                className={`w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors ${privacy === 'public' ? 'bg-white/5' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                                        <Globe size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Public</div>
                                        <div className="text-xs text-gray-500">Visible to the whole school.</div>
                                    </div>
                                </div>
                                {privacy === 'public' && <Check size={16} className="text-green-500" />}
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
      </div>
    </div>
  );
};
