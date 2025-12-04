import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total === 0 ? 0 : Math.round((current / total) * 100);

  // Dynamic color based on progress
  const getColor = () => {
    if (percentage < 30) return 'bg-red-400';
    if (percentage < 70) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Daily Progress</span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-700 ease-out ${getColor()}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
        {current} of {total} tasks completed
      </p>
    </div>
  );
};

export default ProgressBar;