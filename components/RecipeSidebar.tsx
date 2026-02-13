
import React, { useState } from 'react';
import { X, ChevronRight, RefreshCw, Copy, QrCode, Mail, Code } from 'lucide-react';
import { Board, GeneratedIdea } from '../types';

interface RecipeSidebarProps {
  board: Board;
  onClose: () => void;
  onUpdateBoard: (updates: Partial<Board>) => void;
  onUpdateNotes: (updater: (prev: any[]) => any[]) => void;
}

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Higher Ed.'];
const TABS = ['Generate', 'Configure', 'Post', 'Share'];

export const RecipeSidebar: React.FC<RecipeSidebarProps> = ({ board, onClose, onUpdateBoard, onUpdateNotes }) => {
  const [activeTab, setActiveTab] = useState('Generate');
  const [topic, setTopic] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [promptText, setPromptText] = useState('');
  const [discussionType, setDiscussionType] = useState<'question' | 'debate'>('question');
  
  // Static generation to avoid AI cost
  const handleGenerate = async () => {
    if (!topic) return;
    
    // Simulating AI response with static templates
    const staticIdeas: GeneratedIdea[] = [
        {
            title: `Discussion: ${topic}`,
            description: "A class-wide discussion on the topic.",
            prompt: `What are your thoughts on ${topic}? Share your perspective and reply to at least one classmate.`,
            type: "question"
        },
        {
            title: `Debate: ${topic}`,
            description: "Pro/Con debate structure.",
            prompt: `Argue for or against: "${topic} is beneficial for society." Use evidence to support your claim.`,
            type: "debate"
        },
        {
            title: `Reflection: ${topic}`,
            description: "Personal reflection activity.",
            prompt: `How does ${topic} relate to your own life experiences?`,
            type: "question"
        }
    ];
    
    setIdeas(staticIdeas);
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    setPromptText(idea.prompt);
    setDiscussionType(idea.type);
    
    // Live preview update
    onUpdateBoard({ title: idea.title, description: idea.description });
    onUpdateNotes((prev) => {
         const newNote = {
             id: 'preview-prompt',
             title: idea.title,
             content: idea.prompt,
             author: 'Teacher',
             color: 'bg-white',
             type: 'text',
             x: window.innerWidth / 2 - 150,
             y: window.innerHeight / 2 - 100,
             createdAt: Date.now(),
             likes: 0,
             connections: [],
             isPlaceholder: true
         };
         return [newNote];
    });

    setActiveTab('Configure');
  };

  const handleConfigureNext = () => {
      onUpdateNotes(prev => prev.map(n => n.id === 'preview-prompt' ? { ...n, content: promptText, isPlaceholder: false } : n));
      setActiveTab('Post');
  };

  const handlePostNext = () => {
      setActiveTab('Share');
  };
  
  const handleDone = () => {
      onUpdateBoard({ recipeStatus: 'published' });
      onClose();
  };

  const renderGenerate = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Setup Discussion</h3>
              <p className="text-gray-400 text-xs">Enter a topic to get started with a template.</p>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Topic</label>
              <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Abraham Lincoln"
                  className="w-full bg-[#111] border border-yellow-500 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  autoFocus
              />
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Grade</label>
              <div className="flex flex-wrap gap-2">
                  {GRADES.map(g => (
                      <button 
                          key={g}
                          onClick={() => setSelectedGrade(g)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${selectedGrade === g ? 'bg-white text-black' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                      >
                          {g}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex justify-end">
             {ideas.length === 0 && (
                <button 
                    onClick={handleGenerate}
                    disabled={!topic}
                    className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                    Start
                </button>
             )}
              {ideas.length > 0 && (
                 <button onClick={handleGenerate} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
                     <RefreshCw size={12} /> Reset
                 </button>
              )}
          </div>

          {ideas.length > 0 && (
              <div className="space-y-2 mt-4">
                  <label className="text-xs font-bold text-gray-400">Select a Template...</label>
                  <div className="space-y-2">
                      {ideas.map((idea, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSelectIdea(idea)}
                            className="w-full text-left bg-[#222] hover:bg-[#333] border border-white/5 rounded-lg p-3 group transition-all"
                          >
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="text-sm font-bold text-white mb-1">{idea.description}</p>
                                      <p className="text-xs text-gray-400">{idea.type === 'debate' ? 'Debate' : 'Question and response'}</p>
                                  </div>
                                  <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  const renderConfigure = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Configure your discussion board</h3>
              <p className="text-gray-400 text-xs">Create an engaging prompt and choose how students will engage in their discussion.</p>
          </div>

          <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Discussion prompt</label>
              <div className="relative">
                  <textarea 
                    value={promptText}
                    onChange={(e) => {
                        setPromptText(e.target.value);
                        onUpdateNotes(prev => prev.map(n => n.id === 'preview-prompt' ? { ...n, content: e.target.value } : n));
                    }}
                    className="w-full h-32 bg-[#111] border border-yellow-500 rounded-lg p-3 text-white text-sm focus:outline-none resize-none leading-relaxed focus:border-yellow-400 transition-colors"
                  />
                  <div className="absolute bottom-3 right-3 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
              </div>
          </div>

          <div className="space-y-2">
               <label className="text-xs font-bold text-gray-400">Discussion type</label>
               <div className="space-y-2">
                   <button 
                        onClick={() => setDiscussionType('question')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${discussionType === 'question' ? 'bg-[#222] border-white/20' : 'bg-transparent border-transparent hover:bg-[#222]'}`}
                   >
                       <div className="text-left">
                           <div className="font-bold text-sm text-white">Question and response</div>
                           <div className="text-xs text-gray-500">Pose a discussion question to your students and have everyone add their response</div>
                       </div>
                       <div className={`w-4 h-4 rounded-full border ${discussionType === 'question' ? 'border-white bg-white' : 'border-gray-500'}`}></div>
                   </button>

                   <button 
                        onClick={() => setDiscussionType('debate')}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${discussionType === 'debate' ? 'bg-[#222] border-white/20' : 'bg-transparent border-transparent hover:bg-[#222]'}`}
                   >
                       <div className="text-left">
                           <div className="font-bold text-sm text-white">Debate</div>
                           <div className="text-xs text-gray-500">Give a discussion topic and have your students write a response in favor or against the topic</div>
                       </div>
                       <div className={`w-4 h-4 rounded-full border ${discussionType === 'debate' ? 'border-white bg-white' : 'border-gray-500'}`}></div>
                   </button>
               </div>
          </div>

          <div className="pt-10 flex justify-end">
              <button 
                onClick={handleConfigureNext}
                className="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-full text-xs font-bold"
              >
                  Next
              </button>
          </div>
      </div>
  );

  const renderPost = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Review your board</h3>
              <p className="text-gray-400 text-xs">Your board is ready! Check the preview on the left. You can add more posts or edit the settings later.</p>
          </div>

          <div className="p-6 bg-[#222] rounded-lg border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-3">
                  <Code size={24} />
              </div>
              <h4 className="text-white font-bold mb-1">All set!</h4>
              <p className="text-gray-400 text-xs">Your discussion board has been configured successfully.</p>
          </div>

          <div className="pt-20 flex justify-end">
              <button 
                onClick={handlePostNext}
                className="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-full text-xs font-bold"
              >
                  Next
              </button>
          </div>
      </div>
  );

  const renderShare = () => (
      <div className="space-y-6 animate-fade-in flex flex-col h-full">
           <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Share with your students</h3>
              <p className="text-gray-400 text-xs">Send your students the link or have them scan the QR code so they can start adding their responses.</p>
          </div>

          <div className="space-y-2">
              <button className="w-full bg-[#222] hover:bg-[#333] text-white p-3 rounded-lg flex items-center gap-3 transition-colors border border-white/5 text-left group">
                  <Copy size={16} className="text-gray-400 group-hover:text-white" />
                  <span className="text-sm font-bold">Copy link</span>
              </button>
              <button className="w-full bg-[#222] hover:bg-[#333] text-white p-3 rounded-lg flex items-center gap-3 transition-colors border border-white/5 text-left group">
                  <QrCode size={16} className="text-gray-400 group-hover:text-white" />
                  <span className="text-sm font-bold">Open QR code</span>
              </button>
              <button className="w-full bg-[#222] hover:bg-[#333] text-white p-3 rounded-lg flex items-center gap-3 transition-colors border border-white/5 text-left group">
                  <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-white group-hover:border-white">G</div>
                  <span className="text-sm font-bold">Share in Google Classroom</span>
              </button>
               <button className="w-full bg-[#222] hover:bg-[#333] text-white p-3 rounded-lg flex items-center gap-3 transition-colors border border-white/5 text-left group">
                  <Mail size={16} className="text-gray-400 group-hover:text-white" />
                  <span className="text-sm font-bold">Send email</span>
              </button>
               <button className="w-full bg-[#222] hover:bg-[#333] text-white p-3 rounded-lg flex items-center gap-3 transition-colors border border-white/5 text-left group">
                  <Code size={16} className="text-gray-400 group-hover:text-white" />
                  <span className="text-sm font-bold">Embed in your blog or website</span>
              </button>
          </div>
        
          <div className="mt-auto pt-4 border-t border-white/10">
               <button 
                onClick={handleDone}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-full text-sm font-bold transition-colors"
              >
                  Done
              </button>
          </div>
      </div>
  );

  return (
    <div className="w-[380px] bg-[#1a1a1a] border-l border-white/10 flex flex-col shadow-2xl z-40 shrink-0 h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
             <button onClick={onClose} className="text-gray-400 hover:text-white">
                 <X size={18} />
             </button>
             <h2 className="text-white font-bold text-sm">{board.recipeId ? board.recipeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Board Setup'}</h2>
             <div className="w-4"></div>
        </div>

        {/* Tabs */}
        <div className="flex justify-between px-6 py-4 border-b border-white/10 shrink-0">
            {TABS.map(tab => (
                <button 
                    key={tab}
                    className={`text-xs font-bold pb-1 border-b-2 transition-colors ${activeTab === tab ? 'text-yellow-500 border-yellow-500' : 'text-gray-500 border-transparent'}`}
                    disabled={activeTab !== tab && TABS.indexOf(tab) > TABS.indexOf(activeTab)} // Only allow moving forward via actions mostly
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'Generate' && renderGenerate()}
            {activeTab === 'Configure' && renderConfigure()}
            {activeTab === 'Post' && renderPost()}
            {activeTab === 'Share' && renderShare()}
        </div>
        
        {/* Footer (Manual option) */}
        {activeTab === 'Generate' && (
             <div className="p-4 border-t border-white/10 text-center shrink-0">
                <button onClick={() => onClose()} className="text-xs text-gray-500 hover:text-white">Don't want to use a template? <span className="font-bold text-white">Fill manually</span></button>
            </div>
        )}
    </div>
  );
};
