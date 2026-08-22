import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 border-b border-gray-800 pb-2">
      <h2 className="text-xl font-bold text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>}
    </div>
  );
}
