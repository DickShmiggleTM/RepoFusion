
"use client";

import type { IntelligentMergeInput, IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { intelligentMerge } from '@/ai/flows/intelligent-merge';
import { zodResolver } from '@hookform/resolvers/zod';
import { Terminal, PlusCircle, Trash2 } from 'lucide-react';
import { useState, useImperativeHandle, forwardRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldArrayWithId, UseFieldArrayUpdate } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Window } from '@/components/Window';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppSettings } from '@/types/settings';
import { Progress } from '@/components/ui/progress';

const MAX_REPOS = 15;

const formSchema = z.object({
  repositoryUrls: z.array(
      z.string().url({ message: "Invalid URL format." }).min(1, { message: "URL cannot be empty." })
    )
    .min(1, { message: "At least one repository URL is required." })
    .max(MAX_REPOS, { message: `A maximum of ${MAX_REPOS} repository URLs are allowed.` }),
  targetLanguage: z.string().optional(),
  instructions: z.string().optional(),
});

type RepoInputFormData = z.infer<typeof formSchema>;

export type RepoInputFormHandle = {
  addRepositoryUrls: (urls: string[]) => void;
};

type RepoInputFormProps = {
  onMergeSuccess: (output: IntelligentMergeOutput) => void;
  appSettings: AppSettings;
};

export const RepoInputForm = forwardRef<RepoInputFormHandle, RepoInputFormProps>(
  ({ onMergeSuccess, appSettings }, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const { control, handleSubmit, register, formState: { errors }, getValues, setValue } = useForm<RepoInputFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        repositoryUrls: [''], // Start with one empty field
        targetLanguage: 'TypeScript',
        instructions: '',
      },
    });

    const { fields, append, remove, update } = useFieldArray({
      control,
      name: "repositoryUrls",
    });

    useImperativeHandle(ref, () => ({
      addRepositoryUrls: (urlsToAdd: string[]) => {
        const existingUrlsInForm = getValues("repositoryUrls").map(u => u?.trim()).filter(Boolean);
        let uniqueUrlsToAdd = urlsToAdd.filter(url => url.trim() && !existingUrlsInForm.includes(url.trim()));
        
        let addedCount = 0;
        let filledEmptySlot = false;

        // Try to fill empty fields first with unique URLs
        fields.forEach((field, index) => {
          if (!field.value?.trim() && uniqueUrlsToAdd.length > 0 && existingUrlsInForm.length + addedCount < MAX_REPOS) {
            const nextUrl = uniqueUrlsToAdd.shift(); // Take from the unique list
            if (nextUrl) {
              (update as UseFieldArrayUpdate<RepoInputFormData, "repositoryUrls">)(index, nextUrl);
              existingUrlsInForm.push(nextUrl); // Add to existing to track it
              addedCount++;
              filledEmptySlot = true;
            }
          }
        });
        
        // Append remaining unique URLs if space allows
        uniqueUrlsToAdd.forEach(url => {
          if (existingUrlsInForm.length + addedCount < MAX_REPOS) {
            append(url);
            addedCount++;
          }
        });

        if (addedCount < urlsToAdd.length && urlsToAdd.length > 0) {
             const notAddedCount = urlsToAdd.length - addedCount;
             toast({ 
                title: "Some URLs Not Added", 
                description: `${notAddedCount} URL(s) were not added. Max ${MAX_REPOS} unique repos, or URL already present.`, 
                variant: "default" 
            });
        } else if (addedCount > 0) {
             toast({ title: "Repositories Added", description: `${addedCount} recommended URL(s) added to the merge list.` });
        }

        // Ensure at least one input field if all were filled/removed and list is empty
        const currentFields = getValues("repositoryUrls");
        if (currentFields.every(url => !url?.trim()) && fields.length === 0) {
           append('');
        } else if (fields.length === 0 && currentFields.length === 0) { // If no fields at all
           append('');
        }
      }
    }));

    const onSubmit = async (data: RepoInputFormData) => {
      const validUrls = data.repositoryUrls.filter(url => url && url.trim() !== '');
      if (validUrls.length < 1) {
          toast({ title: "Validation Error", description: "At least one valid repository URL is required to merge.", variant: "destructive"});
          return;
      }
      
      setIsLoading(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Hold at 90% until completion
          return prev + Math.floor(Math.random() * 5) + 5; // Simulate variable progress
        });
      }, 300);

      try {
        toast({ title: "🤖 AI Merge Initiated", description: "The AI is processing your repositories. This may take a moment..." });
        
        const fullInput: IntelligentMergeInput = {
          ...data,
          repositoryUrls: validUrls, // Use only valid URLs
          mainApiModel: appSettings.mainApiModel,
          ollamaMainModelName: appSettings.mainApiModel === 'ollama' ? appSettings.ollamaMainModelName : undefined,
          geminiMainModelName: appSettings.mainApiModel === 'gemini' ? appSettings.geminiMainModelName : undefined,
          openrouterMainModelName: appSettings.mainApiModel === 'openrouter' ? appSettings.openrouterMainModelName : undefined,
          huggingfaceMainModelName: appSettings.mainApiModel === 'huggingface' ? appSettings.huggingfaceMainModelName : undefined,
          
          useCustomReasoningModel: appSettings.useCustomReasoningModel,
          reasoningApiModel: appSettings.useCustomReasoningModel ? appSettings.reasoningApiModel : undefined,
          ollamaReasoningModelName: appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'ollama' ? appSettings.ollamaReasoningModelName : undefined,
          geminiReasoningModelName: appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'gemini' ? appSettings.geminiReasoningModelName : undefined,
          openrouterReasoningModelName: appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'openrouter' ? appSettings.openrouterReasoningModelName : undefined,
          huggingfaceReasoningModelName: appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'huggingface' ? appSettings.huggingfaceReasoningModelName : undefined,
          
          useCustomCodingModel: appSettings.useCustomCodingModel,
          codingApiModel: appSettings.useCustomCodingModel ? appSettings.codingApiModel : undefined,
          ollamaCodingModelName: appSettings.useCustomCodingModel && appSettings.codingApiModel === 'ollama' ? appSettings.ollamaCodingModelName : undefined,
          geminiCodingModelName: appSettings.useCustomCodingModel && appSettings.codingApiModel === 'gemini' ? appSettings.geminiCodingModelName : undefined,
          openrouterCodingModelName: appSettings.useCustomCodingModel && appSettings.codingApiModel === 'openrouter' ? appSettings.openrouterCodingModelName : undefined,
          huggingfaceCodingModelName: appSettings.useCustomCodingModel && appSettings.codingApiModel === 'huggingface' ? appSettings.huggingfaceCodingModelName : undefined,
          
          llamafilePath: appSettings.mainApiModel === 'llamafile' || 
                         (appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'llamafile') || 
                         (appSettings.useCustomCodingModel && appSettings.codingApiModel === 'llamafile') 
                         ? appSettings.llamafilePath : undefined,
          
          geminiApiKey: appSettings.geminiApiKey || undefined, // Pass API keys for context
          openrouterApiKey: appSettings.openrouterApiKey || undefined,
          huggingfaceApiKey: appSettings.huggingfaceApiKey || undefined,
        };
        
        const result = await intelligentMerge(fullInput);
        clearInterval(progressInterval);
        setProgress(100);
        onMergeSuccess(result);
        toast({ title: "✅ Merge Successful!", description: "The AI has completed the merge." });
      } catch (error) {
        clearInterval(progressInterval);
        setProgress(0); // Reset progress on error
        console.error("Error during intelligent merge:", error);
        toast({
          title: "❌ Merge Failed",
          description: (error as Error).message || "An unexpected error occurred during the merge process.",
          variant: "destructive",
          duration: 7000, // Longer duration for error messages
        });
      } finally {
        // Ensure loading state and progress are reset after a delay, allowing toast to be seen
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 1500);
      }
    };
    
    const handleRemoveUrl = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        } else if (fields.length === 1) {
            // If it's the last field, clear its value instead of removing it,
            // to maintain at least one input field.
             (update as UseFieldArrayUpdate<RepoInputFormData, "repositoryUrls">)(index, "");
        }
    };

    return (
      <Window title="RepoFusion AI Merge Control" icon={<Terminal size={18} />} className="min-h-[400px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
          <fieldset disabled={isLoading} className="flex-grow contents"> {/* Using contents to allow ScrollArea direct child */}
            <ScrollArea className="flex-grow pr-3 custom-scrollbar"> {/* ScrollArea should be direct child for flex-grow */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="repositoryUrls" className="text-primary">Repository URLs (1 to {MAX_REPOS})</Label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2 mt-1">
                      <Input
                        {...register(`repositoryUrls.${index}` as const)}
                        defaultValue={field.value} // RHF handles default value internally
                        placeholder={`https://github.com/user/repo${index + 1}`}
                        className="bg-input border-primary/50 focus:border-primary"
                        aria-invalid={errors.repositoryUrls?.[index] ? "true" : "false"}
                        disabled={isLoading}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveUrl(index)} className="p-1 h-8 w-8" aria-label={`Remove repository URL ${index + 1}`} disabled={isLoading}>
                          <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  {/* Display general array errors */}
                  {(errors.repositoryUrls?.message || errors.repositoryUrls?.root?.message) && <p className="text-destructive text-xs mt-1" role="alert">{errors.repositoryUrls.message || errors.repositoryUrls.root?.message}</p>}
                  {/* Display per-item errors */}
                  {fields.map((_, index) => errors.repositoryUrls?.[index] && <p key={`error-${index}`} className="text-destructive text-xs mt-1" role="alert">{errors.repositoryUrls[index]?.message}</p>)}

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fields.length < MAX_REPOS ? append('') : null} 
                    className="mt-2 border-primary text-primary hover:bg-primary/10 hover:text-primary"
                    disabled={fields.length >= MAX_REPOS || isLoading}
                  >
                    <PlusCircle size={16} className="mr-2" /> Add Repository URL
                  </Button>
                   {fields.length >= MAX_REPOS && <p className="text-muted-foreground text-xs mt-1">Maximum {MAX_REPOS} repositories allowed.</p>}
                </div>

                <div>
                  <Label htmlFor="targetLanguage" className="text-primary">Target Language (Optional)</Label>
                  <Input
                    id="targetLanguage"
                    {...register("targetLanguage")}
                    placeholder="e.g., Python, JavaScript, TypeScript"
                    className="bg-input border-primary/50 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-primary">Additional Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    {...register("instructions")}
                    placeholder="e.g., Prioritize features from repo1, resolve conflicts by..., use microservice architecture"
                    className="bg-input border-primary/50 focus:border-primary min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </ScrollArea>
          </fieldset>
          
          <div className="pt-2 space-y-3"> {/* This div will not scroll, it's for progress and submit button */}
            {isLoading && (
              <div className="px-1">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-xs text-center text-primary mt-1">AI processing: {progress}%</p>
              </div>
            )}
            <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/80 active:scale-[0.98]">
              {isLoading ? "Merging Repositories..." : "🚀 Fuse Repositories"}
            </Button>
          </div>
        </form>
      </Window>
    );
  }
);
RepoInputForm.displayName = "RepoInputForm";
