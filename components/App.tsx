
import React, { useState, useEffect, Suspense, useRef, ReactNode, ErrorInfo, Component } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthPage } from './AuthPage';
import { GuestNameModal } from './GuestNameModal';
import { CreateBoardModal } from './CreateBoardModal';
import { DuplicateModal } from './DuplicateModal'; 
import { Board, BoardFormat, Note } from '../types';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { boardService } from '../services/boardService';
import { profileService } from '../services/profileService';
import { noteService } from '../services/noteService';
import { mapBoard } from '../utils/mappers';

// Lazy load heavy views
const Dashboard = React.lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));
const StudentDashboard = React.lazy(() => import('./StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const BoardView = React.lazy(() => import('./BoardView').then(module => ({ default: module.BoardView })));

// Error Boundary Component
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

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
  
  // Guest State
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('');
  const [guestId, setGuestId] = useState<string>(''); 

  // User Profile
  const [userRole, setUserRole] = useState<string>('student');
  const [userClasses, setUserClasses] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  
  // Duplicate Modal State
  const [duplicateModal, setDuplicateModal] = useState<{ isOpen: boolean; boardId: string | null }>({ isOpen: false, boardId: null });

  // Access Check State for Guests
  const [accessCheckStatus, setAccessCheckStatus] = useState<'idle' | 'checking' | 'allowed' | 'denied'>('idle');

  // Keep track of active board ID for realtime updates without breaking useEffect dependencies
  const activeBoardIdRef = useRef<string | null>(null);
  useEffect(() => { activeBoardIdRef.current = activeBoardId; }, [activeBoardId]);

  // Sync theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // FIX: Handle Ctrl+V bug
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
            const target = event.target as HTMLElement;
            const isEditable = target.isContentEditable || 
                               target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' ||
                               target.closest('.ProseMirror'); // Support for TipTap/ProseMirror editors

            if (isEditable) {
                // Stop the event from bubbling up to any global listeners
                event.stopPropagation();
            }
        }
    };

    // Listen in the capture phase to intercept the event early
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Handle Browser Back/Forward Navigation
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

  // REALTIME GATEKEEPER: Listen for Board Status Changes (Draft/Live)
  useEffect(() => {
      if (!activeBoardId) return;

      const channel = supabase.channel(`board_gate_${activeBoardId}`)
          .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${activeBoardId}` },
              (payload) => {
                  if (payload.new) {
                      // Immediately map and update the board in state using payload.new (No DB Call!)
                      // This forces a re-render of the "isAllowed" check below
                      const updatedBoard = mapBoard(payload.new as any);
                      
                      setBoards((currentBoards) => {
                          const exists = currentBoards.find(b => b.id === updatedBoard.id);
                          if (exists) {
                              return currentBoards.map(b => b.id === updatedBoard.id ? updatedBoard : b);
                          } else {
                              return [updatedBoard, ...currentBoards];
                          }
                      });
                      
                      // Also update access check status for guests immediately
                      const isPublic = updatedBoard.isPublic;
                      const isLive = updatedBoard.isPublished;
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

  // Load Session & Profile
  useEffect(() => {
    // Check URL immediately on mount
    const params = new URLSearchParams(window.location.search);
    const initialBoardId = params.get('board');
    
    // Safety timeout for loading
    const safetyTimeout = setTimeout(() => {
        setLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchProfile().finally(() => {
              clearTimeout(safetyTimeout);
              setLoading(false);
              // Handle deep link logic after auth confirmed
              if (initialBoardId) {
                  // Fetch the single board immediately to get fresh status
                  boardService.getBoardById(initialBoardId).then(freshBoard => {
                      if (freshBoard) {
                          setBoards([freshBoard]); // Ensure it exists in state
                          setActiveBoardId(initialBoardId);
                          setView('board');
                      }
                  });
              } else {
                  setView('dashboard');
              }
          });
      } else {
          clearTimeout(safetyLabel);
          setLoading(false);
          // Handle Guest/Public access or show Auth
          if (initialBoardId) {
              // We trigger the access check logic below
          }
      }
    }).catch(err => {
        console.error("Session check failed", err);
        clearTimeout(safetyTimeout);
        setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchProfile();
          setIsGuest(false);
          
          const currentParams = new URLSearchParams(window.location.search);
          const boardParam = currentParams.get('board');
          
          if (boardParam) {
              setView('board');
              setActiveBoardId(boardParam);
          } else {
              if (!activeBoardIdRef.current) {
                  setView('dashboard');
              }
          }
      } else if (!isGuest) {
          // Only redirect to auth if not in a guest session
          const currentParams = new URLSearchParams(window.location.search);
          // If viewing a public board, don't force auth immediately, let guest logic handle it
          if (!currentParams.get('board')) {
              setView('auth');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, [isGuest]);

  const fetchProfile = async () => {
      try {
        const profile = await profileService.getCurrentProfile();
        if (profile) {
            setUserRole(profile.role);
            setUserClasses(profile.enrolledClasses || []);
            setUsername(profile.fullName);
            setUserAvatar(profile.avatarUrl);
        }
      } catch (e) {
          console.error("Failed to fetch profile", e);
      }
  };

  // Check Board Access for Guests
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const boardIdParam = urlParams.get('board');

      const checkAccess = async () => {
          if (!boardIdParam || session || isGuest) {
              setAccessCheckStatus('idle');
              return;
          }

          setAccessCheckStatus('checking');
          try {
              // This is a one-time check on mount/URL change for unauthenticated users
              const { data: board, error } = await supabase
                  .from('boards')
                  .select('id, is_public, is_published, settings, format, owner_id, title, description, wallpaper')
                  .eq('id', boardIdParam)
                  .maybeSingle();

              if (error || !board) {
                  setAccessCheckStatus('denied');
                  return;
              }
              
              // Load this board into state so the listener can attach to it properly if we join
              setBoards([mapBoard(board as any)]);
              setActiveBoardId(board.id);

              const isPublic = board.is_public;
              const isLive = board.is_published;
              const settings = board.settings as any;
              const isQuizActive = board.format === 'quiz' && settings?.quizState && settings?.quizState !== 'setup';
              const isAssessmentActive = board.format === 'assessment';

              if (isPublic || isLive || isQuizActive || isAssessmentActive) {
                  setAccessCheckStatus('allowed');
              } else {
                  setAccessCheckStatus('denied');
              }
          } catch (e) {
              setAccessCheckStatus('denied');
          }
      };

      checkAccess();
  }, [session, isGuest]); // removed activeBoardId dep to prevent loops, relying on URL param

  // Fetch boards on dashboard load + auto-refresh every 10 seconds for live updates
  useEffect(() => {
      if (view !== 'dashboard' || (!session && !isGuest)) return;

      let isMounted = true;

      const loadBoards = async () => {
          try {
              const data = await boardService.getBoards();
              if (isMounted) setBoards(data);
          } catch (e) {
              // Silent fail — guest users without auth will hit this
              console.error("Board fetch error:", e);
          }
      };

      // Initial fetch
      loadBoards();

      // Poll every 10 seconds so students see newly-published boards without refreshing
      const interval = setInterval(loadBoards, 10000);

      return () => {
          isMounted = false;
          clearInterval(interval);
      };
  }, [view, session, isGuest]);


  // Subscribe to board changes in real-time
  useEffect(() => {
      if (!session && !isGuest) return;

      const handleBoardUpdate = (payload: any) => {
          if (payload.eventType === 'DELETE') {
              setBoards(prev => prev.filter(b => b.id !== payload.old.id));
              return;
          }

          if (payload.new) {
              const freshBoard = mapBoard(payload.new as any);
              setBoards(prev => {
                  const idx = prev.findIndex(b => b.id === freshBoard.id);
                  if (idx > -1) {
                      // Update existing board by merging
                      const newBoards = [...prev];
                      newBoards[idx] = { ...prev[idx], ...freshBoard };
                      return newBoards;
                  } else {
                      // Add new board
                      return [freshBoard, ...prev];
                  }
              });
          }
      };

      const channel = supabase.channel('public:boards')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, handleBoardUpdate)
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
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
                      board_id: newBoard.id,
                      content: n.content,
                      title: n.title,
                      author: n.author,
                      author_id: n.author_id,
                      type: n.type,
                      color: n.color,
                      x: n.x,
                      y: n.y,
                      section_id: n.sectionId
                  }));
                  await supabase.from('notes').insert(rawPayload);
              }
              
              // Optimistic Add with correct ownership for filters
              // Ensure we manually set owner_id if API response lags (though it shouldn't)
              const completeBoard = { ...newBoard, owner_id: user.id };

              setBoards(prev => [completeBoard, ...prev]);
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
          await boardService.updateBoard(id, { isTrashed: true, deletedAt: Date.now() });
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
          isFavorite: false,
          isPublished: false,
          isPublic: false,
          quizState: 'setup',
          currentQuestionIndex: 0,
          quizStartTime: undefined,
          assessmentState: 'setup',
          assessmentConfig: boardToDup.assessmentConfig ? {
              ...boardToDup.assessmentConfig,
              status: 'setup',
              startTime: null
          } : undefined,
          currentPollIndex: 0
      };

      try {
          const newBoard = await boardService.createBoard({
              ...boardToDup,
              ...overrideSettings
          }, user.id);

          // Add to local state immediately
          setBoards(prev => [newBoard, ...prev]);

          if (options.includeNotes) {
              const notes = await noteService.getNotes(boardId);
              const notesToCopy = notes.filter(n => {
                  if (n.author_id !== user.id) return false;
                  if (options.onlyPinned && !n.isPinned) return false;
                  return true;
              });

              if (notesToCopy.length > 0) {
                  const newNotesPayload = notesToCopy.map(n => ({
                      board_id: newBoard.id,
                      content: n.content,
                      title: n.title,
                      author: n.author,
                      author_id: user.id,
                      author_avatar: user.user_metadata?.avatar_url || userAvatar,
                      type: n.type,
                      color: n.color,
                      x: n.x,
                      y: n.y,
                      width: n.width,
                      height: n.height,
                      section_id: n.sectionId,
                      attachment_url: n.attachmentUrl,
                      is_pinned: n.isPinned,
                      likes: 0,
                      comments: [],
                      liked_by: [],
                      connections: []
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
          const newVal = !board.isFavorite;
          handleUpdateBoard(id, { isFavorite: newVal });
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

  // 1. Auth / Guest Gate
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

  // 2. Board View
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
          // Only show loading if we haven't determined it's an error yet
          return <LoadingScreen />;
      }

      const effectiveUsername = isGuest ? guestName : username;
      const effectiveAvatar = isGuest ? guestAvatar : userAvatar;
      const effectiveUserId = isGuest ? guestId : (session?.user?.id);
      const effectiveRole = isGuest ? 'student' : userRole; 
      const isStudent = effectiveRole === 'student';
      
      // SECURITY CHECK: Draft Boards
      const isQuizActive = activeBoard.format === 'quiz' && activeBoard.quizState && activeBoard.quizState !== 'setup';
      // For assessments, we allow students to enter even if 'setup' (not live) so they see the specific lobby screen
      const isAssessmentActive = activeBoard.format === 'assessment';
      
      const isAllowed = !isStudent || activeBoard.isPublished || isQuizActive || isAssessmentActive || activeBoard.owner_id === effectiveUserId;

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

  // 3. Dashboard View
  return (
      <Suspense fallback={<LoadingScreen />}>
          {userRole === 'student' || isGuest ? (
              <StudentDashboard 
                  boards={boards}
                  onSelectBoard={selectBoard}
                  theme={theme}
                  onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  username={isGuest ? guestName : username}
                  userAvatar={isGuest ? guestAvatar : userAvatar}
                  userClasses={userClasses}
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
                  username={username}
                  userAvatar={userAvatar}
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
