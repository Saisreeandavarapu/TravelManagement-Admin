import React from 'react';

const Spinner = ({ size = 'md', fullPage = false, className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-primary-500 border-r-transparent border-b-primary-500 border-l-transparent ${sizeClasses[size] || sizeClasses.md}`}
      />
      {fullPage && (
        <span className="text-sm font-semibold text-slate-600 animate-pulse">
          Loading Travel Dashboard...
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/10 backdrop-blur-md">
        <div className="bg-white/95 p-6 rounded-2xl shadow-xl border border-slate-100/50 flex flex-col items-center gap-4">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;
