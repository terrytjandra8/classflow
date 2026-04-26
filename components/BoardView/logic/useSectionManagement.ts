
import { useCallback } from 'react';
import { Board } from '../../../types';

interface SectionManagementProps {
    board: Board;
    onUpdateBoard: (updates: Partial<Board>) => void;
}

export const useSectionManagement = ({
    board,
    onUpdateBoard
}: SectionManagementProps) => {
    const getEffectiveSections = useCallback(() => {
        if (board.sections && board.sections.length > 0) return board.sections;
        return [{ 
            id: 'default', 
            title: 'Group 1',
            locked: false,
            isContentBlurred: false,
            isHidden: false,
            isAnonymous: false,
            commentsEnabled: true,
            repliesEnabled: true,
            studentsCanDrag: false
        }];
    }, [board.sections]);

    const toggleSectionLock = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, locked: !s.locked } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionContentBlur = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const current = s.isContentBlurred !== undefined ? s.isContentBlurred : s.isTitleBlurred;
                return { ...s, isContentBlurred: !current, isTitleBlurred: !current };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionVisibility = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, isHidden: !s.isHidden } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionAnonymous = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, isAnonymous: !s.isAnonymous } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionComments = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.commentsEnabled !== false; 
                return { ...s, commentsEnabled: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionReplies = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.repliesEnabled !== false;
                return { ...s, repliesEnabled: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionRearrange = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => {
            if (s.id === sectionId) {
                const currentVal = s.studentsCanDrag !== undefined ? s.studentsCanDrag : (board.studentsCanDrag ?? false);
                return { ...s, studentsCanDrag: !currentVal };
            }
            return s;
        });
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, board.studentsCanDrag, onUpdateBoard]);

    const toggleSectionWatermark = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, isWatermarked: !s.isWatermarked } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    const toggleSectionCopy = useCallback((sectionId: string) => {
        const sections = getEffectiveSections();
        const updatedSections = sections.map(s => s.id === sectionId ? { ...s, disableCopy: !s.disableCopy } : s);
        onUpdateBoard({ sections: updatedSections });
    }, [getEffectiveSections, onUpdateBoard]);

    return {
        toggleSectionLock,
        toggleSectionContentBlur,
        toggleSectionVisibility,
        toggleSectionAnonymous,
        toggleSectionComments,
        toggleSectionReplies,
        toggleSectionRearrange,
        toggleSectionWatermark,
        toggleSectionCopy
    };
};
