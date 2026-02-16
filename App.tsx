
import React, { useState, useEffect, Suspense, useRef, ReactNode, ErrorInfo, Component } from 'react';
import { supabase } from './services/supabaseClient';
import { AuthPage } from './components/AuthPage';
import { GuestNameModal } from './components/GuestNameModal';
import { CreateBoardModal } from './components/CreateBoardModal';
import { DuplicateModal } from './components/DuplicateModal'; 
import { Board, BoardFormat, Note, UserProfile } from './types';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { boardService } from './services/boardService';
import { profileService } from './services/profileService';
import { noteService } from './services/noteService';
import { mapBoard } from './utils/mappers';
import './src/index.css';

const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const StudentDashboard = React.lazy(() => import('./components/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const BoardView = React.lazy(() => import('./components/BoardView').then(module => ({ default: module.BoardView })));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-4 text-center font-sans">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">The application encountered an unexpected error. Please try reloading.</p>
          
          <div className="bg-black/50 p-4 rounded-lg border border-white/10 text-left w-full max-w-2xl overflow-auto max-h-60 mb-6">
            <code className="text-xs text-red-300 font-mono">
                {this.state.error?.toString()}
            </code>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingScreen = () => (
    <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="animate-spin text-pink-500" size={48} />
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading Experience...</p>
    </div>
);

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'auth' | 'dashboard' | 'board'>('auth');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('');
  const [guestId, setGuestId] = useState<string>(''); 

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  
  const [duplicateModal, setDuplicateModal] = useState<{ isOpen: boolean; boardId: string | null }>({ isOpen: false, boardId: null });

  const [accessCheckStatus, setAccessCheckStatus] = useState<'idle' | 'checking' | 'allowed' | 'denied'>('idle');

  const activeBoardIdRef = useRef<string | null>(null);
  useEffect(() => { activeBoardIdRef.current = activeBoardId; }, [activeBoardId]);

  useEffect(() => {
    const initializeApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const params = new URLSearchParams(window.location.search);
      const boardId = params.get('board');

      if (session) {
        await fetchProfile();
        if (boardId) {
          const board = await boardService.getBoardById(boardId);
          if (board) {
            setBoards([board]);
            setActiveBoardId(boardId);
            setView('board');
          } else {
            setView('dashboard');
          }
        } else {
          await fetchBoards();
          setView('dashboard');
        }
      } else if (boardId) {
        setAccessCheckStatus('checking');
        const { data: board, error } = await supabase
            .from('boards')
            .select('id, is_public, is_published, assessmentConfig, format, owner_id, title, description, wallpaper')
            .eq('id', boardId)
            .maybeSingle();

        if (error || !board) {
            setAccessCheckStatus('denied');
        } else {
            const isPublic = board.is_public;
            const isLive = board.is_published;
            const assessmentConfig = board.assessmentConfig as any;
            const isQuizActive = board.format === 'quiz' && board.quizState && board.quizState !== 'setup';
            const isAssessmentActive = board.format === 'assessment' && assessmentConfig?.status === 'active';

            if (isPublic || isLive || isQuizActive || isAssessmentActive) {
                setBoards([mapBoard(board as any)]);
                setActiveBoardId(board.id);
                setAccessCheckStatus('allowed');
            } else {
                setAccessCheckStatus('denied');
            }
        }
      }

      setLoading(false);
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        if (newSession) {
            setIsGuest(false);
            fetchProfile();
            const params = new URLSearchParams(window.location.search);
            const boardId = params.get('board');
            if (!boardId) {
                setView('dashboard');
            }
        } else if (!isGuest) {
            const params = new URLSearchParams(window.location.search);
            const boardId = params.get('board');
            if (!boardId) {
                setView('auth');
            }
        }
    });

    return () => {
        subscription.unsubscribe();
    };
}, [isGuest]);

  const fetchProfile = async () => {
      try {
        const profile = await profileService.getCurrentProfile();
        setUserProfile(profile);
      } catch (e) {
          console.error("Failed to fetch profile", e);
      }
  };

  const fetchBoards = async () => {
    try {
        const data = await boardService.getBoards();
        setBoards(data);
    } catch (e) {
        console.error("Failed to fetch boards", e);
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
      const handlePopState = () => {
          const params = new URLSearchParams(window.location.search);
          const boardId = params.get('board');
          if (boardId) {
              setBoardError(null);
              setActiveBoardId(boardId);
              setView('board');
          } else {
              setActiveBoardId(null);
              setView(session || isGuest ? 'dashboard' : 'auth');
          }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [session, isGuest]);

  useEffect(() => {
      if (!activeBoardId) return;

      const channel = supabase.channel(`board_gate_${activeBoardId}`)
          .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${activeBoardId}` },
              (payload) => {
                  if (payload.new) {
                      const updatedBoard = mapBoard(payload.new as any);
                      
                      setBoards((currentBoards) => 
                          currentBoards.map(b => b.id === updatedBoard.id ? updatedBoard : b)
                      );
                      
                      const isPublic = updatedBoard.is_public;
                      const isLive = updatedBoard.is_published;
                      const isQuizActive = updatedBoard.format === 'quiz' && updatedBoard.quizState && updatedBoard.quizState !== 'setup';
                      
                      if (isPublic || isLive || isQuizActive) {
                          setAccessCheckStatus('allowed');
                      }
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [activeBoardId]);

   useEffect(() => {
      if (!session && !isGuest) return;
      const channel = supabase.channel('public:boards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, (payload) => {
          if (payload.new) {
             const freshBoard = mapBoard(payload.new as any);
             setBoards(prev => {
                  const idx = prev.findIndex(b => b.id === freshBoard.id);
                  if (idx > -1) {
                      const newBoards = [...prev];
                      newBoards[idx] = freshBoard;
                      return newBoards;
                  }
                  return [freshBoard, ...prev]; 
             });
          }
      })
      .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [session, isGuest]);

  const createBoard = (format: BoardFormat, templateData?: Partial<Board>, initialNotes?: Note[]) => {
      if (!templateData) {
          setIsCreateModalOpen(true);
      } else {
          handleCreateBoard(format, templateData, initialNotes);
      }
  };

  const handleCreateBoard = async (format: BoardFormat, templateData: Partial<Board> = {}, initialNotes: Note[] = []) => {
      setIsCreatingBoard(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          setIsCreatingBoard(false);
          return;
      }

      try {
          const newBoard = await boardService.createBoard({
              ...templateData,
              format,
          }, user.id);

          if (newBoard) {
              if (initialNotes.length > 0) {
                  const rawPayload = initialNotes.map(n => ({
                      ...n,
                      board_id: newBoard.id,
                      author_id: user.id,
                  }));
                  await supabase.from('notes').insert(rawPayload);
              }
              
              setBoards(prev => [newBoard, ...prev]);
              setActiveBoardId(newBoard.id);
              setView('board');
              
              const newUrl = `${window.location.pathname}?board=${newBoard.id}`;
              window.history.pushState({ path: newUrl }, '', newUrl);
              
              setIsCreateModalOpen(false);
          }
      } catch (e) {
          console.error("Failed to create board", e);
      } finally {
          setIsCreatingBoard(false);
      }
  };

  const selectBoard = (id: string) => {
      setActiveBoardId(id);
      setView('board');
      
      const newUrl = `${window.location.pathname}?board=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleDeleteBoard = async (id: string) => {
      try {
          setBoards(boards.filter(b => b.id !== id));
          await boardService.updateBoard(id, { isTrashed: true, deletedAt: new Date() });
      } catch (e) {
          console.error("Failed to delete board", e);
      }
  };

  const handleUpdateBoard = async (id: string, updates: Partial<Board>) => {
      setBoards(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      await boardService.updateBoard(id, updates);
  };

  const handleDuplicateBoard = async (id: string) => {
      const boardToDup = boards.find(b => b.id === id);
      if (boardToDup) {
          setDuplicateModal({ isOpen: true, boardId: id });
      }
  };

  const executeDuplicate = async (options: { includeNotes: boolean; onlyPinned: boolean }) => {
      const boardId = duplicateModal.boardId;
      if (!boardId) return;
      
      const boardToDup = boards.find(b => b.id === boardId);
      if (!boardToDup) return;

      setDuplicateModal({ isOpen: false, boardId: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const overrideSettings: Partial<Board> = {
          title: `${boardToDup.title} (Copy)`,
          is_favorite: false,
          is_published: false,
          is_public: false,
          quizState: 'setup',
          current_step_index: 0,
          assessmentState: 'setup',
          assessmentConfig: boardToDup.assessmentConfig ? {
              ...boardToDup.assessmentConfig,
              status: 'setup',
              startTime: 0
          } : undefined,
          currentPollIndex: 0
      };

      try {
          const newBoard = await boardService.createBoard({
              ...boardToDup,
              ...overrideSettings
          }, user.id);

          setBoards(prev => [newBoard, ...prev]);

          if (options.includeNotes) {
              const notes = await noteService.getNotes(boardId);
              const notesToCopy = notes.filter(n => {
                  if (n.author_id !== user.id) return false;
                  if (options.onlyPinned && !n.is_pinned) return false;
                  return true;
              });

              if (notesToCopy.length > 0) {
                  const newNotesPayload = notesToCopy.map(n => ({
                      ...n,
                      board_id: newBoard.id,
                      author_id: user.id,
                      author_avatar: userProfile?.avatar_url,
                      likes: 0,
                      comments: [],
                      liked_by: [],
                  }));
                  await supabase.from('notes').insert(newNotesPayload);
              }
          }
      } catch (e) {
          console.error("Failed to duplicate board", e);
          alert("Failed to duplicate board.");
      }
  };

  const handleToggleFavorite = async (id: string) => {
      const board = boards.find(b => b.id === id);
      if (board) {
          const newVal = !board.is_favorite;
          handleUpdateBoard(id, { is_favorite: newVal });
      }
  };

  const handleEmptyTrash = async () => {
      const trashedIds = boards.filter(b => b.isTrashed).map(b => b.id);
      setBoards(prev => prev.filter(b => !b.isTrashed));
      if (trashedIds.length > 0) {
          await supabase.from('boards').delete().in('id', trashedIds);
      }
  };

  const handleJoinByCode = async (code: string) => {
      const { data: board, error } = await supabase
          .from('boards')
          .select('*')
          .eq('class_code', code)
          .single();
      
      if (error || !board) return false;

      setActiveBoardId(board.id);
      setView('board');
      
      const newUrl = `${window.location.pathname}?board=${board.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      
      return true;
  };

  const handleGuestLogin = (name: string, avatarUrl: string) => {
      const guestUser = {
          id: `guest-${Math.random().toString(36).substr(2, 9)}`,
          email: 'guest@classboard.ai',
          user_metadata: {
              full_name: name,
              avatar_url: avatarUrl
          }
      };
      
      setSession({ user: guestUser });
      setIsGuest(true);
      setGuestName(name);
      setGuestAvatar(avatarUrl);
      setGuestId(guestUser.id);
      
      const params = new URLSearchParams(window.location.search);
      const boardId = params.get('board');
      if (boardId) {
          setActiveBoardId(boardId);
          setView('board');
      } else {
          setView('dashboard');
      }
  };

  if (loading) return <LoadingScreen />;

  if (!session && !isGuest && view === 'auth') {
      return (
          <>
            {accessCheckStatus === 'checking' && <LoadingScreen />}
            {accessCheckStatus !== 'checking' && (
                <>
                    {(accessCheckStatus === 'allowed' || (new URLSearchParams(window.location.search).get('board') && accessCheckStatus !== 'denied')) ? (
                        <GuestNameModal onConfirm={handleGuestLogin} />
                    ) : (
                        <AuthPage onLoginSuccess={() => {}} initialError={accessCheckStatus === 'denied' ? "This board is private or does not exist." : undefined} />
                    )}
                </>
            )}
          </>
      );
  }

  if (view === 'board' && activeBoardId) {
      const activeBoard = boards.find(b => b.id === activeBoardId);
      
      if (!activeBoard && boardError) {
          return (
              <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-white gap-6 p-4 text-center animate-in fade-in">
                  <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/20 shadow-2xl">
                      <ShieldAlert size={48} className="text-red-500" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black mb-2 tracking-tight">Access Denied</h2>
                      <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">{boardError}</p>
                  </div>
                  <button 
                      onClick={() => { setActiveBoardId(null); setView('dashboard'); setBoardError(null); window.history.pushState({}, '', '/'); }}
                      className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg mt-4"
                  >
                      Return Home
                  </button>
              </div>
          );
      }

      if (!activeBoard) {
          return <LoadingScreen />;
      }

      const effectiveUsername = isGuest ? guestName : userProfile?.full_name;
      const effectiveAvatar = isGuest ? guestAvatar : userProfile?.avatar_url;
      const effectiveUserId = isGuest ? guestId : (session?.user?.id);
      const effectiveRole = isGuest ? 'student' : userProfile?.role; 
      const isStudent = effectiveRole === 'student';
      
      const isQuizActive = activeBoard.format === 'quiz' && activeBoard.quizState && activeBoard.quizState !== 'setup';
      const isAssessmentActive = activeBoard.format === 'assessment' && (activeBoard.assessmentConfig?.status === 'inprogress' || activeBoard.assessmentConfig?.status === 'reading');
      
      const isAllowed = !isStudent || activeBoard.is_published || isQuizActive || isAssessmentActive || activeBoard.owner_id === effectiveUserId;

      if (!isAllowed) {
           return (
              <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-white gap-6 p-4 text-center animate-in fade-in">
                  <div className="w-24 h-24 bg-yellow-900/20 rounded-full flex items-center justify-center border border-yellow-500/20 shadow-2xl">
                      <Loader2 size={48} className="text-yellow-500 animate-spin" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black mb-2 tracking-tight">Waiting for Teacher</h2>
                      <p className="text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
                          This board is currently in draft mode. Please wait for your teacher to publish it.
                      </p>
                  </div>
                  <button 
                      onClick={() => { setActiveBoardId(null); setView('dashboard'); window.history.pushState({}, '', '/'); }}
                      className="bg-white/10 text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors shadow-lg mt-4"
                  >
                      Back to Dashboard
                  </button>
              </div>
           );
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const isPresentationMode = urlParams.get('present') === 'true';

      return (
          <Suspense fallback={<LoadingScreen />}>
              <BoardView 
                  board={activeBoard}
                  onBack={() => {
                      setActiveBoardId(null);
                      setView('dashboard');
                      window.history.pushState({}, '', '/');
                  }}
                  onUpdateBoard={(updates) => handleUpdateBoard(activeBoard.id, updates)}
                  theme={theme}
                  onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  username={effectiveUsername}
                  userAvatar={effectiveAvatar}
                  userId={effectiveUserId}
                  isStudent={isStudent}
                  userRole={effectiveRole}
                  isPresentationMode={isPresentationMode}
              />
          </Suspense>
      );
  }

  return (
      <Suspense fallback={<LoadingScreen />}>
          {userProfile?.role === 'student' || isGuest ? (
              <StudentDashboard 
                  boards={boards}
                  onSelectBoard={selectBoard}
                  theme={theme}
                  onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  username={isGuest ? guestName : userProfile?.full_name}
                  userAvatar={isGuest ? guestAvatar : userProfile?.avatar_url}
                  userClasses={userProfile?.enrolled_classes}
              />
          ) : (
              <Dashboard 
                  boards={boards}
                  onCreateBoard={createBoard}
                  onSelectBoard={selectBoard}
                  onDeleteBoard={handleDeleteBoard}
                  onDuplicateBoard={handleDuplicateBoard}
                  onToggleFavorite={handleToggleFavorite}
                  onEmptyTrash={handleEmptyTrash}
                  onUpdateBoard={handleUpdateBoard}
                  theme={theme}
                  onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  username={userProfile?.full_name}
                  userAvatar={userProfile?.avatar_url}
                  userId={session?.user?.id}
                  onJoinByCode={handleJoinByCode}
              />
          )}

          <DuplicateModal 
              isOpen={duplicateModal.isOpen}
              onClose={() => setDuplicateModal({ isOpen: false, boardId: null })}
              onConfirm={executeDuplicate}
              boardTitle={boards.find(b => b.id === duplicateModal.boardId)?.title || 'Board'}
          />

          <CreateBoardModal 
              isOpen={isCreateModalOpen} 
              onClose={() => setIsCreateModalOpen(false)}
              onCreate={(format) => handleCreateBoard(format)}
              isCreating={isCreatingBoard}
          />
      </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
