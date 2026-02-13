
import React from 'react';
import { LessonStep, Board, Note, LockMode } from '../../types';
import { BoardLayout } from '../BoardView/Board';
import { SandboxLayout } from '../BoardView/Sandbox';
import { PollView } from '../Activities/PollView';
import { PlaySquare, Presentation, Cast } from 'lucide-react';
import { resolveBackgroundStyle } from '../../utils/theme';

const VideoStep = ({ url }: { url?: string }) => {
    let embedUrl = url;
    if (url?.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url?.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1];
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    return (
        <div className="w-full h-full bg-black flex flex-col justify-center">
            {embedUrl ? (
                <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
                <div className="text-white text-center flex flex-col items-center gap-4 opacity-50">
                    <PlaySquare size={64}/>
                    <p>Enter a video URL in the settings.</p>
                </div>
            )}
        </div>
    );
};

const ImageStep = ({ url, title }: { url?: string, title?: string }) => (
    <div className="w-full h-full bg-black flex items-center justify-center p-4">
        {url ? (
            <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
        ) : (
            <p className="text-gray-500">No image URL provided.</p>
        )}
    </div>
);

const CanvaStep = ({ url }: { url?: string }) => {
    let embedUrl = url;
    if (url?.includes('canva.com/design/')) {
        if (url.includes('/edit')) {
            embedUrl = url.split('/edit')[0] + '/view?embed';
        } else if (url.includes('/view') && !url.includes('embed')) {
            embedUrl = url + '?embed';
        } else if (!url.includes('/view')) {
            embedUrl = url + '/view?embed';
        }
    }

    return (
        <div className="w-full h-full bg-[#111] flex items-center justify-center p-4 md:p-8">
            {embedUrl ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                    <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full border-none"
                        allowFullScreen
                        allow="fullscreen"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="text-white text-center flex flex-col items-center gap-4 opacity-50">
                    <Presentation size={64}/>
                    <p>Enter a Canva Public View Link in the settings.</p>
                </div>
            )}
        </div>
    );
};

const GoogleSlideStep = ({ url }: { url?: string }) => {
    let embedUrl = url;
    
    // Auto-fix Google Slides links
    if (url?.includes('docs.google.com/presentation')) {
        // Case 1: /pub (Publish to web) -> Change to /embed
        if (url.includes('/pub')) {
            embedUrl = url.replace('/pub', '/embed');
        } 
        // Case 2: /edit (Editor link) -> Change to /embed
        else if (url.includes('/edit')) {
            embedUrl = url.replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000');
        }
        // Case 3: /preview -> Change to /embed
        else if (url.includes('/preview')) {
            embedUrl = url.replace(/\/preview.*$/, '/embed?start=false&loop=false&delayms=3000');
        }
    }

    return (
        <div className="w-full h-full bg-[#111] flex items-center justify-center p-4 md:p-8">
            {embedUrl ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                    <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full border-none"
                        allowFullScreen={true}
                        allow="fullscreen"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="text-white text-center flex flex-col items-center gap-4 opacity-50">
                    <Cast size={64}/>
                    <p>Enter a Google Slides link in the settings.</p>
                </div>
            )}
        </div>
    );
};

interface SlideViewerProps {
    step: LessonStep | undefined;
    board: Board;
    notes: Note[];
    userId?: string;
    isStudent: boolean;
    onAddComment: any;
    onDeleteNote: any;
    onLikeNote: any;
    onUpdateNote: any;
    onDuplicateNote: any;
    onOpenAddNote: any;
}

export const SlideViewer: React.FC<SlideViewerProps> = (props) => {
    const { step, board } = props;

    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#111]">
                <PlaySquare size={64} className="mb-4 opacity-20" />
                <p>No slide selected.</p>
            </div>
        );
    }

    // --- EMBEDDED BOARD LOGIC ---
    if (step.type === 'board') {
        const bgStyle = resolveBackgroundStyle(board.wallpaper);
        
        // If board format is 'lesson', we use the internal lessonLayout setting
        // otherwise, use the board format directly (though we are likely inside a lesson already)
        const boardFormat = board.format === 'lesson' 
            ? (board.settings?.lessonLayout || 'wall') 
            : board.format;
            
        const lockStatus: LockMode = step.boardSettings?.allowPosting === false ? 'readonly' : 'unlocked';

        const embedBoardConfig = {
            ...board,
            format: boardFormat, 
            lockMode: lockStatus
        };

        return (
            <div className="w-full h-full relative overflow-hidden">
                <BoardLayout 
                    {...props}
                    board={embedBoardConfig} 
                    sectionIdFilter={step.id} 
                    embeddedMode={true}
                    backgroundStyle={bgStyle}
                    fontClass="font-sans"
                    userAvatar={null}
                    onBack={() => {}}
                    onUpdateBoard={() => {}}
                    onOpenSettings={() => {}}
                    onOpenShare={() => {}}
                    isSimulating={false}
                    onToggleSimulation={() => {}}
                    isAiLoading={false}
                    onSummarize={() => {}}
                />
            </div>
        );
    }

    if (step.type === 'canvas') {
        return (
            <div className="w-full h-full bg-[#111] relative" style={{ backgroundImage: "radial-gradient(#333 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                <SandboxLayout 
                    {...props}
                    setNotes={() => {}} 
                    sectionIdFilter={step.id}
                    embeddedMode={true}
                    backgroundStyle={{ background: 'transparent' }}
                    fontClass="font-sans"
                    userAvatar={null}
                    onBack={() => {}}
                    onOpenSettings={() => {}}
                    onOpenShare={() => {}}
                    onUpdateBoard={() => {}}
                />
            </div>
        );
    }

    if (step.type === 'poll') {
        const pollBoard: any = {
            ...board,
            polls: [{
                id: step.id,
                question: step.title,
                options: step.options || ['Yes', 'No'],
                type: 'multiple_choice'
            }],
            currentPollIndex: 0
        };

        return (
            <div className="w-full h-full bg-[#111] relative">
                <PollView 
                    {...props} 
                    board={pollBoard}
                    onUpdateBoard={() => {}} 
                />
            </div>
        );
    }

    // --- STANDARD SLIDES ---
    switch (step.type) {
        case 'canva': return <CanvaStep url={step.url} />;
        case 'google_slide': return <GoogleSlideStep url={step.url} />;
        case 'video': return <VideoStep url={step.url} />;
        case 'image': return <ImageStep url={step.url} title={step.title} />;
        case 'website': return <iframe src={step.url} className="w-full h-full border-0 bg-white" />;
        default: return <div className="flex items-center justify-center h-full text-gray-500">Unknown or Unsupported Step Type</div>;
    }
};
