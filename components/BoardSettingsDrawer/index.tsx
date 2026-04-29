
import React, { useState, useMemo, useEffect } from 'react';
import { X, Info, Lock } from 'lucide-react';
import { Board } from '../../types';
import { HeadingSection } from './HeadingSection';
import { AppearanceSection } from './AppearanceSection';
import { LayoutSection } from './LayoutSection';
import { EngagementSection } from './EngagementSection';
import { GradingSection } from './GradingSection';
import { AdvancedSection } from './AdvancedSection';
import { profileService, UserPreferences } from '../../services/profileService';

interface BoardSettingsDrawerProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Board>) => void;
  isStudent?: boolean;
}

const ALL_TABS = ['Heading', 'Appearance', 'Layout', 'Engagement', 'Grading', 'Advanced'];

export const BoardSettingsDrawer: React.FC<BoardSettingsDrawerProps> = ({ board, isOpen, onClose, onUpdate, isStudent = false }) => {
  const [activeTab, setActiveTab] = useState('Heading');
  const [prefs, setPrefs] = useState<UserPreferences>({ saved_colors: [], saved_gradients: [] });

  useEffect(() => {
      if (isOpen) {
        loadPreferences();
      }
  }, [isOpen]);

  const loadPreferences = async () => {
      const p = await profileService.getPreferences();
      if (p) {
          setPrefs({
              saved_colors: p.saved_colors || [],
              saved_gradients: p.saved_gradients || []
          });
      } else {
          setPrefs({ saved_colors: [], saved_gradients: [] });
      }
  };

  const visibleTabs = useMemo(() => {
      if (board.format === 'quiz' || board.format === 'poll') {
          return ALL_TABS.filter(t => t !== 'Layout');
      }
      return ALL_TABS;
  }, [board.format]);

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(`setting-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[999] transition-all duration-300 animate-in fade-in ${!board.settings?.disableModalBlur ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-transparent'}`} 
          onClick={onClose}
        />
      )}
      
      <div 
          className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#1a1a1a] shadow-2xl border-l border-white/10 transform transition-transform duration-300 z-[1000] flex flex-col text-white font-sans ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-[#1a1a1a] shrink-0 z-10">
              <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                  <X size={24} />
              </button>
              <h2 className="text-lg font-bold">{isStudent ? 'About Board' : 'Settings'}</h2>
              <div className="w-10" /> 
          </div>

          {!isStudent && (
              <div className="flex overflow-x-auto px-2 md:px-4 border-b border-white/5 bg-[#1a1a1a] shrink-0 custom-scrollbar touch-pan-x">
                  {visibleTabs.map(tab => (
                      <button
                          key={tab}
                          onClick={() => scrollToSection(tab)}
                          className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-transparent hover:text-white'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar bg-[#111111]">
              
              {isStudent ? (
                  <div className="space-y-6">
                      <div className="text-center mb-6">
                          <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center text-5xl mb-4 border border-white/10 shadow-lg font-emoji">
                              {board.icon || '🎓'}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{board.title}</h3>
                          <p className="text-gray-400 text-sm leading-relaxed">{board.description || 'No description provided.'}</p>
                      </div>

                      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3 text-sm text-gray-300 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                              <Info size={18} className="text-blue-400 shrink-0" />
                              <span>Created by <span className="font-bold text-white">Teacher</span></span>
                          </div>
                          <div className={`flex items-center gap-3 text-sm p-2 rounded-lg border ${board.lockMode !== 'unlocked' ? 'bg-red-500/5 border-red-500/10 text-red-200' : 'bg-green-500/5 border-green-500/10 text-green-200'}`}>
                              <Lock size={18} className={board.lockMode !== 'unlocked' ? 'text-red-400' : 'text-green-400'} />
                              <span>Status: <span className="font-bold uppercase tracking-wide ml-1">{board.lockMode === 'unlocked' ? 'Open' : 'Locked'}</span></span>
                          </div>
                      </div>
                  </div>
              ) : (
                  <>
                      <div id="setting-Heading">
                          <HeadingSection board={board} onUpdate={onUpdate} />
                      </div>

                      <div id="setting-Appearance">
                          <AppearanceSection board={board} onUpdate={onUpdate} prefs={prefs} loadPreferences={loadPreferences} />
                      </div>

                      {visibleTabs.includes('Layout') && (
                          <div id="setting-Layout">
                              <LayoutSection board={board} onUpdate={onUpdate} />
                          </div>
                      )}

                      {visibleTabs.includes('Engagement') && (
                          <div id="setting-Engagement">
                              <EngagementSection board={board} onUpdate={onUpdate} />
                          </div>
                      )}

                      <div id="setting-Grading">
                          <GradingSection board={board} onUpdate={onUpdate} isStudent={isStudent} />
                      </div>

                      <div id="setting-Advanced">
                          <AdvancedSection board={board} onUpdate={onUpdate} />
                      </div>
                  </>
              )}

               {/* Spacer for bottom scrolling */}
               <div className="h-20"></div>
          </div>
      </div>
    </>
  );
};
