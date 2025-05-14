"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { useState } from 'react';
import { RepoInputForm } from '@/components/RepoInputForm';
import { MergeOutputDisplay } from '@/components/MergeOutputDisplay';
import { GithubBrowserSection } from '@/components/GithubBrowserSection';
import { Zap, GitMerge, MonitorPlay } from 'lucide-react';

export default function RepoFusionPageContent() {
  const [mergeOutput, setMergeOutput] = useState<IntelligentMergeOutput | null>(null);

  const handleMergeSuccess = (output: IntelligentMergeOutput) => {
    setMergeOutput(output);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col space-y-6 bg-background text-foreground">
      <header className="text-center space-y-2">
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
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <RepoInputForm onMergeSuccess={handleMergeSuccess} />
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
    </div>
  );
}
