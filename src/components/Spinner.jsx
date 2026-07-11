import React from 'react';

const Spinner = ({ size = 'md' }) => {
  const dims = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const thick = { sm: '2px', md: '3px', lg: '4px' };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: size === 'sm' ? 20 : size === 'lg' ? 48 : 32, height: size === 'sm' ? 20 : size === 'lg' ? 48 : 32 }}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: `${thick[size]} solid transparent`,
            borderTopColor: '#6366f1',
            borderRightColor: '#06b6d4',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute rounded-full animate-spin"
          style={{
            inset: size === 'sm' ? '4px' : size === 'lg' ? '10px' : '7px',
            border: `${thick[size]} solid transparent`,
            borderTopColor: '#4f46e5',
            borderBottomColor: '#0891b2',
            animationDirection: 'reverse',
            animationDuration: '0.6s',
          }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            inset: size === 'sm' ? '8px' : size === 'lg' ? '19px' : '13px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          }}
        />
      </div>
      {size === 'lg' && (
        <p className="text-xs font-semibold text-slate-400 animate-pulse">Loading...</p>
      )}
    </div>
  );
};

export default Spinner;
