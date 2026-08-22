import React from 'react';

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'critical' | 'success' | 'warning', className?: string }) {
  const colors = {
    default: 'bg-muted/50 text-muted-foreground border-border',
    critical: 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
}
