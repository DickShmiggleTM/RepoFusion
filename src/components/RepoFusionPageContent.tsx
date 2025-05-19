
"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { useState, useRef } from 'react';
import { RepoInputForm, type RepoInputFormHandle } from '@/components/RepoInputForm';
import { MergeOutputDisplay } from '@/components/MergeOutputDisplay';
import { GithubBrowserSection } from '@/components/GithubBrowserSection';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import type { AppSettings } from '@/types/settings';
import { defaultAppSettings } from '@/types/settings';
import { Zap, Cog } from 'lucide-react';
import { RepoRecommendationSection } from '@/components/RepoRecommendationSection';

export default function RepoFusionPageContent() {
  const [mergeOutput, setMergeOutput] = useState<IntelligentMergeOutput | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const repoInputFormRef = useRef<RepoInputFormHandle>(null);

  const handleMergeSuccess = (output: IntelligentMergeOutput) => {
    setMergeOutput(output);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
  };

  const handleAddRecommendedReposToForm = (urls: string[]) => {
    repoInputFormRef.current?.addRepositoryUrls(urls);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col space-y-6 bg-background text-foreground">
      <header className="text-center space-y-2 relative pt-4 md:pt-0 animate-fade-in">
        <div className="inline-flex items-center justify-center">
          <Zap size={48} className="text-primary animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-primary ml-3 title-glow">
            RepoFusion
          </h1>
        </div>
        <p className="text-sm md:text-md text-muted-foreground max-w-2xl mx-auto">
          Intelligently merge multiple GitHub repositories using AI. Get recommendations or browse GitHub directly.
          Experience it all in a nostalgic 90's OS dark mode interface.
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSettingsDialogOpen(true)}
          className="absolute top-0 right-0 m-1 md:m-0 text-primary border-primary hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
          aria-label="Open Settings"
        >
          <Cog size={20} />
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow animate-fade-in animation-delay-[100ms]">
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <RepoInputForm ref={repoInputFormRef} onMergeSuccess={handleMergeSuccess} appSettings={appSettings} />
        </div>
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <MergeOutputDisplay output={mergeOutput} />
          <RepoRecommendationSection appSettings={appSettings} onAddRecommendedReposToForm={handleAddRecommendedReposToForm} />
        </div>
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <GithubBrowserSection />
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground/70 py-6 mt-auto border-t border-border">
        <p>&copy; {new Date().getFullYear()} RepoFusion. Powered by AI and Retro Vibes.</p>
         <p>Press <kbd className="kbd-key">Ctrl/Cmd</kbd> + <kbd className="kbd-key">B</kbd> for potential sidebar (if applicable in future).</p>
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
