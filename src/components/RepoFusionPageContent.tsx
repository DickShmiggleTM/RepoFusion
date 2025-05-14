
"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { useState } from 'react';
import { RepoInputForm } from '@/components/RepoInputForm';
import { MergeOutputDisplay } from '@/components/MergeOutputDisplay';
import { GithubBrowserSection } from '@/components/GithubBrowserSection';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import type { AppSettings } from '@/types/settings';
import { defaultAppSettings } from '@/types/settings';
import { Zap, Cog } from 'lucide-react'; // GitMerge, MonitorPlay removed as they are unused

export default function RepoFusionPageContent() {
  const [mergeOutput, setMergeOutput] = useState<IntelligentMergeOutput | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);

  const handleMergeSuccess = (output: IntelligentMergeOutput) => {
    setMergeOutput(output);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    // Potentially save to localStorage here if persistence is needed across sessions
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col space-y-6 bg-background text-foreground">
      <header className="text-center space-y-2 relative">
        <div className="inline-flex items-center justify-center">
          <Zap size={48} className="text-primary animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary ml-3">
            RepoFusion
          </h1>
        </div>
        <p className="text-sm md:text-md text-muted-foreground max-w-2xl mx-auto">
          Intelligently merge multiple GitHub repositories into a single, functional application using AI.
          Experience it all in a nostalgic 90's OS dark mode interface.
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSettingsDialogOpen(true)}
          className="absolute top-0 right-0 text-primary border-primary hover:bg-primary/10 hover:text-primary"
          aria-label="Open Settings"
        >
          <Cog size={20} />
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <RepoInputForm onMergeSuccess={handleMergeSuccess} appSettings={appSettings} />
        </div>
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <MergeOutputDisplay output={mergeOutput} />
          <GithubBrowserSection />
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground/70 py-4 border-t border-border">
        <p>&copy; {new Date().getFullYear()} RepoFusion. Powered by AI and Retro Vibes.</p>
        <p>Press <kbd className="px-1.5 py-0.5 border border-foreground/50 rounded bg-muted text-foreground">Ctrl/Cmd</kbd> + <kbd className="px-1.5 py-0.5 border border-foreground/50 rounded bg-muted text-foreground">B</kbd> to toggle sidebar (if applicable).</p>
      </footer>

      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        currentSettings={appSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
