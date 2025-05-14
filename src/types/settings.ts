
export type ApiModelType = 'gemini' | 'openrouter' | 'huggingface';

export interface AppSettings {
  mainApiModel: ApiModelType;
  useCustomReasoningModel: boolean;
  reasoningApiModel?: ApiModelType;
  useCustomCodingModel: boolean;
  codingApiModel?: ApiModelType;
}

export const defaultAppSettings: AppSettings = {
  mainApiModel: 'gemini',
  useCustomReasoningModel: false,
  reasoningApiModel: 'gemini',
  useCustomCodingModel: false,
  codingApiModel: 'gemini',
};
