'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Settings, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configuration Saved', { description: 'Your telemetry and risk thresholds have been updated.' });
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      <PageHeader 
        title="System Configuration" 
        description="Manage AI thresholds and platform preferences"
        icon={<Settings size={20} className="text-blue-600" />}
        actions={
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:opacity-70"
          >
            {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        }
      />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <Settings size={48} className="mx-auto text-zinc-300 mb-4" />
          <h2 className="text-xl font-bold text-zinc-900">Settings available in full version</h2>
          <p className="text-zinc-500 mt-2">The configuration panel is locked for the demo environment.</p>
        </div>
      </div>
    </div>
  );
}