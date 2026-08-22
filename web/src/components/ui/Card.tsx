import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-border rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1 p-6 pb-0">
      <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>}
    </div>
  );
}
