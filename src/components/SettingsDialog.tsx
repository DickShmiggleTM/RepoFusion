
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ApiModelType } from '@/types/settings';
import { defaultAppSettings } from '@/types/settings';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Cog, AlertTriangle, KeyRound, Loader2, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const apiModelOptions: { value: ApiModelType; label: string }[] = [
  { value: 'gemini', label: 'Gemini (Google AI)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'huggingface', label: 'HuggingFace (ID Input)' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'llamafile', label: 'Llamafile (Experimental)' },
];

interface OllamaTag { name: string; modified_at: string; size: number; }
interface OllamaTagsResponse { models: OllamaTag[]; }

interface GeminiModel { name: string; displayName: string; supportedGenerationMethods: string[]; }
interface GeminiModelsResponse { models: GeminiModel[]; }

interface OpenRouterModel { id: string; name: string; }
interface OpenRouterModelsResponse { data: OpenRouterModel[]; }

type ModelCategory = 'main' | 'reasoning' | 'coding';

export function SettingsDialog({ isOpen, onOpenChange, currentSettings, onSave }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const { toast } = useToast();

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [geminiModels, setGeminiModels] = useState<{ value: string; label: string }[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<{ value: string; label: string }[]>([]);

  const [loadingStates, setLoadingStates] = useState<Record<ApiModelType | 'common', Record<ModelCategory, boolean>>>({
    ollama: { main: false, reasoning: false, coding: false },
    gemini: { main: false, reasoning: false, coding: false },
    openrouter: { main: false, reasoning: false, coding: false },
    huggingface: { main: false, reasoning: false, coding: false },
    llamafile: { main: false, reasoning: false, coding: false },
    common: { main: false, reasoning: false, coding: false },
  });
  const [errorStates, setErrorStates] = useState<Record<ApiModelType | 'common', Record<ModelCategory, string | null>>>({
    ollama: { main: null, reasoning: null, coding: null },
    gemini: { main: null, reasoning: null, coding: null },
    openrouter: { main: null, reasoning: null, coding: null },
    huggingface: { main: null, reasoning: null, coding: null },
    llamafile: { main: null, reasoning: null, coding: null },
    common: { main: null, reasoning: null, coding: null },
  });

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const setModelLoading = (provider: ApiModelType, category: ModelCategory, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [provider]: { ...prev[provider], [category]: isLoading } }));
  };

  const setModelError = (provider: ApiModelType, category: ModelCategory, error: string | null) => {
    setErrorStates(prev => ({ ...prev, [provider]: { ...prev[provider], [category]: error } }));
  };

  const getCategorySpecificModelField = (category: ModelCategory, provider: ApiModelType): keyof AppSettings | undefined => {
    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    switch (provider) {
        case 'ollama': return `ollama${capitalizedCategory}ModelName` as keyof AppSettings;
        case 'gemini': return `gemini${capitalizedCategory}ModelName` as keyof AppSettings;
        case 'openrouter': return `openrouter${capitalizedCategory}ModelName` as keyof AppSettings;
        case 'huggingface': return `huggingface${capitalizedCategory}ModelName` as keyof AppSettings;
        default: return undefined;
    }
  };


  const fetchOllamaModels = useCallback(async (category: ModelCategory) => {
    setModelLoading('ollama', category, true);
    setModelError('ollama', category, null);
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error(`Failed to fetch Ollama models (status: ${response.status}). Ensure Ollama is running & CORS configured if necessary.`);
      const data: OllamaTagsResponse = await response.json();
      const modelNames = data.models.map(model => model.name).sort();
      setOllamaModels(modelNames);
      if (modelNames.length === 0) {
        setModelError('ollama', category, "No models found. Pull models using 'ollama pull <model_name>'.");
      } else {
        const modelField = getCategorySpecificModelField(category, 'ollama');
        if (modelField && (!settings[modelField] || !modelNames.includes(settings[modelField] as string))) {
          const defaultOllamaModel = modelNames.includes('llama3') ? 'llama3' :
                                   modelNames.includes(defaultAppSettings.ollamaMainModelName!) ? defaultAppSettings.ollamaMainModelName! : modelNames[0];
          setSettings(prev => ({ ...prev, [modelField]: defaultOllamaModel }));
        }
      }
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('ollama', category, `Ollama Error: ${msg}`);
      setOllamaModels([]);
    } finally {
      setModelLoading('ollama', category, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.ollamaMainModelName, settings.ollamaReasoningModelName, settings.ollamaCodingModelName]);

  const fetchGeminiModels = useCallback(async (apiKey: string, category: ModelCategory) => {
    if (!apiKey) {
      setModelError('gemini', category, "Gemini API Key is required to fetch models.");
      setGeminiModels([]);
      return;
    }
    setModelLoading('gemini', category, true);
    setModelError('gemini', category, null);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) throw new Error(`Failed to fetch Gemini models (status: ${response.status}). Check API Key and permissions.`);
      const data: GeminiModelsResponse = await response.json();
      const usableModels = data.models
        .filter(model => model.supportedGenerationMethods.includes("generateContent") && model.name.startsWith("models/gemini"))
        .map(model => ({
          value: model.name.replace("models/", ""),
          label: `${model.displayName} (${model.name.replace("models/", "")})`
        }))
        .sort((a,b) => a.label.localeCompare(b.label));
      setGeminiModels(usableModels);
      if (usableModels.length === 0) {
        setModelError('gemini', category, "No usable Gemini models found or API key is invalid.");
      } else {
        const modelField = getCategorySpecificModelField(category, 'gemini');
        if (modelField && (!settings[modelField] || !usableModels.find(m => m.value === settings[modelField]))) {
            const defaultGeminiModel = usableModels.find(m => m.value === 'gemini-1.5-flash-latest') ? 'gemini-1.5-flash-latest' :
                                       usableModels.find(m => m.value === defaultAppSettings.geminiMainModelName) ? defaultAppSettings.geminiMainModelName! : usableModels[0].value;
            setSettings(prev => ({ ...prev, [modelField]: defaultGeminiModel }));
        }
      }
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('gemini', category, `Gemini Error: ${msg}`);
      setGeminiModels([]);
    } finally {
      setModelLoading('gemini', category, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.geminiMainModelName, settings.geminiReasoningModelName, settings.geminiCodingModelName]);

  const fetchOpenRouterModels = useCallback(async (category: ModelCategory) => {
    setModelLoading('openrouter', category, true);
    setModelError('openrouter', category, null);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error(`Failed to fetch OpenRouter models (status: ${response.status}).`);
      const data: OpenRouterModelsResponse = await response.json();
      const modelOptions = data.data.map(model => ({ value: model.id, label: model.name || model.id })).sort((a,b) => a.label.localeCompare(b.label));
      setOpenRouterModels(modelOptions);
      if (modelOptions.length === 0) {
        setModelError('openrouter', category, "No models found from OpenRouter.");
      } else {
        const modelField = getCategorySpecificModelField(category, 'openrouter');
         if (modelField && (!settings[modelField] || !modelOptions.find(m=> m.value === settings[modelField]))) {
            const preferredModel = modelOptions.find(m => m.value.includes("llama-3") && m.value.includes("instruct"))?.value ||
                                 modelOptions.find(m=> m.value === defaultAppSettings.openrouterMainModelName)?.value ||
                                 modelOptions[0].value;
            setSettings(prev => ({ ...prev, [modelField]: preferredModel }));
        }
      }
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('openrouter', category, `OpenRouter Error: ${msg}`);
      setOpenRouterModels([]);
    } finally {
      setModelLoading('openrouter', category, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.openrouterMainModelName, settings.openrouterReasoningModelName, settings.openrouterCodingModelName]);


  const handleModelTypeChange = (
    field: keyof Pick<AppSettings, 'mainApiModel' | 'reasoningApiModel' | 'codingApiModel'>,
    value: ApiModelType,
    category: ModelCategory
  ) => {

    const modelNameResetFields: Partial<AppSettings> = {};
    const currentCategoryPrefix = category.charAt(0).toUpperCase() + category.slice(1);

    modelNameResetFields[`ollama${currentCategoryPrefix}ModelName`] = defaultAppSettings[`ollama${currentCategoryPrefix}ModelName` as keyof AppSettings];
    modelNameResetFields[`gemini${currentCategoryPrefix}ModelName`] = defaultAppSettings[`gemini${currentCategoryPrefix}ModelName` as keyof AppSettings];
    modelNameResetFields[`openrouter${currentCategoryPrefix}ModelName`] = defaultAppSettings[`openrouter${currentCategoryPrefix}ModelName` as keyof AppSettings];
    modelNameResetFields[`huggingface${currentCategoryPrefix}ModelName`] = defaultAppSettings[`huggingface${currentCategoryPrefix}ModelName` as keyof AppSettings];

    setSettings(prev => ({ ...prev, [field]: value, ...modelNameResetFields }));

    if (value === 'ollama') fetchOllamaModels(category);
    else if (value === 'gemini' && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, category);
    else if (value === 'openrouter') fetchOpenRouterModels(category);
  };

  const handleSelectedModelChange = (
    field: keyof AppSettings,
    value: string
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
    toast({title: "Settings Saved", description: "AI model configurations have been updated."})
  };

  const isLlamafileSelectedForCategory = (category: ModelCategory) => {
    if (category === 'main') return settings.mainApiModel === 'llamafile';
    if (category === 'reasoning') return settings.useCustomReasoningModel && settings.reasoningApiModel === 'llamafile';
    if (category === 'coding') return settings.useCustomCodingModel && settings.codingApiModel === 'llamafile';
    return false;
  };

  const isAnyLlamafileSelected = isLlamafileSelectedForCategory('main') || isLlamafileSelectedForCategory('reasoning') || isLlamafileSelectedForCategory('coding');


  const renderModelSelector = (category: ModelCategory, apiModelType: ApiModelType | undefined) => {
    const isLoading = loadingStates[apiModelType || 'common']?.[category] || false;
    const error = errorStates[apiModelType || 'common']?.[category] || null;

    let valueField: keyof AppSettings | undefined;
    let modelsList: { value: string; label: string }[] = [];
    let placeholder: string = "Select model";
    let requiresInput = false;
    let inputField: keyof AppSettings | undefined;
    let fetchFunction: (() => void) | undefined;
    let noModelsMessage = "No models loaded.";

    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    switch (apiModelType) {
      case 'ollama':
        valueField = `ollama${capitalizedCategory}ModelName` as keyof AppSettings;
        modelsList = ollamaModels.map(m => ({ value: m, label: m }));
        placeholder = `Select Ollama ${category} model`;
        fetchFunction = () => fetchOllamaModels(category);
        noModelsMessage = "No Ollama models. Pull or refresh.";
        break;
      case 'gemini':
        valueField = `gemini${capitalizedCategory}ModelName` as keyof AppSettings;
        modelsList = geminiModels;
        placeholder = `Select Gemini ${category} model`;
        if (!settings.geminiApiKey) return <p className="col-span-2 text-xs text-muted-foreground p-1">Enter Gemini API key to load models.</p>;
        fetchFunction = () => fetchGeminiModels(settings.geminiApiKey!, category);
        noModelsMessage = "No Gemini models. Check API key or refresh.";
        break;
      case 'openrouter':
        valueField = `openrouter${capitalizedCategory}ModelName` as keyof AppSettings;
        modelsList = openRouterModels;
        placeholder = `Select OpenRouter ${category} model`;
        fetchFunction = () => fetchOpenRouterModels(category);
        noModelsMessage = "No OpenRouter models. Refresh list.";
        break;
      case 'huggingface':
        requiresInput = true;
        inputField = `huggingface${capitalizedCategory}ModelName` as keyof AppSettings;
        placeholder = `Enter HuggingFace model ID`;
        break;
      case 'llamafile':
        return (
            <div className="col-span-full text-xs text-muted-foreground p-1">
              Llamafile path/URL specified below.
            </div>
        );
      default:
        return <div className="col-span-full"></div>;
    }

    const selectorContent = () => {
      if (isLoading) {
        return (
          <div className="col-span-full flex items-center text-sm text-muted-foreground p-1">
            <Loader2 size={16} className="mr-2 animate-spin" /> Loading {apiModelType} models...
          </div>
        );
      }
      if (error) {
        return (
          <div className="col-span-full text-xs text-destructive p-2 rounded-md border border-dashed border-destructive/50 bg-destructive/10 flex items-center justify-between">
            <span>{error}</span>
          </div>
        );
      }
      if (requiresInput && inputField) {
        return (
           <Input
              id={`${inputField}-${category}`}
              value={settings[inputField] || ''}
              onChange={(e) => handleSelectedModelChange(inputField!, e.target.value)}
              placeholder={placeholder}
              className="col-span-full bg-input border-primary/50 focus:border-primary"
            />
        );
      }
      if (!requiresInput && valueField && ['ollama', 'gemini', 'openrouter'].includes(apiModelType!)) {
          return (
            <Select value={(settings[valueField!] as string) || ""} onValueChange={(val) => handleSelectedModelChange(valueField!, val)} disabled={isLoading || (modelsList.length === 0 && !fetchFunction && !error)}>
              <SelectTrigger id={`${valueField!}-${category}`} className="col-span-full bg-input border-primary/50 focus:border-primary">
                <SelectValue placeholder={modelsList.length > 0 ? placeholder : (isLoading ? "Loading..." : (error ? "Error" : noModelsMessage))} />
              </SelectTrigger>
              <SelectContent>
                {modelsList.length === 0 && !isLoading && (
                  <SelectItem value="no-models-placeholder" disabled className="text-muted-foreground">
                    {error ? "Error loading models" : noModelsMessage}
                  </SelectItem>
                )}
                {modelsList.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
      }
      return <div className="col-span-full"></div>;
    };

    return (
      <div className="contents">
        <div className="col-span-2">
          {selectorContent()}
        </div>
        {fetchFunction && !requiresInput && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={fetchFunction} className="h-9 w-9 text-primary hover:bg-primary/10" disabled={isLoading || (apiModelType === 'gemini' && !settings.geminiApiKey)}>
                <RotateCw size={16} />
                <span className="sr-only">Refresh {apiModelType} models</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh {apiModelType} model list</p>
            </TooltipContent>
          </Tooltip>
        )}
        {(!fetchFunction || requiresInput) && <div className="col-span-1"></div>}
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
        const fetchInitialModels = (cat: ModelCategory, apiType?: ApiModelType) => {
            if (apiType === 'ollama' && ollamaModels.length === 0 && !loadingStates.ollama[cat] && !errorStates.ollama[cat]) fetchOllamaModels(cat);
            if (apiType === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey && !loadingStates.gemini[cat] && !errorStates.gemini[cat]) fetchGeminiModels(settings.geminiApiKey, cat);
            if (apiType === 'openrouter' && openRouterModels.length === 0 && !loadingStates.openrouter[cat] && !errorStates.openrouter[cat]) fetchOpenRouterModels(cat);
        };

        fetchInitialModels('main', settings.mainApiModel);
        if (settings.useCustomReasoningModel) {
            fetchInitialModels('reasoning', settings.reasoningApiModel);
        }
        if (settings.useCustomCodingModel) {
            fetchInitialModels('coding', settings.codingApiModel);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings.mainApiModel, settings.reasoningApiModel, settings.codingApiModel, settings.geminiApiKey, settings.useCustomReasoningModel, settings.useCustomCodingModel]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Cog size={20} className="mr-2" />
            AI Model & API Key Settings
          </DialogTitle>
          <DialogDescription>
            Configure AI models and API keys. API keys are passed to the AI flow for context and, in Gemini's case, can be used for dynamic model access.
            For OpenRouter, HuggingFace, and Ollama, ensure backend Genkit plugins are configured (see `src/ai/genkit.ts`).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-3">

          <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <h4 className="text-md font-semibold text-primary flex items-center"><KeyRound size={18} className="mr-2"/>API Keys (Prototype Configuration)</h4>

            <div className="col-span-4 mt-1 p-3 text-sm text-destructive font-medium bg-destructive/10 border border-destructive/50 rounded-md flex items-start">
              <AlertTriangle size={20} className="mr-2 mt-0.5 shrink-0" />
              <div><strong>Important Security Warning:</strong> API keys entered here are stored in browser state for this prototype and sent to backend flows. This is NOT secure for production environments. For actual deployments, API keys must be managed securely on the server-side (e.g., via environment variables loaded by Genkit plugins in `src/ai/genkit.ts`).
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="geminiApiKey" className="text-right col-span-1 text-primary/90 self-center">Gemini Key</Label>
              <Input id="geminiApiKey" type="password" value={settings.geminiApiKey || ''}
                onChange={(e) => {
                  const newApiKey = e.target.value;
                  setSettings(prev => ({ ...prev, geminiApiKey: newApiKey }));
                  if (newApiKey) {
                    if (settings.mainApiModel === 'gemini' && !loadingStates.gemini.main) fetchGeminiModels(newApiKey, 'main');
                    if (settings.useCustomReasoningModel && settings.reasoningApiModel === 'gemini' && !loadingStates.gemini.reasoning) fetchGeminiModels(newApiKey, 'reasoning');
                    if (settings.useCustomCodingModel && settings.codingApiModel === 'gemini' && !loadingStates.gemini.coding) fetchGeminiModels(newApiKey, 'coding');
                  } else {
                    setGeminiModels([]);
                    const clearGeminiFields: Partial<AppSettings> = {};
                    if (settings.mainApiModel === 'gemini') clearGeminiFields.geminiMainModelName = defaultAppSettings.geminiMainModelName;
                    if (settings.reasoningApiModel === 'gemini') clearGeminiFields.geminiReasoningModelName = defaultAppSettings.geminiReasoningModelName;
                    if (settings.codingApiModel === 'gemini') clearGeminiFields.geminiCodingModelName = defaultAppSettings.geminiCodingModelName;
                    setSettings(prev => ({...prev, ...clearGeminiFields}));
                  }
                }}
                placeholder="Enter Gemini API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="openrouterApiKey" className="text-right col-span-1 text-primary/90 self-center">OpenRouter Key</Label>
              <Input id="openrouterApiKey" type="password" value={settings.openrouterApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, openrouterApiKey: e.target.value }))}
                placeholder="Enter OpenRouter API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="huggingfaceApiKey" className="text-right col-span-1 text-primary/90 self-center">HuggingFace Key</Label>
              <Input id="huggingfaceApiKey" type="password" value={settings.huggingfaceApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, huggingfaceApiKey: e.target.value }))}
                placeholder="Enter HuggingFace Token"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>
             <p className="text-xs text-muted-foreground col-span-4">
                For OpenRouter, HuggingFace, and Ollama, actual API usage requires backend Genkit plugins to be configured with API keys (if applicable) from environment variables (e.g., in <code>.env</code>). See <code>src/ai/genkit.ts</code>.
              </p>
          </div>


          <div className="space-y-3 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <h4 className="text-md font-semibold text-primary">Main Generation Model</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mainApiModel" className="text-right col-span-1 text-primary/90 self-center">Type</Label>
              <Select value={settings.mainApiModel} onValueChange={(value) => handleModelTypeChange('mainApiModel', value as ApiModelType, 'main')}>
                <SelectTrigger id="mainApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Select main model type" />
                </SelectTrigger>
                <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-x-2 gap-y-4">
               <Label className="text-right col-span-1 text-primary/90 self-center">Model</Label>
               {renderModelSelector('main', settings.mainApiModel)}
            </div>
          </div>

          {/* Custom Reasoning Model Section */}
          <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-primary">Custom Reasoning Model</h4>
                <Switch id="useCustomReasoningModel" checked={settings.useCustomReasoningModel}
                        onCheckedChange={(checked) => {
                            setSettings(prev => ({ ...prev, useCustomReasoningModel: checked, reasoningApiModel: checked ? prev.reasoningApiModel : defaultAppSettings.reasoningApiModel }));
                            if (checked) {
                                if (settings.reasoningApiModel === 'ollama' && !loadingStates.ollama.reasoning) fetchOllamaModels('reasoning');
                                if (settings.reasoningApiModel === 'gemini' && settings.geminiApiKey && !loadingStates.gemini.reasoning) fetchGeminiModels(settings.geminiApiKey, 'reasoning');
                                if (settings.reasoningApiModel === 'openrouter' && !loadingStates.openrouter.reasoning) fetchOpenRouterModels('reasoning');
                            }
                        }}
                        className="data-[state=checked]:bg-primary" />
            </div>
            <div className={cn("space-y-3 overflow-hidden transition-all duration-300 ease-in-out",
                settings.useCustomReasoningModel ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reasoningApiModel" className="text-right col-span-1 text-primary/90 self-center">Type</Label>
                  <Select value={settings.reasoningApiModel} onValueChange={(value) => handleModelTypeChange('reasoningApiModel', value as ApiModelType, 'reasoning')}>
                    <SelectTrigger id="reasoningApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Select reasoning model type" />
                    </SelectTrigger>
                    <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-x-2 gap-y-4">
                    <Label className="text-right col-span-1 text-primary/90 self-center">Model</Label>
                    {renderModelSelector('reasoning', settings.reasoningApiModel)}
                </div>
            </div>
          </div>

          {/* Custom Coding Model Section */}
           <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-primary">Custom Coding Model</h4>
                <Switch id="useCustomCodingModel" checked={settings.useCustomCodingModel}
                        onCheckedChange={(checked) => {
                            setSettings(prev => ({ ...prev, useCustomCodingModel: checked, codingApiModel: checked ? prev.codingApiModel : defaultAppSettings.codingApiModel }));
                             if (checked) {
                                if (settings.codingApiModel === 'ollama' && !loadingStates.ollama.coding) fetchOllamaModels('coding');
                                if (settings.codingApiModel === 'gemini' && settings.geminiApiKey && !loadingStates.gemini.coding) fetchGeminiModels(settings.geminiApiKey, 'coding');
                                if (settings.codingApiModel === 'openrouter' && !loadingStates.openrouter.coding) fetchOpenRouterModels('coding');
                            }
                        }}
                        className="data-[state=checked]:bg-primary" />
            </div>
             <div className={cn("space-y-3 overflow-hidden transition-all duration-300 ease-in-out",
                settings.useCustomCodingModel ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
             )}>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codingApiModel" className="text-right col-span-1 text-primary/90 self-center">Type</Label>
                  <Select value={settings.codingApiModel} onValueChange={(value) => handleModelTypeChange('codingApiModel', value as ApiModelType, 'coding')}>
                    <SelectTrigger id="codingApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Select coding model type" />
                    </SelectTrigger>
                    <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-x-2 gap-y-4">
                    <Label className="text-right col-span-1 text-primary/90 self-center">Model</Label>
                    {renderModelSelector('coding', settings.codingApiModel)}
                </div>
            </div>
          </div>

          {isAnyLlamafileSelected && (
            <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <Label htmlFor="llamafilePath" className="text-primary/90 flex items-center font-semibold mb-2">
                <AlertTriangle size={16} className="mr-2 text-primary" /> Llamafile Path/URL (Experimental)
              </Label>
              <Input id="llamafilePath" value={settings.llamafilePath || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, llamafilePath: e.target.value }))}
                placeholder="e.g., /path/to/model.llamafile or http://localhost:8080"
                className="bg-input border-primary/50 focus:border-primary" />
              <p className="text-xs text-muted-foreground mt-1">
                For Llamafile to be used, a Llamafile Genkit plugin must be installed and configured in <code>src/ai/genkit.ts</code>.
                The server running Genkit must be able to access this path or URL.
              </p>
            </div>
          )}

          {(settings.mainApiModel === 'ollama' || (settings.useCustomReasoningModel && settings.reasoningApiModel === 'ollama') || (settings.useCustomCodingModel && settings.codingApiModel === 'ollama')) && (
             <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center font-semibold mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> Ollama Note</p>
              <p className="text-xs text-muted-foreground">
                Ensure Ollama server (usually at <code>http://localhost:11434</code>) is running, models are pulled (e.g., <code>ollama pull llama3</code>), and the Ollama Genkit plugin is correctly configured in <code>src/ai/genkit.ts</code>.
              </p>
             </div>
          )}
           {(settings.mainApiModel === 'huggingface' || (settings.useCustomReasoningModel && settings.reasoningApiModel === 'huggingface') || (settings.useCustomCodingModel && settings.codingApiModel === 'huggingface')) && (
             <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center font-semibold mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> HuggingFace Note</p>
              <p className="text-xs text-muted-foreground">
                Enter the specific HuggingFace model ID (e.g., <code>mistralai/Mistral-7B-Instruct-v0.1</code>). For API access, ensure your backend Genkit plugin for HuggingFace is configured in <code>src/ai/genkit.ts</code> with your <code>HF_API_TOKEN</code> (usually from your <code>.env</code> file).
              </p>
             </div>
            )}
             {(settings.mainApiModel === 'openrouter' || (settings.useCustomReasoningModel && settings.reasoningApiModel === 'openrouter') || (settings.useCustomCodingModel && settings.codingApiModel === 'openrouter')) && (
             <div className="p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center font-semibold mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> OpenRouter Note</p>
              <p className="text-xs text-muted-foreground">
                 For API access, ensure your backend Genkit plugin for OpenRouter is configured in <code>src/ai/genkit.ts</code> with your <code>OPENROUTER_API_KEY</code> (usually from your <code>.env</code> file).
              </p>
             </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-primary text-primary hover:bg-primary/10">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/80">Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
