
import React from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
    imageUrl: string;
    onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={onClose}
        >
            <img 
                src={imageUrl} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                alt="Student submission preview" 
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
            />
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
                aria-label="Close image viewer"
            >
                <X size={24} />
            </button>
        </div>
    );
};
