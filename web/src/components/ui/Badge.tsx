import React from 'react';

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'critical' | 'success' | 'warning', className?: string }) {
  const colors = {
    default: 'bg-gray-800 text-gray-300 border-gray-700',
    critical: 'bg-red-900/50 text-red-400 border-red-800',
    warning: 'bg-amber-900/50 text-amber-400 border-amber-800',
    success: 'bg-green-900/50 text-green-400 border-green-800',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono border ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
}
