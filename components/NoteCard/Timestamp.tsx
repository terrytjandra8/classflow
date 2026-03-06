
import React, { useState, useRef, useEffect } from 'react';
import { Edit3 } from 'lucide-react';

interface TimestampProps {
  time: number;
  isEdited?: boolean;
}

const formatFullTimestamp = (time: number) => {
  return new Date(time).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (time: number) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - time) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
      return new Date(time).toLocaleDateString();
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + "h ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + "m ago";
    }
    return "just now";
  };
  

export const Timestamp: React.FC<TimestampProps> = ({ time, isEdited = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isMobile = () => {
    if (typeof navigator !== 'undefined') {
        return /Mobi|Android/i.test(navigator.userAgent);
    }
    return false;
  }

  const handleMouseEnter = () => {
    if (!isMobile()){
        setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile()){
        setIsHovered(false);
    }
  };

  const handleClick = () => {
    if (isMobile()){
        setIsClicked(!isClicked);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsClicked(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  return (
    <div 
      className="relative flex items-center cursor-pointer" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      ref={ref}
    >
      <span className={`italic flex items-center gap-1 opacity-70`}>
        {isEdited && <Edit3 size={8} />}
        {formatRelativeTime(time)}
      </span>
      {(isHovered || isClicked) && (
        <div className="absolute bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded-md py-1.5 px-3 z-10 shadow-lg">
          {formatFullTimestamp(time)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};
