
"use client";

import type { IntelligentMergeInput, IntelligentMergeOutput } from '@/ai/flows/intelligent-merge';
import { intelligentMerge } from '@/ai/flows/intelligent-merge';
import { zodResolver } from '@hookform/resolvers/zod';
import { Terminal, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  repositoryUrls: z.array(z.string().url({ message: "Invalid URL format." }).min(1, { message: "URL cannot be empty." }))
    .min(2, { message: "At least two repository URLs are required." })
    .max(MAX_REPOS, { message: `A maximum of ${MAX_REPOS} repository URLs are allowed.` }),
  targetLanguage: z.string().optional(),
  instructions: z.string().optional(),
});

// Base type for the form, excluding settings
type RepoInputFormData = z.infer<typeof formSchema>;

type RepoInputFormProps = {
  onMergeSuccess: (output: IntelligentMergeOutput) => void;
  appSettings: AppSettings;
};

export function RepoInputForm({ onMergeSuccess, appSettings }: RepoInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { control, handleSubmit, register, formState: { errors } } = useForm<RepoInputFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repositoryUrls: ['', ''],
      targetLanguage: 'TypeScript',
      instructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "repositoryUrls",
  });

  const onSubmit = async (data: RepoInputFormData) => {
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
        mainApiModel: appSettings.mainApiModel,
        ollamaMainModelName: appSettings.mainApiModel === 'ollama' ? appSettings.ollamaMainModelName : undefined,
        useCustomReasoningModel: appSettings.useCustomReasoningModel,
        reasoningApiModel: appSettings.reasoningApiModel,
        ollamaReasoningModelName: appSettings.useCustomReasoningModel && appSettings.reasoningApiModel === 'ollama' ? appSettings.ollamaReasoningModelName : undefined,
        useCustomCodingModel: appSettings.useCustomCodingModel,
        codingApiModel: appSettings.codingApiModel,
        ollamaCodingModelName: appSettings.useCustomCodingModel && appSettings.codingApiModel === 'ollama' ? appSettings.ollamaCodingModelName : undefined,
        llamafilePath: appSettings.llamafilePath,
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

  return (
    <Window title="RepoFusion AI Merge Control" icon={<Terminal size={18} />} className="min-h-[400px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-full flex flex-col">
        <fieldset disabled={isLoading} className="flex-grow contents">
          <ScrollArea className="flex-grow pr-3 custom-scrollbar">
            <div className="space-y-3">
              <div>
                <Label htmlFor="repositoryUrls" className="text-primary">Repository URLs (2 to {MAX_REPOS})</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2 mt-1">
                    <Input
                      {...register(`repositoryUrls.${index}` as const)}
                      placeholder={`https://github.com/user/repo${index + 1}`}
                      className="bg-input border-primary/50 focus:border-primary"
                      aria-invalid={errors.repositoryUrls?.[index] ? "true" : "false"}
                      disabled={isLoading}
                    />
                    {fields.length > 2 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="p-1 h-8 w-8" aria-label={`Remove repository URL ${index + 1}`} disabled={isLoading}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                {(errors.repositoryUrls?.message || errors.repositoryUrls?.root?.message) && <p className="text-destructive text-xs mt-1" role="alert">{errors.repositoryUrls.message || errors.repositoryUrls.root?.message}</p>}
                {fields.map((_, index) => errors.repositoryUrls?.[index] && <p key={`error-${index}`} className="text-destructive text-xs mt-1" role="alert">{errors.repositoryUrls[index]?.message}</p>)}

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append('')} 
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
          <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            {isLoading ? "Merging Repositories..." : "🚀 Fuse Repositories"}
          </Button>
        </div>
      </form>
    </Window>
  );
}
