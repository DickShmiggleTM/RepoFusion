
"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { Code, FileText, PackageSearch } from 'lucide-react';
import { Window } from '@/components/Window';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface MergeOutputDisplayProps {
  output: IntelligentMergeOutput | null;
}

export function MergeOutputDisplay({ output }: MergeOutputDisplayProps) {
  const { toast } = useToast();

  if (!output) {
    return (
      <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
          <PackageSearch size={48} className="text-primary/70 mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Awaiting Merge Results</h3>
          <p className="text-sm text-muted-foreground">
            Your intelligently merged codebase and summary will appear here.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Configure repositories in the 'AI Merge Control' panel and initiate the fusion!
          </p>
        </div>
      </Window>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(output.mergedCodebase)
      .then(() => toast({ title: "Code Copied!", description: "Merged codebase copied to clipboard." }))
      .catch(err => toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive" }));
  };
  
  const handleCopySummary = () => {
    navigator.clipboard.writeText(output.summary)
      .then(() => toast({ title: "Summary Copied!", description: "Merge summary copied to clipboard." }))
      .catch(err => toast({ title: "Copy Failed", description: "Could not copy summary.", variant: "destructive" }));
  };

  return (
    <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
      <Tabs defaultValue="code" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="code" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Merged Code</TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden">
          <Button onClick={handleCopyCode} size="sm" variant="outline" className="absolute top-2 right-2 z-10 border-primary text-primary hover:bg-primary/10">Copy Code</Button>
          <ScrollArea className="h-full w-full p-1 bg-input rounded-sm">
            <pre className="text-xs whitespace-pre-wrap p-2">{output.mergedCodebase}</pre>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="summary" className="flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden">
          <Button onClick={handleCopySummary} size="sm" variant="outline" className="absolute top-2 right-2 z-10 border-primary text-primary hover:bg-primary/10">Copy Summary</Button>
          <ScrollArea className="h-full w-full p-1 bg-input rounded-sm">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-primary mb-2 flex items-center">
                <FileText size={20} className="mr-2" /> Merge Summary
              </h3>
              <p className="text-sm whitespace-pre-wrap">{output.summary}</p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Window>
  );
}
