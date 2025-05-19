
export type ApiModelType = 'gemini' | 'openrouter' | 'huggingface' | 'llamafile' | 'ollama';

export interface AppSettings {
  mainApiModel: ApiModelType;
  ollamaMainModelName?: string;
  geminiMainModelName?: string;
  openrouterMainModelName?: string; 
  huggingfaceMainModelName?: string; 

  useCustomReasoningModel: boolean;
  reasoningApiModel?: ApiModelType;
  ollamaReasoningModelName?: string;
  geminiReasoningModelName?: string;
  openrouterReasoningModelName?: string; 
  huggingfaceReasoningModelName?: string; 

  useCustomCodingModel: boolean;
  codingApiModel?: ApiModelType;
  ollamaCodingModelName?: string;
  geminiCodingModelName?: string;
  openrouterCodingModelName?: string; 
  huggingfaceCodingModelName?: string;

  llamafilePath?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  huggingfaceApiKey?: string;
}

export const defaultAppSettings: AppSettings = {
  mainApiModel: 'gemini',
  ollamaMainModelName: 'llama3', // Common Ollama default
  geminiMainModelName: 'gemini-1.5-flash-latest',
  openrouterMainModelName: 'deepseek/deepseek-coder', // Example Deepseek model via OpenRouter
  huggingfaceMainModelName: '', // Usually a specific model ID like 'mistralai/Mistral-7B-Instruct-v0.1'

  useCustomReasoningModel: false,
  reasoningApiModel: 'gemini',
  ollamaReasoningModelName: 'llama3',
  geminiReasoningModelName: 'gemini-1.5-flash-latest',
  openrouterReasoningModelName: 'deepseek/deepseek-chat', // Example Deepseek model via OpenRouter
  huggingfaceReasoningModelName: '',

  useCustomCodingModel: false,
  codingApiModel: 'gemini',
  ollamaCodingModelName: 'codellama', // Common Ollama coding model
  geminiCodingModelName: 'gemini-1.5-flash-latest',
  openrouterCodingModelName: 'deepseek/deepseek-coder', // Example Deepseek model via OpenRouter
  huggingfaceCodingModelName: '',

  llamafilePath: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  huggingfaceApiKey: '',
};
