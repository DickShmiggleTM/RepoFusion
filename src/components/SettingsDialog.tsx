
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
import { Cog } from 'lucide-react';

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

  const handleMainModelChange = (value: string) => {
    setSettings(prev => ({ ...prev, mainApiModel: value as ApiModelType }));
  };

  const handleReasoningModelChange = (value: string) => {
    setSettings(prev => ({ ...prev, reasoningApiModel: value as ApiModelType }));
  };

  const handleCodingModelChange = (value: string) => {
    setSettings(prev => ({ ...prev, codingApiModel: value as ApiModelType }));
  };

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
            <span className="text-xs text-muted-foreground">Note: OpenRouter and HuggingFace are UI placeholders and not fully integrated yet.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mainApiModel" className="text-right col-span-1 text-primary/90">
              Main Model
            </Label>
            <Select
              value={settings.mainApiModel}
              onValueChange={handleMainModelChange}
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
                onValueChange={handleReasoningModelChange}
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
                onValueChange={handleCodingModelChange}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-primary text-primary hover:bg-primary/10">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/80">Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
