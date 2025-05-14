
export type ApiModelType = 'gemini' | 'openrouter' | 'huggingface' | 'llamafile' | 'ollama';

export interface AppSettings {
  mainApiModel: ApiModelType;
  ollamaMainModelName?: string;
  useCustomReasoningModel: boolean;
  reasoningApiModel?: ApiModelType;
  ollamaReasoningModelName?: string;
  useCustomCodingModel: boolean;
  codingApiModel?: ApiModelType;
  ollamaCodingModelName?: string;
  llamafilePath?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  huggingfaceApiKey?: string;
}

export const defaultAppSettings: AppSettings = {
  mainApiModel: 'gemini',
  ollamaMainModelName: 'llama3', // Default Ollama model suggestion
  useCustomReasoningModel: false,
  reasoningApiModel: 'gemini',
  ollamaReasoningModelName: 'llama3', // Default Ollama model suggestion
  useCustomCodingModel: false,
  codingApiModel: 'gemini',
  ollamaCodingModelName: 'codellama', // Default Ollama model suggestion for coding
  llamafilePath: '',
  geminiApiKey: '',
  