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
    <div className="bg-white border-b border-zinc-200 px-8 py-5 shrink-0 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button 
              onClick={() => router.back()} 
              className="w-9 h-9 flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          {icon && (
            <div className="w-11 h-11 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
            <p className="text-sm text-zinc-500 font-medium mt-0.5">{description}</p>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}