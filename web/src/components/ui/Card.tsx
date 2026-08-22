import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={g-popover/70 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl transition-all duration-300 hover:shadow-primary/5 hover:border-border/60 }>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{subtitle}</p>}
    </div>
  );
}
