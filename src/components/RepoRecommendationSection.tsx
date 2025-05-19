
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
  const [currentModeAttempt, setCurrentModeAttempt] = useState<'general' | 'promptBased'>('general');

  const { toast } = useToast();

  const handleGetRecommendations = async (mode: 'general' | 'promptBased') => {
    setCurrentModeAttempt(mode); // Store the mode for retry
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
      setIsServiceUnavailable(false); // Reset service unavailable flag

      const modelName = flowInput.mainApiModel === 'gemini' ? flowInput.geminiMainModelName :
                       flowInput.mainApiModel === 'ollama' ? flowInput.ollamaMainModelName :
                       flowInput.mainApiModel === 'openrouter' ? flowInput.openrouterMainModelName :
                       flowInput.mainApiModel === 'huggingface' ? flowInput.huggingfaceMainModelName :
                       'the selected model';

      if (errorMessage.includes('NOT_FOUND') || errorMessage.toLowerCase().includes('model not found')) {
        currentErrorTitle = `${flowInput.mainApiModel ? flowInput.mainApiModel.charAt(0).toUpperCase() + flowInput.mainApiModel.slice(1) : 'Selected'} Model Not Found`;
        let specificAdvice = `The model '${modelName}' could not be found or accessed.`;
        if (flowInput.mainApiModel === 'openrouter') {
          specificAdvice += " Ensure your OpenRouter API Key (in Settings or .env) is valid and has access to this model. Also verify the OpenRouter Genkit plugin is correctly configured in 'src/ai/genkit.ts'.";
        } else if (flowInput.mainApiModel === 'huggingface') {
          specificAdvice += " Ensure your HuggingFace API Token (in Settings or .env) is valid. Also verify the HuggingFace Genkit plugin is correctly configured in 'src/ai/genkit.ts'.";
        } else if (flowInput.mainApiModel === 'ollama') {
          specificAdvice += " Ensure your Ollama server is running, the specified model is pulled (e.g., 'ollama pull modelname'), and the Ollama Genkit plugin is configured in 'src/ai/genkit.ts'.";
        } else if (flowInput.mainApiModel === 'gemini') {
            specificAdvice += " Ensure your Gemini API key (in Settings) is valid and has access to this model. The model name should be like 'gemini-1.5-flash-latest'.";
        }
        detailedErrorMessage = `${specificAdvice} Original error: ${errorMessage}`;
      } else if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('service unavailable') || errorMessage.toLowerCase().includes('overloaded')) {
        currentErrorTitle = "AI Service Temporarily Unavailable";
        detailedErrorMessage = `The AI model provider for '${modelName}' is currently busy or overloaded. Please try again in a few moments.`;
        setIsServiceUnavailable(true);
      } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('authentication')) {
        currentErrorTitle = "Authentication Error";
        detailedErrorMessage = `There seems to be an issue with your API key for ${flowInput.mainApiModel || 'the selected service'}. Please check it in Settings or your .env file. Original: ${errorMessage}`;
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
      // Toast is now handled by RepoInputForm's addRepositoryUrls
    }
  };

  const canRetry = isServiceUnavailable || (error && error.toLowerCase().includes("model not found"));

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
              {isLoading && currentModeAttempt === 'general' ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
              General Recommendations
            </Button>
            <Button 
              onClick={() => handleGetRecommendations('promptBased')} 
              disabled={isLoading || !promptDescription.trim()}
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/10"
            >
              {isLoading && currentModeAttempt === 'promptBased' ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
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
            <p className="text-xs text-center mb-3 max-w-md break-words whitespace-pre-line">
              {error}
            </p>
             {canRetry && (
              <Button variant="outline" onClick={() => handleGetRecommendations(currentModeAttempt)} className="mt-4 border-primary text-primary hover:bg-primary/10">
                <RotateCw size={16} className="mr-2"/> Try Again
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && recommendations && (
          <>
            <Separator className="my-3 bg-border/50"/>
            <h3 className="text-md font-semibold text-primary mb-2 px-1">Recommended Repositories:</h3>
            <ScrollArea className="flex-grow pr-2 custom-scrollbar max-h-[calc(100vh-450px)] sm:max-h-[300px]"> {/* Max height for scroll area */}
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
