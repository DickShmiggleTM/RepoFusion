
export type ApiModelType = 'gemini' | 'openrouter' | 'huggingface' | 'llamafile' | 'ollama';

export interface AppSettings {
  mainApiModel: ApiModelType;
  ollamaMainModelName?: string;
  geminiMainModelName?: string;
  openrouterMainModelName?: string;
  huggingfaceMainModelName?: string; // Will be an input field

  useCustomReasoningModel: boolean;
  reasoningApiModel?: ApiModelType;
  ollamaReasoningModelName?: string;
  geminiReasoningModelName?: string;
  openrouterReasoningModelName?: string;
  huggingfaceReasoningModelName?: string; // Will be an input field

  useCustomCodingModel: boolean;
  codingApiModel?: ApiModelType;
  ollamaCodingModelName?: string;
  geminiCodingModelName?: string;
  openrouterCodingModelName?: string;
  huggingfaceCodingModelName?: string; // Will be an input field

  llamafilePath?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  huggingfaceApiKey?: string;
}

export const defaultAppSettings: AppSettings = {
  mainApiModel: 'gemini',
  ollamaMainModelName: 'llama3',
  geminiMainModelName: 'gemini-1.5-flash-latest',
  openrouterMainModelName: '',
  huggingfaceMainModelName: '',

  useCustomReasoningModel: false,
  reasoningApiModel: 'gemini',
  ollamaReasoningModelName: 'llama3',
  geminiReasoningModelName: 'gemini-1.5-flash-latest',
  openrouterReasoningModelName: '',
  huggingfaceReasoningModelName: '',

  useCustomCodingModel: false,
  codingApiModel: 'gemini',
  ollamaCodingModelName: 'codellama',
  geminiCodingModelName: 'gemini-1.5-flash-latest',
  openrouterCodingModelName: '',
  huggingfaceCodingModelName: '',

  llamafilePath: '',
  geminiApiKey: '',
  openrouterApiKey: '',
  huggingfaceApiKey: '',
};
