
import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, AlertTriangle } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from './constants';
import { BoardFormat, Note } from '../../types';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (format: BoardFormat, templateData?: Partial<any>, initialNotes?: Note[]) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onCreateBoard }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- REPAIR SCRIPT v21 (Fix Missing Answers & Title)

-- 1. DEFINE SECURE ACCESS FUNCTIONS (Circuit Breakers)
-- These functions run with elevated privileges (SECURITY DEFINER) to bypass RLS recursion loops.
-- They allow us to check "Does this student have a grade?" or "Does this student have a submission?" without triggering infinite checks.

CREATE OR REPLACE FUNCTION public.check_grade_access(b_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM grades 
    WHERE board_id = b_id 
    AND student_id::text = u_id::text
  );
$$;

CREATE OR REPLACE FUNCTION public.check_submission_access(b_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM notes 
    WHERE board_id = b_id 
    AND author_id::text = u_id::text
    AND type = 'assessment_submission'
  );
$$;

-- 2. RESET BOARD PERMISSIONS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access Boards" ON public.boards;
DROP POLICY IF EXISTS "Public Read Boards" ON public.boards;

-- 3. APPLY ROBUST BOARD POLICY
-- Allows access if:
-- 1. Owner
-- 2. Public/Published
-- 3. Collaborator
-- 4. Student has a GRADE (via check_grade_access)
-- 5. Student has a SUBMISSION (via check_submission_access) -> This fixes "Unknown Assessment"
CREATE POLICY "Access Boards" ON public.boards FOR SELECT USING (
    auth.uid()::text = owner_id::text 
    OR is_public = true 
    OR is_published = true
    OR (settings->'collaborators')::jsonb ? auth.uid()::text
    OR public.check_grade_access(id, auth.uid()) 
    OR public.check_submission_access(id, auth.uid())
);

-- 4. ENSURE OTHER POLICIES EXIST
DROP POLICY IF EXISTS "Teachers Update Own Boards" ON public.boards;
CREATE POLICY "Teachers Update Own Boards" ON public.boards FOR UPDATE USING (
    auth.uid()::text = owner_id::text
    OR (settings->'collaborators')::jsonb ? auth.uid()::text
);

DROP POLICY IF EXISTS "Teachers Insert Boards" ON public.boards;
CREATE POLICY "Teachers Insert Boards" ON public.boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers Delete Own Boards" ON public.boards;
CREATE POLICY "Teachers Delete Own Boards" ON public.boards FOR DELETE USING (auth.uid()::text = owner_id::text);

-- 5. FIX NOTE VISIBILITY (For fetching the student's own answers)
DROP POLICY IF EXISTS "Read Accessible Notes" ON public.notes;
CREATE POLICY "Read Accessible Notes" ON public.notes FOR SELECT USING (
    auth.uid()::text = author_id::text -- Can always read own notes
    OR EXISTS (
        SELECT 1 FROM public.boards 
        WHERE id = board_id 
        AND (
            owner_id::text = auth.uid()::text 
            OR is_public = true 
            OR is_published = true
            OR (settings->'collaborators')::jsonb ? auth.uid()::text
        )
    )
);

-- 6. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white font-sans">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161616]">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500">
                    <Database size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-lg">System Repair v21</h2>
                    <p className="text-gray-400 text-xs">Fix "Unknown Assessment" Error</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="mt-1 text-green-500 font-bold text-xs uppercase tracking-wide shrink-0"><Check size={16}/> CRITICAL FIX</div>
                    <div className="text-sm text-gray-300">
                        <strong>Fix for Missing Answers & Title</strong><br/>
                        This script ensures students can load the assessment details (title, questions, max score) if they have submitted work, even if the board is closed/draft.<br/><br/>
                        1. Copy the SQL script below.<br/>
                        2. Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase SQL Editor</a>.<br/>
                        3. Paste and click <strong>RUN</strong>.
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute -top-3 left-4 bg-[#1a1a1a] px-2 text-xs font-bold text-gray-500 flex items-center gap-1">
                    <Terminal size={12} /> Repair Script v21
                </div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-4 overflow-x-auto font-mono text-xs text-blue-300 leading-relaxed shadow-inner custom-scrollbar">
                    <pre>{sqlScript}</pre>
                </div>
                <button 
                    onClick={handleCopy}
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-sm"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
        
        <div className="p-5 border-t border-white/10 bg-[#161616] flex justify-end">
            <button onClick={onClose} className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg font-bold text-sm transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
};
