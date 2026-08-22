import React from 'react';

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'critical' | 'success' | 'warning', className?: string }) {
  const colors = {
    default: 'bg-neutral-100 text-neutral-700',
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    success: 'bg-emerald-100 text-emerald-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
}
