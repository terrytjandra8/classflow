import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Heart, Sparkles, Layout, School, ShieldCheck, User, ArrowRight, X } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: () => void;
  initialError?: string;
}

// Expanded Themes List (11 Total)
const THEMES = [
  {
    name: 'Cosmic',
    bg: 'bg-gradient-to-br from-[#0f0f13] via-[#1a1a2e] to-[#0f0f13]',
    blob1: 'bg-purple-600',
    blob2: 'bg-pink-600',
    blob3: 'bg-indigo-600'
  },
  {
    name: 'Oceanic',
    bg: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]',
    blob1: 'bg-blue-600',
    blob2: 'bg-cyan-500',
    blob3: 'bg-teal-600'
  },
  {
    name: 'Nature',
    bg: 'bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#052e16]',
    blob1: 'bg-green-600',
    blob2: 'bg-emerald-500',
    blob3: 'bg-lime-600'
  },
  {
    name: 'Sunset',
    bg: 'bg-gradient-to-br from-[#2a0a0a] via-[#450a0a] to-[#2a0a0a]',
    blob1: 'bg-orange-600',
    blob2: 'bg-rose-500',
    blob3: 'bg-red-600'
  },
  {
    name: 'Royal',
    bg: 'bg-gradient-to-br from-[#170526] via-[#2e1065] to-[#170526]',
    blob1: 'bg-violet-600',
    blob2: 'bg-fuchsia-500',
    blob3: 'bg-purple-600'
  },
  {
    name: 'Midnight',
    bg: 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950',
    blob1: 'bg-indigo-800',
    blob2: 'bg-blue-900',
    blob3: 'bg-slate-800'
  },
  // New Variations
  {
    name: 'Cherry Blossom',
    bg: 'bg-gradient-to-br from-[#370b18] via-[#500724] to-[#370b18]',
    blob1: 'bg-pink-400',
    blob2: 'bg-rose-300',
    blob3: 'bg-red-400'
  },
  {
    name: 'Northern Lights',
    bg: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22]',
    blob1: 'bg-teal-400',
    blob2: 'bg-green-400',
    blob3: 'bg-purple-500' // Aurora mix
  },
  {
    name: 'Golden Hour',
    bg: 'bg-gradient-to-br from-[#422006] via-[#713f12] to-[#422006]',
    blob1: 'bg-yellow-500',
    blob2: 'bg-orange-500',
    blob3: 'bg-amber-600'
  },
  {
    name: 'Cyberpunk',
    bg: 'bg-gradient-to-br from-[#09090b] via-[#18181b] to-[#09090b]',
    blob1: 'bg-yellow-400', // Cyber yellow
    blob2: 'bg-cyan-400',   // Cyber blue
    blob3: 'bg-fuchsia-500' // Cyber pink
  },
  {
    name: 'Frost',
    bg: 'bg-gradient-to-br from-[#082f49] via-[#0c4a6e] to-[#082f49]',
    blob1: 'bg-sky-400',
    blob2: 'bg-blue-300',
    blob3: 'bg-white'
  }
];

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, initialError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  
  // Guest Mode State
  const [classCode, setClassCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  
  // Random theme on mount
  const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);

  useEffect(() => {
      if (initialError) setError(initialError);
  }, [initialError]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!classCode.trim() || classCode.length < 6) return;
      
      setIsCheckingCode(true);
      setError(null);

      try {
          const { data: board, error } = await supabase
              .from('boards')
              .select('id, settings, is_public, format, is_published')
              .eq('class_code', classCode.trim().toUpperCase())
              .single();

          if (error || !board) {
              setError("Join code not found. Please double check.");
              setIsCheckingCode(false);
              return;
          }

          const isPublic = board.is_public === true || (board.settings as any)?.isPublic === true;
          const isPublished = board.is_published === true;
          
          const settings = board.settings as any;
          const isQuizActive = board.format === 'quiz' && settings?.quizState && settings?.quizState !== 'setup';

          if (isPublic || isPublished || isQuizActive) {
              window.location.href = `/?board=${board.id}`;
          } else {
              setShowAccessDenied(true);
          }

      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsCheckingCode(false);
      }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${theme.bg} animate-gradient-x text-white p-4 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white`}>
      
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${theme.blob1} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob`}></div>
          <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 ${theme.blob2} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000`}></div>
          <div className={`absolute -bottom-32 left-20 w-96 h-96 ${theme.blob3} rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000`}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-10 transform hover:scale-105 transition-transform duration-500">
          <div className="relative inline-block mb-4">
             <div className="w-20 h-20 relative mx-auto">
                <div className="absolute top-0 left-0 w-16 h-16 bg-yellow-400 rounded-xl transform -rotate-12 shadow-lg border border-white/10"></div>
                <div className="absolute top-2 left-4 w-16 h-16 bg-blue-500 rounded-xl transform rotate-6 shadow-lg border border-white/10"></div>
                <div className="absolute top-4 left-2 w-16 h-16 bg-pink-600 rounded-xl transform -rotate-3 shadow-2xl flex items-center justify-center border border-white/10 z-10">
                    <Layout className="text-white w-8 h-8" />
                </div>
                <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-6 h-6 animate-pulse" />
             </div>
          </div>
          
          <h1 className="text-5xl font-extrabold mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-gray-400 drop-shadow-sm">
            ClassBoards
          </h1>
          <p className="text-lg text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
            The interactive classroom wall for creative minds.
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
          
          {/* Access Denied Overlay */}
          {showAccessDenied && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-6 relative">
                      <img src="https://media.giphy.com/media/uOAXDA7ZeJJzW/giphy.gif" alt="Access Denied" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 ring-4 ring-red-500/50 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-red-500 mb-2">Access Denied!</h3>
                  <p className="text-gray-300 text-sm mb-6">
                      You didn't say the magic word! <br/>This board is private. Please log in to access.
                  </p>
                  <button 
                    onClick={() => setShowAccessDenied(false)}
                    className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                  >
                      Okay, I'll Log In
                  </button>
              </div>
          )}

          <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <School size={20} className="text-pink-400" /> 
                Student Login
              </h2>
              <div className="inline-flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-pink-300 uppercase tracking-wide">
                  <ShieldCheck size={10} /> IPEKA Integrated School
              </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm mb-6 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transform hover:-translate-y-0.5 active:translate-y-0"
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-pink-600" size={20} />
                        <span className="text-gray-500">Connecting...</span>
                    </div>
                ) : (
                    <>
                    <div className="p-1 bg-white rounded-full">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                    </div>
                    <span className="text-base">Continue with Google</span>
                    </>
                )}
            </button>
            
            <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                 <p className="text-xs text-gray-400 mb-1 font-medium">Please use your school email:</p>
                 <code className="text-xs text-pink-400 font-mono bg-black/30 px-2 py-1 rounded">@integrated.ipeka.sch.id</code>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-6 opacity-50">
              <div className="h-px bg-white/30 flex-1"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">OR</span>
              <div className="h-px bg-white/30 flex-1"></div>
          </div>

          {/* GUEST ACCESS SECTION */}
          <form onSubmit={handleGuestJoin} className="space-y-3">
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-500" />
                  </div>
                  <input 
                      type="text" 
                      placeholder="Enter Join Code"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-[#222] transition-colors font-mono tracking-wider"
                  />
                  {classCode.length === 6 && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                  )}
              </div>
              <button 
                  type="submit"
                  disabled={isCheckingCode || classCode.length < 6}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold py-3 rounded-xl transition-all border border-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                  {isCheckingCode ? <Loader2 size={16} className="animate-spin" /> : <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">Join as Guest <ArrowRight size={16} /></span>}
              </button>
          </form>

          <div className="mt-6 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Access</p>
          </div>
        </div>
        
        {/* Custom Footer */}
        <div className="mt-12 text-center animate-fade-in">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5 font-medium bg-black/20 backdrop-blur-md py-2 px-4 rounded-full inline-block border border-white/5 shadow-lg">
                Made with <Heart size={14} className="text-pink-500 fill-pink-500 animate-pulse-slow" /> by your teacher, <span className="text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">T7</span>
            </p>
        </div>
      </div>
    </div>
  );
};
