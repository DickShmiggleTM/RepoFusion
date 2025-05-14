
"use client";

import type { IntelligentMergeInput, IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { intelligentMerge } from '@/ai/flows/intelligent-merge';
import { zodResolver } from '@hookform/resolvers/zod';
import { Terminal, PlusCircle, Trash2 } from 'lucide-react';
import { useState, useImperativeHandle, forwardRef } from 'react';
import { useForm, useFieldArray, type FieldArrayWithId } from 'react-hook-form';
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

const MAX_REPOS = 5;

const formSchema = z.object({
  repositoryUrls: z.array(
      z.string().url({ message: "Invalid URL format." }).min(1, { message: "URL cannot be empty." })
    )
    .min(1, { message: "At least one repository URL is required." }) // Changed from 2 to 1 for flexibility with recommendations
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
        const currentUrls = getValues("repositoryUrls").map(u => u?.trim()).filter(Boolean);
        let addedCount = 0;

        // Try to fill empty fields first
        let filledEmpty = false;
        const updatedFields: Partial<FieldArrayWithId<RepoInputFormData, "repositoryUrls", "id">>[] = [];
        fields.forEach((field, index) => {
            if (!field.value?.trim() && urlsToAdd.length > 0 && currentUrls.length + addedCount < MAX_REPOS) {
                const nextUrl = urlsToAdd.shift();
                if (nextUrl && !currentUrls.includes(nextUrl)) {
                    update(index, nextUrl);
                    currentUrls.push(nextUrl); // Add to currentUrls to avoid duplicate appends
                    addedCount++;
                    filledEmpty = true;
                }
            }
        });
        
        // If any URLs are left to add, append them
        urlsToAdd.forEach(url => {
          if (currentUrls.length + addedCount < MAX_REPOS && !currentUrls.includes(url.trim())) {
            append(url.trim());
            addedCount++;
          } else if (currentUrls.includes(url.trim())) {
            // Optionally toast if URL already exists
            console.log(`URL already in list: ${url}`);
          }
        });

        if (addedCount === 0 && urlsToAdd.length > 0) {
          toast({ title: "List Full or URLs Exist", description: `Could not add all recommended URLs. Max ${MAX_REPOS} unique repos allowed.`, variant: "default" });
        }
         // Ensure at least one input field if all were filled/removed by recommendations
        if (getValues("repositoryUrls").filter(Boolean).length === MAX_REPOS && getValues("repositoryUrls").length > MAX_REPOS) {
           setValue("repositoryUrls", getValues("repositoryUrls").slice(0, MAX_REPOS) );
        } else if (getValues("repositoryUrls").filter(Boolean).length === 0 && fields.length === 0) {
           append('');
        } else if (fields.length === 0 && getValues("repositoryUrls").length === 0) {
           append(''); // Make sure there's always one input if empty
        }
      }
    }));

    const onSubmit = async (data: RepoInputFormData) => {
      const validUrls = data.repositoryUrls.filter(url => url && url.trim() !== '');
      if (validUrls.length < 1) { // Or 2, if you want to enforce minimum for merge
          toast({ title: "Validation Error", description: "At least one valid repository URL is required to merge.", variant: "destructive"});
          return;
      }
      
      setIsLoading(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
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
          llamafilePath: appSettings.mainApiModel === 'llamafile' || (appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'llamafile') || (appSettings.useCustomCodingModel && appSettings.codingApiModel === 'llamafile') ? appSettings.llamafilePath : undefined,
          geminiApiKey: appSettings.geminiApiKey || undefined,
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
        setProgress(0);
        console.error("Error during intelligent merge:", error);
        toast({
          title: "❌ Merge Failed",
          description: (error as Error).message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 1000);
      }
    };
    
    const handleRemoveUrl = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        } else if (fields.length === 1) {
            // If it's the last field, clear its value instead of removing it
            // to ensure there's always at least one input field present.
            update(index, ''); 
        }
    };

    return (
      <Window title="RepoFusion AI Merge Control" icon={<Terminal size={18} />} className="min-h-[400px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
          <fieldset disabled={isLoading} className="flex-grow contents">
            <ScrollArea className="flex-grow pr-3 custom-scrollbar">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="repositoryUrls" className="text-primary">Repository URLs (1 to {MAX_REPOS})</Label>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2 mt-1">
                      <Input
                        {...register(`repositoryUrls.${index}` as const)}
                        defaultValue={field.value}
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
                  {(errors.repositoryUrls?.message || errors.repositoryUrls?.root?.message) && <p className="text-destructive text-xs mt-1" role="alert">{errors.repositoryUrls.message || errors.repositoryUrls.root?.message}</p>}
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
                    placeholder="e.g., Python, JavaScript"
                    className="bg-input border-primary/50 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-primary">Additional Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    {...register("instructions")}
                    placeholder="e.g., Prioritize features from repo1, resolve conflicts by..."
                    className="bg-input border-primary/50 focus:border-primary min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </ScrollArea>
          </fieldset>
          
          <div className="pt-2 space-y-3">
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
