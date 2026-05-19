import React from 'react';

interface Props {
  status?: 'P' | 'T' | 'V' | 'L';
  isWeekend: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

export const StatusCell: React.FC<Props> = React.memo(({ status, isWeekend, onSelect }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'P': return 'bg-green-600 text-white';
      case 'T': return 'bg-blue-600 text-white';
      case 'V': return 'bg-purple-600 text-white';
      case 'L': return 'bg-red-600 text-white';
      default: return isWeekend ? 'bg-slate-800/50' : 'bg-slate-900/20';
    }
  };

  return (
    <div 
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={`
        h-8 w-8 min-w-[2rem] border-r border-b border-slate-800 flex items-center justify-center 
        text-[10px] font-bold cursor-crosshair hover:brightness-125 transition-all select-none
        ${getStatusStyle()}
      `}
    >
      {status || ''}
    </div>
  );
});

StatusCell.displayName = 'StatusCell';