
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ApiModelType } from '@/types/settings';
import { defaultAppSettings } from '@/types/settings'; // Import defaultAppSettings
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
import { Cog, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
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
  { value: 'huggingface', label: 'HuggingFace' },
  { value: 'llamafile', label: 'Llamafile (Experimental)' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

interface OllamaTag {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaTag[];
}

export function SettingsDialog({ isOpen, onOpenChange, currentSettings, onSave }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const { toast } = useToast();

  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState<Record<string, boolean>>({ main: false, reasoning: false, coding: false });
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const fetchOllamaModels = useCallback(async (modelCategory: 'main' | 'reasoning' | 'coding') => {
    setOllamaLoading(prev => ({ ...prev, [modelCategory]: true }));
    setOllamaError(null);
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ollama server not found or /api/tags endpoint doesn't exist.");
        throw new Error(`Failed to fetch Ollama models (status: ${response.status}). Ensure Ollama is running and accessible.`);
      }
      const data: OllamaTagsResponse = await response.json();
      const modelNames = data.models.map(model => model.name).sort();
      setOllamaModels(modelNames);
      if (modelNames.length === 0) {
        setOllamaError("No models found in Ollama. Pull models using 'ollama pull <model_name>'.");
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("Error fetching Ollama models:", errorMessage);
      setOllamaError(`Error fetching Ollama models: ${errorMessage}. Please ensure Ollama is running at http://localhost:11434 and accessible (CORS might be an issue).`);
      setOllamaModels([]); // Clear models on error
      toast({
        title: "Ollama Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOllamaLoading(prev => ({ ...prev, [modelCategory]: false }));
    }
  }, [toast]);

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const handleModelTypeChange = (
    field: keyof Pick<AppSettings, 'mainApiModel' | 'reasoningApiModel' | 'codingApiModel'>,
    value: ApiModelType,
    modelCategory: 'main' | 'reasoning' | 'coding'
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (value === 'ollama') {
      if (ollamaModels.length === 0 && !ollamaLoading[modelCategory] && !ollamaError) { // Fetch only if not already fetched or loading
        fetchOllamaModels(modelCategory);
      }
    } else {
      // If switching away from Ollama, reset the specific model name for that category
      if (field === 'mainApiModel') setSettings(prev => ({ ...prev, ollamaMainModelName: defaultAppSettings.ollamaMainModelName }));
      if (field === 'reasoningApiModel') setSettings(prev => ({ ...prev, ollamaReasoningModelName: defaultAppSettings.ollamaReasoningModelName }));
      if (field === 'codingApiModel') setSettings(prev => ({ ...prev, ollamaCodingModelName: defaultAppSettings.ollamaCodingModelName }));
    }
  };
  
  const handleOllamaModelNameChange = (
    field: keyof Pick<AppSettings, 'ollamaMainModelName' | 'ollamaReasoningModelName' | 'ollamaCodingModelName'>,
    value: string
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };


  const isLlamafileSelected = settings.mainApiModel === 'llamafile' ||
                             (settings.useCustomReasoningModel && settings.reasoningApiModel === 'llamafile') ||
                             (settings.useCustomCodingModel && settings.codingApiModel === 'llamafile');

  const isOllamaSelectedForMain = settings.mainApiModel === 'ollama';
  const isOllamaSelectedForReasoning = settings.useCustomReasoningModel && settings.reasoningApiModel === 'ollama';
  const isOllamaSelectedForCoding = settings.useCustomCodingModel && settings.codingApiModel === 'ollama';

  // Fetch Ollama models if Ollama is selected when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isOllamaSelectedForMain && ollamaModels.length === 0 && !ollamaLoading['main'] && !ollamaError) fetchOllamaModels('main');
      if (isOllamaSelectedForReasoning && ollamaModels.length === 0 && !ollamaLoading['reasoning'] && !ollamaError) fetchOllamaModels('reasoning');
      if (isOllamaSelectedForCoding && ollamaModels.length === 0 && !ollamaLoading['coding'] && !ollamaError) fetchOllamaModels('coding');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isOllamaSelectedForMain, isOllamaSelectedForReasoning, isOllamaSelectedForCoding, fetchOllamaModels]);


  const renderOllamaModelSelect = (
    id: string,
    value: string | undefined,
    onChange: (val: string) => void,
    modelCategory: 'main' | 'reasoning' | 'coding',
    placeholder: string
  ) => {
    if (ollamaLoading[modelCategory]) {
      return (
        <div className="col-span-3 flex items-center text-sm text-muted-foreground">
          <Loader2 size={16} className="mr-2 animate-spin" /> Loading Ollama models...
        </div>
      );
    }
     if (ollamaError && ollamaModels.length === 0) {
      return (
        <div className="col-span-3 text-xs text-destructive p-2 rounded-md border border-dashed border-destructive/50 bg-destructive/10">
           {ollamaError}
        </div>
      );
    }
    if (!ollamaLoading[modelCategory] && ollamaModels.length === 0 && !ollamaError) {
         return (
            <div className="col-span-3 text-xs text-muted-foreground p-2 rounded-md border border-dashed border-primary/50 bg-muted/20">
                Click "Load Models" or ensure Ollama is selected for the model type to list available local models.
                 <Button variant="link" size="sm" className="p-0 h-auto ml-1 text-primary" onClick={() => fetchOllamaModels(modelCategory)}>Load Models</Button>
            </div>
        );
    }

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="col-span-3 bg-input border-primary/50 focus:border-primary">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {ollamaModels.map(modelName => (
            <SelectItem key={modelName} value={modelName}>
              {modelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Cog size={20} className="mr-2" />
            AI Model & API Key Settings
          </DialogTitle>
          <DialogDescription>
            Configure AI models and provide API keys for external services.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-3">
          {/* API Key Section */}
          <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-muted/20">
            <h4 className="text-md font-semibold text-primary flex items-center"><KeyRound size={18} className="mr-2"/>API Keys</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="geminiApiKey" className="text-right col-span-1 text-primary/90">
                Gemini Key
              </Label>
              <Input
                id="geminiApiKey"
                type="password"
                value={settings.geminiApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="Enter Gemini API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="openrouterApiKey" className="text-right col-span-1 text-primary/90">
                OpenRouter Key
              </Label>
              <Input
                id="openrouterApiKey"
                type="password"
                value={settings.openrouterApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, openrouterApiKey: e.target.value }))}
                placeholder="Enter OpenRouter API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="huggingfaceApiKey" className="text-right col-span-1 text-primary/90">
                HuggingFace Key
              </Label>
              <Input
                id="huggingfaceApiKey"
                type="password"
                value={settings.huggingfaceApiKey || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, huggingfaceApiKey: e.target.value }))}
                placeholder="Enter HuggingFace API Key"
                className="col-span-3 bg-input border-primary/50 focus:border-primary"
              />
            </div>
            <div className="col-span-4 mt-1 p-2 text-xs text-destructive/90 bg-destructive/10 border border-destructive/30 rounded-md flex items-start">
              <AlertTriangle size={20} className="mr-2 mt-0.5 shrink-0" />
              <div>
                <strong>Security Warning:</strong> API keys entered here are stored in browser application state for this prototype. This is NOT secure for production. In a real application, API keys must be managed server-side.
              </div>
            </div>
             <p className="text-xs text-muted-foreground col-span-4">
                Note: OpenRouter, HuggingFace, Llamafile, and Ollama support are UI placeholders. Backend integration and correct API key usage in Genkit plugins are required for full functionality.
              </p>
          </div>
          
          {/* Main Model */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mainApiModel" className="text-right col-span-1 text-primary/90">
              Main Model
            </Label>
            <Select
              value={settings.mainApiModel}
              onValueChange={(value) => handleModelTypeChange('mainApiModel', value as ApiModelType, 'main')}
            >
              <SelectTrigger id="mainApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                <SelectValue placeholder="Select main model" />
              </SelectTrigger>
              <SelectContent>
                {apiModelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isOllamaSelectedForMain && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ollamaMainModelName" className="text-right col-span-1 text-primary/90">
                Ollama Main Model
              </Label>
              {renderOllamaModelSelect(
                "ollamaMainModelName",
                settings.ollamaMainModelName,
                (val) => handleOllamaModelNameChange('ollamaMainModelName', val),
                'main',
                "Select Ollama main model"
              )}
            </div>
          )}

          {/* Custom Reasoning Model */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="useCustomReasoningModel" className="text-right col-span-1 text-primary/90">
              Custom Reasoning Model
            </Label>
            <Switch
              id="useCustomReasoningModel"
              checked={settings.useCustomReasoningModel}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useCustomReasoningModel: checked }))}
              className="col-span-3 data-[state=checked]:bg-primary"
            />
          </div>
          {settings.useCustomReasoningModel && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reasoningApiModel" className="text-right col-span-1 text-primary/90">
                  Reasoning Model
                </Label>
                <Select
                  value={settings.reasoningApiModel}
                  onValueChange={(value) => handleModelTypeChange('reasoningApiModel', value as ApiModelType, 'reasoning')}
                >
                  <SelectTrigger id="reasoningApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Select reasoning model" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiModelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOllamaSelectedForReasoning && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ollamaReasoningModelName" className="text-right col-span-1 text-primary/90">
                    Ollama Reasoning Model
                  </Label>
                   {renderOllamaModelSelect(
                    "ollamaReasoningModelName",
                    settings.ollamaReasoningModelName,
                    (val) => handleOllamaModelNameChange('ollamaReasoningModelName', val),
                    'reasoning',
                    "Select Ollama reasoning model"
                  )}
                </div>
              )}
            </>
          )}

          {/* Custom Coding Model */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="useCustomCodingModel" className="text-right col-span-1 text-primary/90">
              Custom Coding Model
            </Label>
            <Switch
              id="useCustomCodingModel"
              checked={settings.useCustomCodingModel}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useCustomCodingModel: checked }))}
              className="col-span-3 data-[state=checked]:bg-primary"
            />
          </div>
          {settings.useCustomCodingModel && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codingApiModel" className="text-right col-span-1 text-primary/90">
                  Coding Model
                </Label>
                <Select
                  value={settings.codingApiModel}
                  onValueChange={(value) => handleModelTypeChange('codingApiModel', value as ApiModelType, 'coding')}
                >
                  <SelectTrigger id="codingApiModel" className="col-span-3 bg-input border-primary/50 focus:border-primary">
                    <SelectValue placeholder="Select coding model" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiModelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOllamaSelectedForCoding && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ollamaCodingModelName" className="text-right col-span-1 text-primary/90">
                    Ollama Coding Model
                  </Label>
                  {renderOllamaModelSelect(
                    "ollamaCodingModelName",
                    settings.ollamaCodingModelName,
                    (val) => handleOllamaModelNameChange('ollamaCodingModelName', val),
                    'coding',
                    "Select Ollama coding model"
                  )}
                </div>
              )}
            </>
          )}
          
          {isLlamafileSelected && (
            <div className="col-span-4 space-y-2 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <Label htmlFor="llamafilePath" className="text-primary/90 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-primary" />
                Llamafile Path/URL
              </Label>
              <Input
                id="llamafilePath"
                value={settings.llamafilePath || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, llamafilePath: e.target.value }))}
                placeholder="e.g., /path/to/model.llamafile or http://localhost:8080"
                className="bg-input border-primary/50 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Provide the local path or accessible URL for the Llamafile. Backend must be configured to access this file. This feature is experimental.
              </p>
            </div>
          )}

          {(isOllamaSelectedForMain || isOllamaSelectedForReasoning || isOllamaSelectedForCoding) && (
             <div className="col-span-4 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> Ollama Configuration Note</p>
              <p className="text-xs text-muted-foreground">
                Ensure Ollama is running locally (typically at <code>http://localhost:11434</code>) and the specified models are downloaded (e.g., <code>ollama pull llama3</code>).
                If models are not listed, try the "Load Models" button or ensure Ollama is accessible (check for CORS issues if running Ollama on a different host/port).
                The application backend requires specific configuration to interface with your Ollama instance.
              </p>
              {ollamaError && <p className="text-xs text-destructive mt-2">{ollamaError}</p>}
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
