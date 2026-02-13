import React, { useRef, memo, useState, useMemo } from 'react';
import { EyeOff, X } from 'lucide-react';
import { Note, CommentAttachment, NoteColor } from '../../types';
import { useBoard } from '../BoardView/BoardContext';
import { BoardRules } from '../../utils/boardRules';

// Import Modular Components
import { NoteHeader } from './NoteHeader';
import { NoteContent } from './NoteContent';
import { NoteFooter } from './NoteFooter';
import { CommentSection } from '../Comment/CommentSection';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onAddComment?: (id: string, text: string, attachment?: CommentAttachment) => void;
  onUpdate?: (id: string, updates: Partial<Note>) => void;
  // Canvas Props
  isCanvasMode?: boolean;
  isConnectMode?: boolean; 
  onConnectStart?: (id: string) => void;
  isSelectedForConnection?: boolean;
  onMouseDown?: (e: React.MouseEvent, id: string) => void;
  domRef?: (instance: HTMLDivElement | null) => void;
  // Permissions & Settings
  userId?: string;
  isStudent?: boolean;
  isLocked?: boolean; 
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  contentTextColor?: string; 
  isSectionAnonymous?: boolean;
  isContentBlurred?: boolean;
  // Layout Props
  onAddBefore?: () => void;
  onAddAfter?: () => void;
  onMoveNote?: (id: string, direction: 'up' | 'down') => void;
  canDrag?: boolean;
}

const NoteCardComponent: React.FC<NoteCardProps> = ({ 
    note, onDelete, onLike, onAddComment, onUpdate, isCanvasMode, isConnectMode, onConnectStart, isSelectedForConnection, onMouseDown, domRef, userId, isStudent, isLocked,
    commentsEnabled = true, reactionsEnabled = true, contentTextColor, isSectionAnonymous, isContentBlurred, onAddBefore, onAddAfter, onMoveNote, canDrag
}) => {
  const { board, isPresentationMode, openEditNote, userId: contextUserId, canManageBoard, username, highlightedUserId } = useBoard();
  
  // Use prop userId if available (e.g. from parent mapping), otherwise fallback to context
  const effectiveUserId = userId || contextUserId;

  // State
  const [showMenu, setShowMenu] = useState(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  // --- Logic & Permissions (Engine) ---
  const canEdit = BoardRules.canEditNote(note, effectiveUserId, !!isStudent, !!isLocked);
  const canDelete = BoardRules.canDeleteNote(note, effectiveUserId, !!isStudent, !!isLocked);
  const canCopy = BoardRules.canCopyContent(board, note.sectionId, !!isStudent);
  
  const isTransparent = note.color === NoteColor.TRANSPARENT;
  const isStickyNote = isCanvasMode && note.type === 'text' && !isTransparent;

  // --- Board Rules ---
  const isBlurActive = BoardRules.shouldBlurContent(board, isContentBlurred, note, effectiveUserId, !!isStudent, !!isPresentationMode);
  
  // Determine if comments should be read-only (Board is Read Only AND user is not teacher)
  const isReadOnly = (board.lockMode === 'readonly' && !canManageBoard);

  // Highlighting Logic (Teacher Focused)
  // Check if note author matches the highlighted ID
  const isHighlighted = highlightedUserId && note.author_id === highlightedUserId;
  // Check if ANYONE is highlighted but NOT this author (dim mode)
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
          const w = localRef.current.style.width;
          const h = localRef.current.style.height;
          if (w || h) {
              const numW = parseInt(w, 10);
              const numH = parseInt(h, 10);
              if (!isNaN(numW) && !isNaN(numH) && (numW !== note.width || numH !== note.height)) {
                  onUpdate(note.id, { width: numW, height: numH });
              }
          }
      }
  };
  
  // Prevent context menu and copy if disabled
  const handleContextMenu = (e: React.MouseEvent) => {
      if (!canCopy) {
          e.preventDefault();
      }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
      if (!canCopy) {
          e.preventDefault();
      }
  };

  // --- Styles ---
  const widthClass = isTransparent ? 'w-auto max-w-[600px] min-w-[150px]' : 'w-[300px]';
  
  const containerClasses = `
    ${isCanvasMode ? `absolute ${widthClass} cursor-grab active:cursor-grabbing select-none` : 'break-inside-avoid mb-4 relative'}
    ${!isTransparent ? 'transition-all duration-500' : ''}
    ${!isTransparent && !isStickyNote ? 'shadow-sm hover:shadow-lg rounded-2xl' : ''}
    ${note.color} flex flex-col group animate-fade-in note-card overflow-hidden
    ${isSelectedForConnection ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
    ${note.type === 'exit_ticket' ? 'border-l-8 border-slate-800' : ''}
    ${isStickyNote ? 'overflow-hidden resize-both min-h-[200px] rounded-none' : 'overflow-visible'}
    ${!canCopy ? 'select-none' : ''}
    ${isHighlighted ? 'ring-4 ring-yellow-400 z-50 shadow-[0_0_30px_rgba(250,204,21,0.5)] !opacity-100' : ''}
    ${isDimmed ? 'opacity-20 grayscale blur-[2px] scale-95 pointer-events-none' : 'opacity-100'}
  `;

  // Merge style with user-select enforcement
  const style: React.CSSProperties = {
      ...(isCanvasMode ? { left: note.x, top: note.y, width: isStickyNote && note.width ? note.width : undefined, height: isStickyNote && note.height ? note.height : undefined } : {}),
      ...(isStickyNote ? { boxShadow: '0 1px 4px rgba(0,0,0,0.2), 0 0 40px rgba(0,0,0,0.1) inset' } : {}),
      ...(!canCopy ? { userSelect: 'none', WebkitUserSelect: 'none' } : {})
  };

  const ConnectionHandle = ({ position, onClick }: { position: string, onClick: (e: React.MouseEvent) => void }) => (
      <div onClick={onClick} className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-crosshair z-50 hover:scale-125 transition-transform ${position} shadow-sm`} />
  );

  const StickyShadow = () => (
      <div className="absolute inset-x-2 bottom-0 h-4 bg-transparent z-[-1]" style={{ boxShadow: '0 8px 12px -4px rgba(0,0,0,0.4)', transform: 'skewY(1deg) translateY(2px)' }}></div>
  );

  return (
    <div 
        ref={setRefs} 
        data-note-id={note.id} 
        data-author-id={note.author_id}
        className={containerClasses} 
        style={style}
        onMouseDown={(e) => isCanvasMode && onMouseDown && onMouseDown(e, note.id)}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onCopy={handleCopy}
    >
      {isStickyNote && <StickyShadow />}
      
      {isConnectMode && (
          <>
            <ConnectionHandle position="-top-2 left-1/2 -translate-x-1/2" onClick={handleConnect} />
            <ConnectionHandle position="top-1/2 -right-2 -translate-y-1/2" onClick={handleConnect} />
            <ConnectionHandle position="-bottom-2 left-1/2 -translate-x-1/2" onClick={handleConnect} />
            <ConnectionHandle position="top-1/2 -left-2 -translate-y-1/2" onClick={handleConnect} />
          </>
      )}

      {!isTransparent && !isStickyNote && (
          <div className="relative z-10">
            <NoteHeader 
                note={note}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={(id) => onDelete && onDelete(id)}
                onEdit={() => openEditNote(note)}
                onColorChange={(color) => onUpdate && onUpdate(note.id, { color })}
                onPin={canEdit && onUpdate ? (id) => onUpdate(id, { isPinned: !note.isPinned }) : undefined}
                onDuplicate={(n) => {}} 
                onAddBefore={onAddBefore}
                onAddAfter={onAddAfter}
                onMove={onMoveNote ? (direction) => onMoveNote(note.id, direction) : undefined}
                isStickyNote={isStickyNote}
                isTransparent={isTransparent}
                isSectionAnonymous={isSectionAnonymous}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
            />
          </div>
      )}

      {isStickyNote && canDelete && (
          <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); if(onDelete) onDelete(note.id); }} className="p-1.5 hover:bg-black/10 rounded-full text-slate-500 hover:text-red-600 transition-colors" title="Delete"><X size={16} /></button>
          </div>
      )}

      {isBlurActive ? (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-2 opacity-50 select-none min-h-[100px] relative z-10">
              <EyeOff size={32} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Content Hidden</span>
          </div>
      ) : (
          <div className="relative z-10">
            <NoteContent 
                note={note}
                contentTextColor={contentTextColor}
                isEditing={false}
                isStickyNote={isStickyNote}
                isCopyDisabled={!canCopy}
            />
          </div>
      )}

      {!isTransparent && !isStickyNote && (
          <div className="relative z-10">
              <NoteFooter 
                  note={note}
                  userId={effectiveUserId}
                  onLike={(e) => { e.stopPropagation(); if (onLike) onLike(note.id); }}
                  commentsEnabled={commentsEnabled}
                  reactionsEnabled={reactionsEnabled}
              />
              
              {commentsEnabled && !isBlurActive && (
                  <CommentSection 
                      comments={note.comments || []}
                      noteId={note.id}
                      userId={effectiveUserId}
                      onAddComment={onAddComment}
                      onUpdateNote={onUpdate}
                      reactionsEnabled={reactionsEnabled}
                      noteColor={note.color}
                      isStudent={isStudent}
                      disablePaste={board.disablePaste}
                      repliesEnabled={board.repliesEnabled}
                      isSectionAnonymous={isSectionAnonymous}
                      isReadOnly={isReadOnly}
                  />
              )}
          </div>
      )}
    </div>
  );
};

export default NoteCardComponent;