'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, position = 'top', delay = 200, className }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setIsMounted(true);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(false);
    };

    const positionClasses = {
      top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
      right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
      bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
      left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    };

    if (!isMounted) return <div ref={ref}>{children}</div>;

    return (
      <div
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        
        {isVisible && (
          <div
            ref={ref}
            className={cn(
              'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded-md whitespace-nowrap pointerevents-none',
              'shadow-lg transition-opacity duration-150 opacity-0 animate-fade-in',
              positionClasses[position],
              className
            )}
            role="tooltip"
            aria-hidden={!isVisible}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-1.5 h-1.5 bg-slate-900 dark:bg-slate-700 transform rotate-45',
                {
                  top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
                  right: 'right-full top-1/2 -translate-y-1/2 translate-x-1/2',
                  bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
                  left: 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2',
                }[position]
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';
