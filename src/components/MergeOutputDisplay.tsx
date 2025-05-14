
"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { Code, FileText, PackageSearch, DownloadCloud, FileCode, ChevronRight } from 'lucide-react';
import { Window } from '@/components/Window';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // We'll need file-saver for robust download
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MergeOutputDisplayProps {
  output: IntelligentMergeOutput | null;
}

type GeneratedFile = IntelligentMergeOutput['files'][0];

export function MergeOutputDisplay({ output }: MergeOutputDisplayProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState("summary"); // Default to summary

  if (!output || (!output.files && !output.summary)) {
    return (
      <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
          <PackageSearch size={48} className="text-primary/70 mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Awaiting Merge Results</h3>
          <p className="text-sm text-muted-foreground">
            Your intelligently merged codebase (as files) and summary will appear here.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Configure repositories in the 'AI Merge Control' panel and initiate the fusion!
          </p>
        </div>
      </Window>
    );
  }
  
  // If files exist, default code tab to the first file, otherwise default to summary.
  // This effect runs when 'output' changes.
  React.useEffect(() => {
    if (output?.files && output.files.length > 0) {
      setSelectedFile(output.files[0]);
      if (activeTab !== "code") setActiveTab("code"); // Switch to code tab if not already active
    } else if (output?.summary) {
      setSelectedFile(null);
      if (activeTab !== "summary") setActiveTab("summary");
    }
  }, [output, activeTab]);


  const handleDownloadZip = async () => {
    if (!output || !output.files || output.files.length === 0) {
      toast({ title: "No Files to Download", description: "The AI did not generate any files.", variant: "destructive" });
      return;
    }

    const zip = new JSZip();
    output.files.forEach(file => {
      zip.file(file.path, file.content);
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "repofusion_merged_project.zip");
      toast({ title: "Download Started!", description: "Your merged project ZIP is downloading." });
    } catch (error) {
      console.error("Error generating ZIP:", error);
      toast({ title: "Download Failed", description: "Could not generate ZIP file.", variant: "destructive" });
    }
  };
  
  const handleCopySummary = () => {
    if (output?.summary) {
      navigator.clipboard.writeText(output.summary)
        .then(() => toast({ title: "Summary Copied!", description: "Merge summary copied to clipboard." }))
        .catch(err => toast({ title: "Copy Failed", description: "Could not copy summary.", variant: "destructive" }));
    }
  };

  const handleCopyFileContent = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content)
        .then(() => toast({ title: "File Content Copied!", description: `${selectedFile.path} copied to clipboard.` }))
        .catch(err => toast({ title: "Copy Failed", description: "Could not copy file content.", variant: "destructive" }));
    }
  };

  const hasFiles = output.files && output.files.length > 0;

  return (
    <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="code" disabled={!hasFiles} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Generated Files</TabsTrigger>
          <TabsTrigger value="summary" disabled={!output.summary} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className={cn("flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden", !hasFiles && "hidden")}>
          {hasFiles && (
            <div className="flex h-full">
              <ScrollArea className="w-1/3 border-r border-border p-1 bg-muted/30 custom-scrollbar">
                <div className="p-1 space-y-1">
                  {output.files.map((file, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "w-full justify-start text-xs h-auto py-1.5 px-2 text-left",
                        selectedFile?.path === file.path ? "bg-primary/20 text-primary font-semibold" : "hover:bg-muted"
                      )}
                      title={file.path}
                    >
                      <FileCode size={14} className="mr-2 shrink-0" />
                      <span className="truncate">{file.path.split('/').pop()}</span>
                      <ChevronRight size={14} className="ml-auto shrink-0 opacity-50" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="w-2/3 flex flex-col relative">
                {selectedFile && (
                  <>
                    <div className="p-2 border-b border-border text-xs text-muted-foreground bg-muted/30 truncate">
                      {selectedFile.path}
                    </div>
                    <Button onClick={handleCopyFileContent} size="sm" variant="outline" className="absolute top-1 right-1 z-10 border-primary text-primary hover:bg-primary/10 h-7 px-2 text-xs">Copy Code</Button>
                    <ScrollArea className="flex-grow p-1 bg-input rounded-sm custom-scrollbar">
                      <pre className="text-xs whitespace-pre-wrap p-2">{selectedFile.content}</pre>
                    </ScrollArea>
                  </>
                )}
                {!selectedFile && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a file to view its content.
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className={cn("flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden", !output.summary && "hidden")}>
          {output.summary && (
            <>
              <Button onClick={handleCopySummary} size="sm" variant="outline" className="absolute top-2 right-2 z-10 border-primary text-primary hover:bg-primary/10">Copy Summary</Button>
              <ScrollArea className="h-full w-full p-1 bg-input rounded-sm custom-scrollbar">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2 flex items-center">
                    <FileText size={20} className="mr-2" /> Merge Summary
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{output.summary}</p>
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
      {hasFiles && (
         <div className="p-2 border-t border-border mt-auto">
          <Button onClick={handleDownloadZip} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            <DownloadCloud size={16} className="mr-2" /> Download Project (.zip)
          </Button>
        </div>
      )}
    </Window>
  );
}
