import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextMenuProps {
    x: number;
    y: number;
    position?: 'fixed' | 'absolute';
    containerRect?: DOMRect | null;
    options: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        danger?: boolean;
    }[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose, position = 'fixed', containerRect }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [onClose]);

    const menuWidth = 200;
    const menuHeight = options.length * 45;
    const bounds = containerRect
        ? {
              left: containerRect.left,
              top: containerRect.top,
              width: containerRect.width,
              height: containerRect.height
          }
        : {
              left: 0,
              top: 0,
              width: window.innerWidth,
              height: window.innerHeight
          };

    const relX = position === 'absolute' ? x - bounds.left : x;
    const relY = position === 'absolute' ? y - bounds.top : y;
    const maxX = bounds.width - menuWidth - 12;
    const maxY = bounds.height - menuHeight - 12;
    const adjustedX = Math.min(Math.max(relX, 8), Math.max(8, maxX));
    const adjustedY = Math.min(Math.max(relY, 8), Math.max(8, maxY));

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ top: adjustedY, left: adjustedX, position }}
                className="z-[9999] min-w-[200px] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl py-2 overflow-hidden"
            >
                {options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            opt.onClick();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${opt.danger
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-gray-200 hover:bg-blue-600/20 hover:text-blue-400'
                            }`}
                    >
                        <span className="text-lg">{opt.icon}</span>
                        {opt.label}
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
};

export default ContextMenu;
