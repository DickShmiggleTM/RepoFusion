
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
import { Input } from "@/components/ui/input"; // Added Input
import { Cog, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

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
];

export function SettingsDialog({ isOpen, onOpenChange, currentSettings, onSave }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const handleModelChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value as ApiModelType }));
  };
  
  const isLlamafileSelected = settings.mainApiModel === 'llamafile' ||
                             (settings.useCustomReasoningModel && settings.reasoningApiModel === 'llamafile') ||
                             (settings.useCustomCodingModel && settings.codingApiModel === 'llamafile');

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
            <span className="text-xs text-muted-foreground">Note: OpenRouter, HuggingFace, and Llamafile are UI placeholders. Llamafile requires backend setup to access the specified path.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reasoningApiModel" className="text-right col-span-1 text-primary/90">
                Reasoning Model
              </Label>
              <Select
                value={settings.reasoningApiModel}
                onValueChange={(value) => handleModelChange('reasoningApiModel', value)}
                disabled={!settings.useCustomReasoningModel}
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
          )}

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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codingApiModel" className="text-right col-span-1 text-primary/90">
                Coding Model
              </Label>
              <Select
                value={settings.codingApiModel}
                onValueChange={(value) => handleModelChange('codingApiModel', value)}
                disabled={!settings.useCustomCodingModel}
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
                Provide the local path or accessible URL for the Llamafile. The backend must be configured to access and execute this file. This feature is experimental.
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
