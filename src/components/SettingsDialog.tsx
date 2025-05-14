
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
    huggingface: { main: false, reasoning: false, coding: false }, // Not used for loading but for structure
    llamafile: { main: false, reasoning: false, coding: false }, // Not used for loading
    common: { main: false, reasoning: false, coding: false }, // Fallback
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

  const fetchOllamaModels = useCallback(async (category: ModelCategory) => {
    setModelLoading('ollama', category, true);
    setModelError('ollama', category, null);
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error(`Failed to fetch Ollama models (status: ${response.status}). Ensure Ollama is running.`);
      const data: OllamaTagsResponse = await response.json();
      const modelNames = data.models.map(model => model.name).sort();
      setOllamaModels(modelNames);
      if (modelNames.length === 0) setModelError('ollama', category, "No models found in Ollama. Pull models using 'ollama pull <model_name>'.");
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('ollama', category, `Ollama Error: ${msg}`);
      setOllamaModels([]);
    } finally {
      setModelLoading('ollama', category, false);
    }
  }, []);

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
          value: model.name.replace("models/", ""), // Genkit expects "gemini-1.5-pro-latest"
          label: `${model.displayName} (${model.name.replace("models/", "")})`
        }))
        .sort((a,b) => a.label.localeCompare(b.label));
      setGeminiModels(usableModels);
      if (usableModels.length === 0) setModelError('gemini', category, "No usable Gemini models found or API key is invalid.");
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('gemini', category, `Gemini Error: ${msg}`);
      setGeminiModels([]);
    } finally {
      setModelLoading('gemini', category, false);
    }
  }, []);

  const fetchOpenRouterModels = useCallback(async (category: ModelCategory) => {
    setModelLoading('openrouter', category, true);
    setModelError('openrouter', category, null);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error(`Failed to fetch OpenRouter models (status: ${response.status}).`);
      const data: OpenRouterModelsResponse = await response.json();
      const modelOptions = data.data.map(model => ({ value: model.id, label: model.name || model.id })).sort((a,b) => a.label.localeCompare(b.label));
      setOpenRouterModels(modelOptions);
      if (modelOptions.length === 0) setModelError('openrouter', category, "No models found from OpenRouter.");
    } catch (err) {
      const msg = (err as Error).message;
      setModelError('openrouter', category, `OpenRouter Error: ${msg}`);
      setOpenRouterModels([]);
    } finally {
      setModelLoading('openrouter', category, false);
    }
  }, []);


  const handleModelTypeChange = (
    field: keyof Pick<AppSettings, 'mainApiModel' | 'reasoningApiModel' | 'codingApiModel'>,
    value: ApiModelType,
    category: ModelCategory
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    // Reset specific model name when type changes
    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    if (field === `mainApiModel`) setSettings(prev => ({ ...prev, [`ollamaMainModelName`]: defaultAppSettings.ollamaMainModelName, [`geminiMainModelName`]: defaultAppSettings.geminiMainModelName, [`openrouterMainModelName`]: defaultAppSettings.openrouterMainModelName, [`huggingfaceMainModelName`]: defaultAppSettings.huggingfaceMainModelName }));
    if (field === `reasoningApiModel`) setSettings(prev => ({ ...prev, [`ollamaReasoningModelName`]: defaultAppSettings.ollamaReasoningModelName, [`geminiReasoningModelName`]: defaultAppSettings.geminiReasoningModelName, [`openrouterReasoningModelName`]: defaultAppSettings.openrouterReasoningModelName, [`huggingfaceReasoningModelName`]: defaultAppSettings.huggingfaceReasoningModelName }));
    if (field === `codingApiModel`) setSettings(prev => ({ ...prev, [`ollamaCodingModelName`]: defaultAppSettings.ollamaCodingModelName, [`geminiCodingModelName`]: defaultAppSettings.geminiCodingModelName, [`openrouterCodingModelName`]: defaultAppSettings.openrouterCodingModelName, [`huggingfaceCodingModelName`]: defaultAppSettings.huggingfaceCodingModelName }));


    if (value === 'ollama' && ollamaModels.length === 0) fetchOllamaModels(category);
    if (value === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, category);
    if (value === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels(category);
  };

  const handleSelectedModelChange = (
    field: keyof AppSettings, // e.g. 'ollamaMainModelName', 'geminiReasoningModelName'
    value: string
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
    toast({title: "Settings Saved", description: "AI model configurations have been updated."})
  };
  
  const isLlamafileSelected = settings.mainApiModel === 'llamafile' ||
                             (settings.useCustomReasoningModel && settings.reasoningApiModel === 'llamafile') ||
                             (settings.useCustomCodingModel && settings.codingApiModel === 'llamafile');

  const renderModelSelector = (category: ModelCategory, apiModelType: ApiModelType | undefined) => {
    const isLoading = loadingStates[apiModelType || 'common']?.[category] || false;
    const error = errorStates[apiModelType || 'common']?.[category] || null;
    
    let valueField: keyof AppSettings;
    let onChangeField: keyof AppSettings;
    let modelsList: { value: string; label: string }[] = [];
    let placeholder: string = "Select model";
    let requiresInput = false;
    let inputField: keyof AppSettings | undefined;
    let fetchFunction: (() => void) | undefined;

    switch (apiModelType) {
      case 'ollama':
        valueField = `ollama${category.charAt(0).toUpperCase() + category.slice(1)}ModelName` as keyof AppSettings;
        modelsList = ollamaModels.map(m => ({ value: m, label: m }));
        placeholder = `Select Ollama ${category} model`;
        fetchFunction = () => fetchOllamaModels(category);
        break;
      case 'gemini':
        valueField = `gemini${category.charAt(0).toUpperCase() + category.slice(1)}ModelName` as keyof AppSettings;
        modelsList = geminiModels;
        placeholder = `Select Gemini ${category} model`;
        if (!settings.geminiApiKey) return <p className="col-span-3 text-xs text-muted-foreground">Enter Gemini API key to load models.</p>;
        fetchFunction = () => fetchGeminiModels(settings.geminiApiKey!, category);
        break;
      case 'openrouter':
        valueField = `openrouter${category.charAt(0).toUpperCase() + category.slice(1)}ModelName` as keyof AppSettings;
        modelsList = openRouterModels;
        placeholder = `Select OpenRouter ${category} model`;
        fetchFunction = () => fetchOpenRouterModels(category);
        break;
      case 'huggingface':
        requiresInput = true;
        inputField = `huggingface${category.charAt(0).toUpperCase() + category.slice(1)}ModelName` as keyof AppSettings;
        placeholder = `Enter HuggingFace model ID`;
        break;
      default:
        return null; // Or some default message if apiModelType is undefined
    }

    if (isLoading) {
      return (
        <div className="col-span-3 flex items-center text-sm text-muted-foreground">
          <Loader2 size={16} className="mr-2 animate-spin" /> Loading {apiModelType} models...
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-3 text-xs text-destructive p-2 rounded-md border border-dashed border-destructive/50 bg-destructive/10 flex items-center justify-between">
           <span>{error}</span>
           {fetchFunction && (
            <Button variant="ghost" size="icon" onClick={fetchFunction} className="h-6 w-6 text-destructive">
              <RotateCw size={14} />
            </Button>
           )}
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
            className="col-span-3 bg-input border-primary/50 focus:border-primary"
          />
      );
    }

    if (modelsList.length === 0 && apiModelType !== 'huggingface') {
       return (
            <div className="col-span-3 text-xs text-muted-foreground p-2 rounded-md border border-dashed border-primary/50 bg-muted/20 flex items-center justify-between">
                <span>No models loaded for {apiModelType}. Ensure API key (if req.) is correct.</span>
                {fetchFunction && (
                  <Button variant="link" size="sm" className="p-0 h-auto ml-1 text-primary" onClick={fetchFunction}>Retry Load</Button>
                )}
            </div>
        );
    }

    return (
      <Select value={settings[valueField] || ""} onValueChange={(val) => handleSelectedModelChange(valueField, val)}>
        <SelectTrigger id={`${valueField}-${category}`} className="col-span-3 bg-input border-primary/50 focus:border-primary">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {modelsList.map(model => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
  
  // Trigger initial fetches if relevant API model is selected and keys are present
  useEffect(() => {
    if (isOpen) {
        if (settings.mainApiModel === 'ollama' && ollamaModels.length === 0) fetchOllamaModels('main');
        if (settings.mainApiModel === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, 'main');
        if (settings.mainApiModel === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels('main');

        if (settings.useCustomReasoningModel) {
            if (settings.reasoningApiModel === 'ollama' && ollamaModels.length === 0) fetchOllamaModels('reasoning');
            if (settings.reasoningApiModel === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, 'reasoning');
            if (settings.reasoningApiModel === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels('reasoning');
        }
        if (settings.useCustomCodingModel) {
            if (settings.codingApiModel === 'ollama' && ollamaModels.length === 0) fetchOllamaModels('coding');
            if (settings.codingApiModel === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, 'coding');
            if (settings.codingApiModel === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels('coding');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings.mainApiModel, settings.reasoningApiModel, settings.codingApiModel, settings.geminiApiKey, settings.useCustomCodingModel, settings.useCustomReasoningModel]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Cog size={20} className="mr-2" />
            AI Model & API Key Settings
          </DialogTitle>
          <DialogDescription>
            Configure AI models and provide API keys for external services. Model lists for Gemini and OpenRouter will load if API key is valid.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-3">
          {/* API Key Section */}
          <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <h4 className="text-md font-semibold text-primary flex items-center"><KeyRound size={18} className="mr-2"/>API Keys</h4>
            {/* Gemini API Key */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="geminiApiKey" className="text-right col-span-1 text-primary/90">Gemini Key</Label>
              <Input id="geminiApiKey" type="password" value={settings.geminiApiKey || ''}
                onChange={(e) => {
                  const newApiKey = e.target.value;
                  setSettings(prev => ({ ...prev, geminiApiKey: newApiKey }));
                  if (newApiKey && (settings.mainApiModel === 'gemini' || settings.reasoningApiModel === 'gemini' || settings.codingApiModel === 'gemini')) {
                    if (settings.mainApiModel === 'gemini') fetchGeminiModels(newApiKey, 'main');
                    if (settings.useCustomReasoningModel && settings.reasoningApiModel === 'gemini') fetchGeminiModels(newApiKey, 'reasoning');
                    if (settings.useCustomCodingModel && settings.codingApiModel === 'gemini') fetchGeminiModels(newApiKey, 'coding');
                  } else if (!newApiKey) {
                    setGeminiModels([]); // Clear models if API key is removed
                  }
                }}
                placeholder="Enter Gemini API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>
            {/* OpenRouter API Key */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="openrouterApiKey" className="text-right col-span-1 text-primary/90">OpenRouter Key</Label>
              <Input id="openrouterApiKey" type="password" value={settings.openrouterApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, openrouterApiKey: e.target.value }))}
                placeholder="Enter OpenRouter API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>
            {/* HuggingFace API Key */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="huggingfaceApiKey" className="text-right col-span-1 text-primary/90">HuggingFace Key</Label>
              <Input id="huggingfaceApiKey" type="password" value={settings.huggingfaceApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, huggingfaceApiKey: e.target.value }))}
                placeholder="Enter HuggingFace Token"
                className="col-span-3 bg-input border-primary/50 focus:border-primary" />
            </div>
            <div className="col-span-4 mt-1 p-2 text-xs text-destructive/90 bg-destructive/10 border border-destructive/30 rounded-md flex items-start">
              <AlertTriangle size={20} className="mr-2 mt-0.5 shrink-0" />
              <div><strong>Security Warning:</strong> API keys are stored in browser state (prototype only). Not for production.</div>
            </div>
             <p className="text-xs text-muted-foreground col-span-4">
                Note: Full backend integration for OpenRouter, HuggingFace, Llamafile, and dynamic API key use in Genkit plugins is required for these settings to be fully functional.
              </p>
          </div>
          
          {/* Main Model */}
          <div className="space-y-3 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <h4 className="text-md font-semibold text-primary">Main Generation Model</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mainApiModel" className="text-right col-span-1 text-primary/90">Type</Label>
              <Select value={settings.mainApiModel} onValueChange={(value) => handleModelTypeChange('mainApiModel', value as ApiModelType, 'main')}>
                <SelectTrigger id="mainApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Select main model type" />
                </SelectTrigger>
                <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right col-span-1 text-primary/90">Model</Label>
               {renderModelSelector('main', settings.mainApiModel)}
            </div>
          </div>


          {/* Custom Reasoning Model */}
           <div className="space-y-3 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-primary">Custom Reasoning Model</h4>
                <Switch id="useCustomReasoningModel" checked={settings.useCustomReasoningModel} 
                        onCheckedChange={(checked) => {
                            setSettings(prev => ({ ...prev, useCustomReasoningModel: checked }));
                            if (checked && settings.reasoningApiModel === 'ollama' && ollamaModels.length === 0) fetchOllamaModels('reasoning');
                            if (checked && settings.reasoningApiModel === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, 'reasoning');
                            if (checked && settings.reasoningApiModel === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels('reasoning');
                        }}
                        className="data-[state=checked]:bg-primary" />
            </div>
            {settings.useCustomReasoningModel && (
              <>
                <div className="grid grid-cols-4 items-center gap-4 pt-2">
                  <Label htmlFor="reasoningApiModel" className="text-right col-span-1 text-primary/90">Type</Label>
                  <Select value={settings.reasoningApiModel} onValueChange={(value) => handleModelTypeChange('reasoningApiModel', value as ApiModelType, 'reasoning')}>
                    <SelectTrigger id="reasoningApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Select reasoning model type" />
                    </SelectTrigger>
                    <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1 text-primary/90">Model</Label>
                    {renderModelSelector('reasoning', settings.reasoningApiModel)}
                </div>
              </>
            )}
          </div>

          {/* Custom Coding Model */}
           <div className="space-y-3 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-primary">Custom Coding Model</h4>
                <Switch id="useCustomCodingModel" checked={settings.useCustomCodingModel} 
                        onCheckedChange={(checked) => {
                            setSettings(prev => ({ ...prev, useCustomCodingModel: checked }));
                            if (checked && settings.codingApiModel === 'ollama' && ollamaModels.length === 0) fetchOllamaModels('coding');
                            if (checked && settings.codingApiModel === 'gemini' && geminiModels.length === 0 && settings.geminiApiKey) fetchGeminiModels(settings.geminiApiKey, 'coding');
                            if (checked && settings.codingApiModel === 'openrouter' && openRouterModels.length === 0) fetchOpenRouterModels('coding');
                        }}
                        className="data-[state=checked]:bg-primary" />
            </div>
            {settings.useCustomCodingModel && (
              <>
                <div className="grid grid-cols-4 items-center gap-4 pt-2">
                  <Label htmlFor="codingApiModel" className="text-right col-span-1 text-primary/90">Type</Label>
                  <Select value={settings.codingApiModel} onValueChange={(value) => handleModelTypeChange('codingApiModel', value as ApiModelType, 'coding')}>
                    <SelectTrigger id="codingApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                      <SelectValue placeholder="Select coding model type" />
                    </SelectTrigger>
                    <SelectContent>{apiModelOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right col-span-1 text-primary/90">Model</Label>
                    {renderModelSelector('coding', settings.codingApiModel)}
                </div>
              </>
            )}
          </div>
          
          {isLlamafileSelected && (
            <div className="col-span-4 space-y-2 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <Label htmlFor="llamafilePath" className="text-primary/90 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-primary" /> Llamafile Path/URL
              </Label>
              <Input id="llamafilePath" value={settings.llamafilePath || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, llamafilePath: e.target.value }))}
                placeholder="e.g., /path/to/model.llamafile or http://localhost:8080"
                className="bg-input border-primary/50 focus:border-primary" />
              <p className="text-xs text-muted-foreground">Experimental. Backend must be configured to access this.</p>
            </div>
          )}

          {(settings.mainApiModel === 'ollama' || (settings.useCustomReasoningModel && settings.reasoningApiModel === 'ollama') || (settings.useCustomCodingModel && settings.codingApiModel === 'ollama')) && (
             <div className="col-span-4 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> Ollama Note</p>
              <p className="text-xs text-muted-foreground">
                Ensure Ollama runs at <code>http://localhost:11434</code> and models are pulled. Check CORS if issues persist.
              </p>
             </div>
          )}
           {(settings.mainApiModel === 'huggingface' || (settings.useCustomReasoningModel && settings.reasoningApiModel === 'huggingface') || (settings.useCustomCodingModel && settings.codingApiModel === 'huggingface')) && (
             <div className="col-span-4 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> HuggingFace Note</p>
              <p className="text-xs text-muted-foreground">
                Enter the specific HuggingFace model ID (e.g., <code>mistralai/Mistral-7B-Instruct-v0.1</code>). An API token may be required for certain models.
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
