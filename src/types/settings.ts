
export type ApiModelType = 'gemini' | 'openrouter' | 'huggingface' | 'llamafile';

export interface AppSettings {
  mainApiModel: ApiModelType;
  useCustomReasoningModel: boolean;
  reasoningApiModel?: ApiModelType;
  useCustomCodingModel: boolean;
  codingApiModel?: ApiModelType;
  llamafilePath?: string; // Path or URL to the Llamafile
}

export const defaultAppSettings: AppSettings = {
  mainApiModel: 'gemini',
  useCustomReasoningModel: false,
  reasoningApiModel: 'gemini',
  useCustomCodingModel: false,
  codingApiModel: 'gemini',
  llamafilePath: '',
};
