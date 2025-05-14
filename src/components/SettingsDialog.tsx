
"use client";

import { useState, useEffect } from 'react';
import type { AppSettings, ApiModelType } from '@/types/settings';
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
import { Cog, AlertTriangle } from 'lucide-react';

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

export function SettingsDialog({ isOpen, onOpenChange, currentSettings, onSave }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]); // Also update on isOpen true to reflect external changes

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const handleModelChange = (field: keyof Pick<AppSettings, 'mainApiModel' | 'reasoningApiModel' | 'codingApiModel'>, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value as ApiModelType }));
  };
  
  const isLlamafileSelected = settings.mainApiModel === 'llamafile' ||
                             (settings.useCustomReasoningModel && settings.reasoningApiModel === 'llamafile') ||
                             (settings.useCustomCodingModel && settings.codingApiModel === 'llamafile');

  const isOllamaSelectedForMain = settings.mainApiModel === 'ollama';
  const isOllamaSelectedForReasoning = settings.useCustomReasoningModel && settings.reasoningApiModel === 'ollama';
  const isOllamaSelectedForCoding = settings.useCustomCodingModel && settings.codingApiModel === 'ollama';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <Cog size={20} className="mr-2" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription>
            Configure the AI models for repository merging.
            <br />
            <span className="text-xs text-muted-foreground">Note: OpenRouter, HuggingFace, Llamafile, and Ollama support are UI placeholders. Backend integration is required for full functionality.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {/* Main Model */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mainApiModel" className="text-right col-span-1 text-primary/90">
              Main Model
            </Label>
            <Select
              value={settings.mainApiModel}
              onValueChange={(value) => handleModelChange('mainApiModel', value)}
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
              <Input
                id="ollamaMainModelName"
                value={settings.ollamaMainModelName || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, ollamaMainModelName: e.target.value }))}
                placeholder="e.g., llama3, mistral"
                className="col-span-3 bg-input border-primary/50 focus:border-primary"
              />
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
                  onValueChange={(value) => handleModelChange('reasoningApiModel', value)}
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
                  <Input
                    id="ollamaReasoningModelName"
                    value={settings.ollamaReasoningModelName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, ollamaReasoningModelName: e.target.value }))}
                    placeholder="e.g., llama3, mistral"
                    className="col-span-3 bg-input border-primary/50 focus:border-primary"
                  />
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
                  onValueChange={(value) => handleModelChange('codingApiModel', value)}
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
                  <Input
                    id="ollamaCodingModelName"
                    value={settings.ollamaCodingModelName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, ollamaCodingModelName: e.target.value }))}
                    placeholder="e.g., codellama, deepseek-coder"
                    className="col-span-3 bg-input border-primary/50 focus:border-primary"
                  />
                </div>
              )}
            </>
          )}
          
          {/* Llamafile Path Input */}
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

          {/* Ollama General Note */}
          {(isOllamaSelectedForMain || isOllamaSelectedForReasoning || isOllamaSelectedForCoding) && (
            <div className="col-span-4 mt-2 p-3 border border-dashed border-primary/50 rounded-md bg-muted/20">
              <p className="text-primary/90 flex items-center mb-1"><AlertTriangle size={16} className="mr-2 text-primary" /> Ollama Configuration Note</p>
              <p className="text-xs text-muted-foreground">
                Ensure Ollama is running locally (typically at <code>http://localhost:11434</code>) and the specified models are downloaded (e.g., <code>ollama pull llama3</code>).
                The application backend requires specific configuration to interface with your Ollama instance.
                Dynamic listing of available Ollama models is a future enhancement.
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
