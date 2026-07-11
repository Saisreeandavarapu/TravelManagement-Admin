import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const SIZES = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-2xl',
  '2xl': 'max-w-3xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 10, 26, 0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${SIZES[size] || SIZES.md} animate-slide-down`}
        style={{
          background: '#fff',
          borderRadius: '1.5rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(99,102,241,0.1)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #6366f1, #06b6d4)' }} />
            <h3 className="font-display font-bold text-slate-800 text-base tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            style={{ transition: 'all 0.15s ease' }}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
