
import React, { useRef, memo, useState, useMemo, useEffect } from 'react';
import { EyeOff, X, Clock } from 'lucide-react';
import { Note, CommentAttachment, NoteColor, Board } from '../../types';
import { useBoard } from '../BoardView/BoardContext';
import { BoardRules } from '../../utils/boardRules';

// Modular Components
import { NoteHeader } from './NoteHeader';
import { NoteContent } from './NoteContent';
import { NoteFooter } from './NoteFooter';
import { CommentSection } from '../Comment/CommentSection';

// Prop Interface
interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onAddComment?: (id: string, text: string, attachment?: CommentAttachment) => void;
  onUpdate?: (id: string, updates: Partial<Note>) => void;
  isCanvasMode?: boolean;
  isConnectMode?: boolean; 
  onConnectStart?: (id: string) => void;
  isSelectedForConnection?: boolean;
  onMouseDown?: (e: React.MouseEvent, id: string) => void;
  domRef?: (instance: HTMLDivElement | null) => void;
  userId?: string;
  isStudent?: boolean;
  isLocked?: boolean; 
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  contentTextColor?: string; 
  isSectionAnonymous?: boolean;
  isContentBlurred?: boolean;
  onAddBefore?: () => void;
  onAddAfter?: () => void;
  onMoveNote?: (id: string, direction: 'up' | 'down') => void;
  canDrag?: boolean;
}

const isHexColor = (color: string): boolean => !!color && color.startsWith('#');

// Main Component
const NoteCardComponent: React.FC<NoteCardProps> = ({ 
    note, onDelete, onLike, onAddComment, onUpdate, isCanvasMode, isConnectMode, onConnectStart, isSelectedForConnection, onMouseDown, domRef, userId, isStudent, isLocked,
    commentsEnabled, reactionsEnabled, contentTextColor, isSectionAnonymous, isContentBlurred, onAddBefore, onAddAfter, onMoveNote
}) => {
  const { board, isPresentationMode, openEditNote, userId: contextUserId, canManageBoard, highlightedUserId, userRole } = useBoard();
  
  const effectiveUserId = userId || contextUserId;
  const [showMenu, setShowMenu] = useState(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  const [isStillEditable, setIsStillEditable] = useState(true);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const editTimeLimit = board.settings?.editTimeLimit;
    const isAuthor = note.author_id === effectiveUserId;

    if (userRole === 'teacher' || !isAuthor || editTimeLimit === undefined || editTimeLimit === null || editTimeLimit <= 0) {
        setIsStillEditable(true);
        setRemainingTime(null);
        return;
    }

    let intervalId: NodeJS.Timeout;

    const checkTime = () => {
        const limitInSeconds = editTimeLimit * 60;
        const updatedAt = new Date(note.updatedAt || note.createdAt).getTime();
        const diffSeconds = (Date.now() - updatedAt) / 1000;

        if (diffSeconds < limitInSeconds) {
            setIsStillEditable(true);
            setRemainingTime(limitInSeconds - diffSeconds);
        } else {
            setIsStillEditable(false);
            setRemainingTime(null);
            if (intervalId) clearInterval(intervalId);
        }
    };

    intervalId = setInterval(checkTime, 1000);
    checkTime();

    return () => clearInterval(intervalId);

}, [board.settings, note.author_id, note.createdAt, note.updatedAt, effectiveUserId, userRole]);

  // --- Safe Booleans ---
  const isCanvasModeBool = !!isCanvasMode;
  const isStudentBool = !!isStudent;
  const isLockedBool = !!isLocked;
  const isSectionAnonymousBool = isSectionAnonymous ?? false;
  const isContentBlurredBool = isContentBlurred ?? false;
  const isPresentationModeBool = !!isPresentationMode;
  const commentsEnabledBool = commentsEnabled ?? true;
  const reactionsEnabledBool = reactionsEnabled ?? true;
  const disablePasteBool = !!board.disablePaste;
  const repliesEnabledBool = !!board.repliesEnabled;

  // --- Logic & Permissions (using BoardRules) ---
  const originalCanEdit = BoardRules.canEditNote(note, effectiveUserId, isStudentBool, isLockedBool);
  const canEdit = originalCanEdit && isStillEditable;
  const canDelete = BoardRules.canDeleteNote(note, effectiveUserId, isStudentBool, isLockedBool);
  const canCopy = BoardRules.canCopyContent(board, note.sectionId, isStudentBool);
  
  const isTransparent = note.color === NoteColor.TRANSPARENT;
  const isStickyNote = isCanvasModeBool && note.type === 'text' && !isTransparent;
  const isCustomColor = isHexColor(note.color);

  const isBlurActive = BoardRules.shouldBlurContent(board, isContentBlurredBool, note, effectiveUserId, isStudentBool, isPresentationModeBool);
  const isReadOnly = (board.lockMode === 'readonly' && !canManageBoard);

  // --- Highlighting Logic ---
  const isHighlighted = highlightedUserId && note.author_id === highlightedUserId;
  const isDimmed = highlightedUserId && note.author_id !== highlightedUserId;

  // --- Handlers ---
  const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (domRef) domRef(node);
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectStart) onConnectStart(note.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (!canEdit) return;
      e.stopPropagation();
      openEditNote(note);
  };

  const handleMouseUp = () => {
      if (isStickyNote && localRef.current && onUpdate && canEdit) {
          const { width, height } = localRef.current.style;
          const numW = parseInt(width, 10), numH = parseInt(height, 10);
          if (!isNaN(numW) && !isNaN(numH) && (numW !== note.width || numH !== note.height)) {
              onUpdate(note.id, { width: numW, height: numH });
          }
      }
  };
  
  const preventAction = (e: React.SyntheticEvent) => { if (!canCopy) e.preventDefault(); };

  // --- Styles & Classes ---
  const containerClasses = useMemo(() => `
    ${isCanvasModeBool ? `absolute w-full sm:w-[300px] cursor-grab active:cursor-grabbing select-none` : 'break-inside-avoid mb-4 relative w-full'}
    ${!isTransparent ? 'transition-all duration-300' : ''}
    ${!isTransparent && !isStickyNote ? 'shadow-sm hover:shadow-lg rounded-xl sm:rounded-2xl' : ''}
    ${!isCustomColor ? note.color : ''} flex flex-col group animate-fade-in note-card
    ${isStickyNote ? 'overflow-hidden resize-both min-h-[150px] sm:min-h-[200px] rounded-none' : ''}
    ${!canCopy ? 'select-none' : ''}
    ${isHighlighted ? 'ring-2 sm:ring-4 ring-yellow-400 z-50 shadow-lg !opacity-100' : ''}
    ${isDimmed ? 'opacity-20 grayscale blur-[1px] scale-95 pointer-events-none' : 'opacity-100'}
    ${!isStillEditable && userRole === 'student' ? 'opacity-80' : ''}
  `, [isCanvasModeBool, isTransparent, isStickyNote, note.color, canCopy, isHighlighted, isDimmed, isCustomColor, isStillEditable, userRole]);

  const style: React.CSSProperties = useMemo(() => ({
      backgroundColor: isCustomColor ? note.color : undefined,
      ...(isCanvasModeBool ? { left: note.x, top: note.y, width: isStickyNote && note.width ? note.width : undefined, height: isStickyNote && note.height ? note.height : undefined } : {}),
      ...(isStickyNote ? { boxShadow: '0 1px 4px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.05) inset' } : {}),
      ...(!canCopy ? { userSelect: 'none', WebkitUserSelect: 'none' } : {})
  }), [isCustomColor, note, isCanvasModeBool, isStickyNote, canCopy]);

  const ConnectionHandle = ({ position, onClick }: { position: string, onClick: (e: React.MouseEvent) => void }) => (
      <div onClick={onClick} className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-full cursor-crosshair z-50 hover:scale-125 transition-transform ${position} shadow-sm`} />
  );

  return (
    <div 
        ref={setRefs} 
        data-note-id={note.id} 
        data-author-id={note.author_id}
        className={containerClasses} 
        style={style}
        onMouseDown={(e) => isCanvasModeBool && onMouseDown && onMouseDown(e, note.id)}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={preventAction}
        onCopy={preventAction}
    >
      {isConnectMode && (
          <>
            <ConnectionHandle position="-top-1.5 left-1/2 -translate-x-1/2" onClick={handleConnect} />
            <ConnectionHandle position="top-1/2 -right-1.5 -translate-y-1/2" onClick={handleConnect} />
            <ConnectionHandle position="-bottom-1.5 left-1/2 -translate-x-1/2" onClick={handleConnect} />
            <ConnectionHandle position="top-1/2 -left-1.5 -translate-y-1/2" onClick={handleConnect} />
          </>
      )}

      {!isTransparent && !isStickyNote && (
          <div className="relative z-10">
            <NoteHeader note={note} canEdit={canEdit} canDelete={canDelete} onDelete={(id) => onDelete && onDelete(id)} onEdit={() => openEditNote(note)} onColorChange={(color) => onUpdate && onUpdate(note.id, { color })} onPin={canEdit && onUpdate ? (id) => onUpdate(id, { isPinned: !note.isPinned }) : undefined} onAddBefore={onAddBefore} onAddAfter={onAddAfter} onMove={onMoveNote ? (direction) => onMoveNote(note.id, direction) : undefined} isStickyNote={isStickyNote} isTransparent={isTransparent} isSectionAnonymous={isSectionAnonymousBool} showMenu={showMenu} setShowMenu={setShowMenu} />
          </div>
      )}

      {isStickyNote && canDelete && (
          <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); if(onDelete) onDelete(note.id); }} className="p-1 hover:bg-black/10 rounded-full text-slate-500 hover:text-red-600 transition-colors" title="Delete"><X size={14} /></button>
          </div>
      )}

      {isBlurActive ? (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-2 opacity-50 select-none min-h-[100px] relative z-10">
              <EyeOff size={28} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hidden</span>
          </div>
      ) : (
          <div className="relative z-10">
            <NoteContent note={note} contentTextColor={contentTextColor} isEditing={false} isStickyNote={isStickyNote} isCopyDisabled={!canCopy}/>
          </div>
      )}

      {!isTransparent && !isStickyNote && (
          <div className="relative z-10">
               {remainingTime !== null && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-yellow-800 px-3 py-1 bg-yellow-400/20 border-t border-yellow-500/20">
                        <Clock size={12} />
                        <span>{`Time to edit: ${Math.floor(remainingTime / 60)}m ${Math.floor(remainingTime % 60)}s`}</span>
                    </div>
                )}
              <NoteFooter note={note} userId={effectiveUserId} onLike={(e) => { e.stopPropagation(); if (onLike) onLike(note.id); }} commentsEnabled={commentsEnabledBool} reactionsEnabled={reactionsEnabledBool} />
              
              {commentsEnabledBool && !isBlurActive && (
                  <CommentSection comments={note.comments || []} noteId={note.id} userId={effectiveUserId} onAddComment={onAddComment} onUpdateNote={onUpdate} reactionsEnabled={reactionsEnabledBool} noteColor={note.color} isStudent={isStudentBool} disablePaste={disablePasteBool} repliesEnabled={repliesEnabledBool} isSectionAnonymous={isSectionAnonymousBool} isReadOnly={isReadOnly} />
              )}
          </div>
      )}
    </div>
  );
};

export default memo(NoteCardComponent);
