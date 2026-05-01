
import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => (
    <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-white gap-4 z-[100] fixed inset-0">
        <Loader2 className="animate-spin text-pink-500" size={48} />
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading Experience...</p>
    </div>
);
