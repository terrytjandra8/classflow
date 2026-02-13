
import React, { useState, useEffect } from 'react';
import { User, Shuffle, ArrowRight, RefreshCw } from 'lucide-react';

interface GuestNameModalProps {
  onConfirm: (name: string, avatarUrl: string) => void;
}

const ADJECTIVES = [
    'Cosmic', 'Super', 'Happy', 'Swift', 'Brave', 'Clever', 'Bright', 'Calm', 'Cool', 'Lucky',
    'Mega', 'Neon', 'Turbo', 'Wild', 'Zesty', 'Magic', 'Epic', 'Jolly', 'Rapid', 'Silent',
    'Hyper', 'Cyber', 'Pixel', 'Sonic', 'Ultra', 'Giga', 'Nano', 'Tech', 'Digital', 'Smart'
];

const NOUNS = [
    'Panda', 'Tiger', 'Eagle', 'Fox', 'Wolf', 'Bear', 'Lion', 'Hawk', 'Owl', 'Shark',
    'Dolphin', 'Whale', 'Dragon', 'Phoenix', 'Falcon', 'Badger', 'Otter', 'Koala', 'Bunny', 'Cat',
    'Robot', 'Droid', 'Cyborg', 'Bot', 'Agent', 'Pilot', 'Coder', 'Gamer', 'Ninja', 'Wizard'
];

export const GuestNameModal: React.FC<GuestNameModalProps> = ({ onConfirm }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Generate a random name on mount
  useEffect(() => {
      generateName();
  }, []);

  // Update avatar whenever name changes
  useEffect(() => {
      if (name) {
          const seed = encodeURIComponent(name);
          // Using 'bottts' style for that AI/Tech vibe
          setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`);
      }
  }, [name]);

  const generateName = () => {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const num = Math.floor(Math.random() * 99) + 1;
      const newName = `${adj} ${noun} ${num}`;
      setName(newName);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
          onConfirm(name.trim(), avatarUrl);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          {/* Decorative Elements */}
          <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
              
              {/* Avatar Preview */}
              <div className="w-24 h-24 mx-auto mb-6 relative group cursor-pointer" onClick={generateName}>
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border-2 border-white/10 flex items-center justify-center shadow-lg overflow-hidden relative z-10">
                      {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                          <User size={32} className="text-white/50" />
                      )}
                  </div>
                  
                  {/* Floating Refresh Icon */}
                  <div className="absolute bottom-0 right-0 bg-white text-black p-1.5 rounded-full shadow-lg transform group-hover:rotate-180 transition-all duration-500 z-20">
                      <RefreshCw size={14} />
                  </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Guest!</h2>
              <p className="text-gray-400 text-xs mb-8">We've assigned you a temporary identity. <br/>Feel free to change it below.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                      <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          maxLength={25}
                          className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-center text-white text-lg font-bold placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:bg-black/50 transition-colors"
                          autoFocus
                      />
                      <button 
                          type="button" 
                          onClick={generateName}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-yellow-400 transition-colors"
                          title="Generate Random Name"
                      >
                          <Shuffle size={18} />
                      </button>
                  </div>
                  
                  <button 
                      type="submit"
                      disabled={!name.trim()}
                      className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
                  >
                      Continue to Board <ArrowRight size={18} />
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
};
