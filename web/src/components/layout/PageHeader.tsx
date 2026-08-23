'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export function PageHeader({ title, description, icon, actions, showBack }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-zinc-200/80 px-6 lg:px-8 py-4.5 shrink-0 sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5 min-w-0">
          {showBack && (
            <button 
              onClick={() => router.back()} 
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-2xs"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          {icon && (
            <div className="w-9 h-9 bg-zinc-100/80 rounded-lg flex items-center justify-center border border-zinc-200/70 text-zinc-700 shrink-0 shadow-2xs">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight truncate">{title}</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate">{description}</p>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}