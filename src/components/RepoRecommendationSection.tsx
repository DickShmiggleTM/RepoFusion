
"use client";

import { recommendRepos, type RecommendReposInput, type RecommendReposOutput } from '@/ai/flows/recommend-repos-flow';
import type { AppSettings } from '@/types/settings';
import { Lightbulb, ListPlus, Loader2, ServerCrash, Sparkles, AlertTriangle, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { Window } from '@/components/Window';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface RepoRecommendationSectionProps {
  appSettings: AppSettings;
  onAddRecommendedReposToForm: (urls: string[]) => void;
}

export function RepoRecommendationSection({ appSettings, onAddRecommendedReposToForm }: RepoRecommendationSectionProps) {
  const [promptDescription, setPromptDescription] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendReposOutput['recommendations'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>("Error Fetching Recommendations");
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async (mode: 'general' | 'promptBased') => {
    if (mode === 'promptBased' && !promptDescription.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for prompt-based recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsServiceUnavailable(false);
    setRecommendations(null);
    setErrorTitle("Error Fetching Recommendations");


    const flowInput: RecommendReposInput = {
      mode,
      promptDescription: mode === 'promptBased' ? promptDescription : undefined,
      mainApiModel: appSettings.mainApiModel,
      ollamaMainModelName: appSettings.mainApiModel === 'ollama' ? appSettings.ollamaMainModelName : undefined,
      geminiMainModelName: appSettings.mainApiModel === 'gemini' ? appSettings.geminiMainModelName : undefined,
      openrouterMainModelName: appSettings.mainApiModel === 'openrouter' ? appSettings.openrouterMainModelName : undefined,
      huggingfaceMainModelName: appSettings.mainApiModel === 'huggingface' ? appSettings.huggingfaceMainModelName : undefined,
      llamafilePath: appSettings.mainApiModel === 'llamafile' ? appSettings.llamafilePath : undefined,
      geminiApiKey: appSettings.geminiApiKey,
      openrouterApiKey: appSettings.openrouterApiKey,
      huggingfaceApiKey: appSettings.huggingfaceApiKey,
      useCustomReasoningModel: appSettings.useCustomReasoningModel,
      reasoningApiModel: appSettings.reasoningApiModel,
      ollamaReasoningModelName: appSettings.ollamaReasoningModelName,
      geminiReasoningModelName: appSettings.geminiReasoningModelName,
      openrouterReasoningModelName: appSettings.openrouterReasoningModelName,
      huggingfaceReasoningModelName: appSettings.huggingfaceReasoningModelName,
      useCustomCodingModel: appSettings.useCustomCodingModel,
      codingApiModel: appSettings.codingApiModel,
      ollamaCodingModelName: appSettings.ollamaCodingModelName,
      geminiCodingModelName: appSettings.geminiCodingModelName,
      openrouterCodingModelName: appSettings.openrouterCodingModelName,
      huggingfaceCodingModelName: appSettings.huggingfaceCodingModelName,
    };

    try {
      const result = await recommendRepos(flowInput);
      setRecommendations(result.recommendations);
      toast({ title: "Recommendations Ready!", description: "AI has suggested some repositories." });
    } catch (err) {
      const errorMessage = (err as Error).message;
      let detailedErrorMessage = errorMessage;
      let currentErrorTitle = "Recommendation Failed";
      setIsServiceUnavailable(false);

      if (errorMessage.includes('NOT_FOUND') && flowInput.mainApiModel) {
        currentErrorTitle = `${flowInput.mainApiModel.charAt(0).toUpperCase() + flowInput.mainApiModel.slice(1)} Model Not Found`;
        let specificAdvice = "Please ensure the model ID is correct and accessible.";
        if (flowInput.mainApiModel === 'openrouter') {
          specificAdvice = "Ensure the OpenRouter Genkit plugin is correctly configured in src/ai/genkit.ts and your OPENROUTER_API_KEY in .env is valid and has access to the model.";
        } else if (flowInput.mainApiModel === 'huggingface') {
          specificAdvice = "Ensure the HuggingFace Genkit plugin is configured in src/ai/genkit.ts, your HF_API_TOKEN in .env is valid, and the model ID is correct.";
        } else if (flowInput.mainApiModel === 'ollama') {
          specificAdvice = "Ensure your Ollama server is running, the specified model is pulled (e.g., 'ollama pull modelname'), and the Ollama Genkit plugin (if used) is configured in src/ai/genkit.ts.";
        }
        detailedErrorMessage = `${specificAdvice} Original error: ${errorMessage}`;
      } else if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('service unavailable') || errorMessage.toLowerCase().includes('overloaded')) {
        currentErrorTitle = "AI Service Temporarily Unavailable";
        detailedErrorMessage = "The AI model is currently busy or overloaded. Please try again in a few moments.";
        setIsServiceUnavailable(true);
      }
      
      setError(detailedErrorMessage);
      setErrorTitle(currentErrorTitle);
      toast({ title: currentErrorTitle, description: detailedErrorMessage, variant: "destructive", duration: 7000 });
      console.error("Error fetching recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAllToMergeList = () => {
    if (recommendations && recommendations.length > 0) {
      const urls = recommendations.map(rec => rec.url);
      onAddRecommendedReposToForm(urls);
      toast({ title: "Repositories Added", description: "Recommended repository URLs have been added to the merge list." });
    }
  };

  return (
    <Window title="AI Repository Recommendations" icon={<Lightbulb size={18} />} className="min-h-[300px] flex flex-col">
      <div className="space-y-4 flex-grow flex flex-col">
        <div className="space-y-3">
          <div>
            <Label htmlFor="promptDescription" className="text-primary">Describe your project/features (optional)</Label>
            <Input
              id="promptDescription"
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              placeholder="e.g., a chat app with real-time updates and a retro UI"
              className="bg-input border-primary/50 focus:border-primary"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => handleGetRecommendations('general')} 
              disabled={isLoading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              General Recommendations
            </Button>
            <Button 
              onClick={() => handleGetRecommendations('promptBased')} 
              disabled={isLoading || !promptDescription.trim()}
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/10"
            >
              {isLoading && promptDescription.trim() ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              Get by Prompt
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-4">
            <Loader2 size={36} className="animate-spin mb-4 text-primary" />
            <p className="text-sm font-semibold">AI is conjuring recommendations...</p>
            <p className="text-xs">This might take a moment.</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex-grow flex flex-col items-center justify-center text-destructive p-4 animate-fade-in">
            {isServiceUnavailable ? (
              <AlertTriangle size={36} className="mb-3 text-orange-400" />
            ) : (
              <ServerCrash size={36} className="mb-3" />
            )}
            <p className="font-semibold text-lg mb-1 text-center">
              {errorTitle}
            </p>
            <p className="text-xs text-center mb-3 max-w-md break-words">
              {error}
            </p>
             {(isServiceUnavailable || errorTitle.includes("Model Not Found")) && (
              <Button variant="outline" onClick={() => handleGetRecommendations(promptDescription.trim() ? 'promptBased' : 'general')} className="mt-4 border-primary text-primary hover:bg-primary/10">
                <RotateCw size={16} className="mr-2"/> Try Again
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && recommendations && (
          <>
            <Separator className="my-3 bg-border/50"/>
            <h3 className="text-md font-semibold text-primary mb-2 px-1">Recommended Repositories:</h3>
            <ScrollArea className="flex-grow pr-2 custom-scrollbar">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="bg-card/70 border-primary/30 animate-fade-in-up hover:border-primary/60 hover:shadow-md transition-all" style={{animationDelay: `${index * 100}ms`}}>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm text-primary hover:underline">
                        <a href={rec.url} target="_blank" rel="noopener noreferrer">{rec.name}</a>
                      </CardTitle>
                      <CardDescription className="text-xs text-foreground/80 break-all">{rec.url}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4">
              <Button 
                onClick={handleAddAllToMergeList} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
                disabled={recommendations.length === 0}
              >
                <ListPlus size={16} className="mr-2" /> Add All to Merge List
              </Button>
            </div>
          </>
        )}
         {!isLoading && !error && !recommendations && (
          <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-6 text-center animate-fade-in">
            <Lightbulb size={36} className="mb-4 opacity-60 text-primary/70 animate-pulse" />
            <p className="text-lg font-semibold text-primary mb-1">Discover Repositories</p>
            <p className="text-xs max-w-xs">
              Get AI-powered suggestions. Use general mode or provide a prompt above to find relevant GitHub projects.
            </p>
          </div>
        )}
      </div>
    </Window>
  );
}

