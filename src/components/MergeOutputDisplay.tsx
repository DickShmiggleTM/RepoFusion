
"use client";

import type { IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { Code, FileText, PackageSearch, DownloadCloud, FileCode, ChevronRight, Copy } from 'lucide-react';
import { Window } from '@/components/Window';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; 
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MergeOutputDisplayProps {
  output: IntelligentMergeOutput | null;
}

type GeneratedFile = IntelligentMergeOutput['files'][0];

export function MergeOutputDisplay({ output }: MergeOutputDisplayProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState("summary"); 

  const hasFiles = output?.files && output.files.length > 0;
  const hasSummary = output?.summary && output.summary.trim() !== '';

  useEffect(() => {
    if (hasFiles) {
      setSelectedFile(output!.files[0]); // output must be non-null if hasFiles is true
      if (activeTab !== "code") setActiveTab("code"); 
    } else if (hasSummary) {
      setSelectedFile(null);
      if (activeTab !== "summary") setActiveTab("summary");
    } else { 
      setSelectedFile(null);
      setActiveTab("summary"); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output, hasFiles, hasSummary]); 


  if (!hasFiles && !hasSummary) {
    return (
      <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
          <PackageSearch size={48} className="text-primary/70 mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-primary mb-2">Awaiting Merge Results</h3>
          <p className="text-sm text-muted-foreground">
            The AI's conceptual merge plan and generated files will appear here.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Configure repositories and settings in the 'AI Merge Control' panel, then initiate the fusion!
          </p>
        </div>
      </Window>
    );
  }
  
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


  return (
    <Window title="AI Merge Output" icon={<Code size={18} />} className="min-h-[400px] flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="code" disabled={!hasFiles} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Generated Files</TabsTrigger>
          <TabsTrigger value="summary" disabled={!hasSummary} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className={cn("flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden", !hasFiles && "hidden")}>
          {hasFiles && output?.files && (
            <div className="flex h-full">
              <ScrollArea className="w-1/3 border-r border-border p-1 bg-muted/30 custom-scrollbar">
                <div className="p-1 space-y-1">
                  {output.files.map((file, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "w-full justify-start text-xs h-auto py-1.5 px-2 text-left transition-colors duration-150 group",
                        selectedFile?.path === file.path ? "bg-primary/30 text-primary font-semibold ring-1 ring-primary" : "hover:bg-primary/10 hover:text-primary"
                      )}
                      title={file.path}
                    >
                      <FileCode size={14} className="mr-2 shrink-0" />
                      <span className="truncate">{file.path.split('/').pop()}</span>
                      <ChevronRight size={14} className="ml-auto shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="w-2/3 flex flex-col relative">
                {selectedFile ? (
                  <>
                    <div className="p-2 border-b border-border text-xs text-muted-foreground bg-muted/30 truncate flex justify-between items-center">
                      <span>{selectedFile.path}</span>
                      <Button onClick={handleCopyFileContent} size="icon" variant="ghost" className="h-6 w-6 text-primary hover:bg-primary/10 hover:text-primary">
                        <Copy size={12} />
                         <span className="sr-only">Copy Code</span>
                      </Button>
                    </div>
                    <ScrollArea className="flex-grow p-1 bg-input rounded-sm custom-scrollbar">
                      <pre className="text-xs whitespace-pre-wrap p-2">{selectedFile.content}</pre>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center animate-fade-in">
                     <FileCode size={32} className="mb-3 opacity-50" />
                    <p>Select a file from the list to view its content.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className={cn("flex-grow mt-0 overflow-hidden relative data-[state=active]:animate-fade-in data-[state=inactive]:hidden", !hasSummary && "hidden")}>
          {hasSummary && output?.summary && ( 
            <>
              <div className="p-2 border-b border-border text-xs text-muted-foreground bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-primary flex items-center">
                    <FileText size={16} className="mr-2" /> Merge Summary & Plan
                </h3>
                <Button onClick={handleCopySummary} size="icon" variant="ghost" className="h-6 w-6 text-primary hover:bg-primary/10 hover:text-primary">
                    <Copy size={12} />
                    <span className="sr-only">Copy Summary</span>
                </Button>
              </div>
              <ScrollArea className="h-full w-full p-1 bg-input rounded-sm custom-scrollbar">
                <div className="p-4">
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
            <DownloadCloud size={16} className="mr-2" /> Download Project Files (.zip)
          </Button>
        </div>
      )}
    </Window>
  );
}
