
'use server';
/**
 * @fileOverview An AI agent for recommending GitHub repositories.
 *
 * - recommendRepos - A function that handles repository recommendations.
 * - RecommendReposInput - The input type for the recommendRepos function.
 * - RecommendReposOutput - The return type for the recommendRepos function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit, type ModelArgument} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const RecommendReposInputSchema = z.object({
  mode: z.enum(['general', 'promptBased']).describe("The mode of recommendation: 'general' or 'promptBased'."),
  promptDescription: z.string().optional().describe('A description of desired features or project goals for prompt-based recommendations.'),
  
  mainApiModel: z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional(),
  ollamaMainModelName: z.string().optional(),
  geminiMainModelName: z.string().optional(),
  openrouterMainModelName: z.string().optional(),
  huggingfaceMainModelName: z.string().optional(),
  
  llamafilePath: z.string().optional(),
  geminiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  huggingfaceApiKey: z.string().optional(),

  useCustomReasoningModel: z.boolean().optional(),
  reasoningApiModel: z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional(),
  ollamaReasoningModelName: z.string().optional(),
  geminiReasoningModelName: z.string().optional(),
  openrouterReasoningModelName: z.string().optional(),
  huggingfaceReasoningModelName: z.string().optional(),
  useCustomCodingModel: z.boolean().optional(),
  codingApiModel: z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional(),
  ollamaCodingModelName: z.string().optional(),
  geminiCodingModelName: z.string().optional(),
  openrouterCodingModelName: z.string().optional(),
  huggingfaceCodingModelName: z.string().optional(),
});
export type RecommendReposInput = z.infer<typeof RecommendReposInputSchema>;

const RecommendedRepoSchema = z.object({
  name: z.string().describe('The name of the GitHub repository.'),
  url: z.string().describe('The full URL of the GitHub repository.'), // No .url() refinement here
  reason: z.string().describe('A brief explanation why this repository is recommended.'),
});

const RecommendReposOutputSchema = z.object({
  recommendations: z.array(RecommendedRepoSchema).length(5).describe('A list of 5 recommended GitHub repositories.'),
});
export type RecommendReposOutput = z.infer<typeof RecommendReposOutputSchema>;

const defineRecommendReposPrompt = (aiInstance: typeof globalAi) => aiInstance.definePrompt({
  name: 'recommendReposPrompt',
  input: {schema: RecommendReposInputSchema},
  output: {schema: RecommendReposOutputSchema},
  prompt: `You are an AI assistant specialized in recommending GitHub repositories. Your goal is to suggest 5 repositories.

Current Model Configuration (for your context, this is the main model you are currently using):
- Main Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}- Ollama Model: {{{ollamaMainModelName}}} (Base name: {{{ollamaMainModelName}}}){{/if}}
{{#if geminiMainModelName}}- Gemini Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}- OpenRouter Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}- HuggingFace Model: {{{huggingfaceMainModelName}}}{{/if}}
{{#if llamafilePath}}- Llamafile Path: {{{llamafilePath}}}{{/if}}

Recommendation Mode: {{{mode}}}

{{#if promptDescription}}
User's Project Description/Goal:
"{{{promptDescription}}}"
Based on this description, please recommend 5 GitHub repositories that would be relevant, potentially compatible for merging, or offer diverse functionalities related to the prompt. For each repository, provide its name, full URL, and a brief reason for your recommendation.
{{else}}
Please provide a general recommendation of 5 GitHub repositories. These repositories should be chosen for their potential compatibility for merging together to create an interesting or useful application, and for their variation in functionality. For example, one could be a UI library, another a backend framework, another a data visualization tool, etc. For each repository, provide its name, full URL, and a brief reason for your recommendation.
{{/if}}

Ensure you provide exactly 5 recommendations, each with a name, a valid GitHub URL, and a reason.
`,
});


const recommendReposFlow = globalAi.defineFlow(
  {
    name: 'recommendReposFlow',
    inputSchema: RecommendReposInputSchema,
    outputSchema: RecommendReposOutputSchema,
  },
  async (input) => {
    let currentAi = globalAi;
    let configuredPrompt = defineRecommendReposPrompt(currentAi);
    let modelToUse: ModelArgument | undefined = undefined;

    if (input.mainApiModel === 'gemini' && input.geminiApiKey && input.geminiMainModelName) {
      console.log(`RecommendRepos: Using user-provided Gemini API key for model: ${input.geminiMainModelName}`);
      const geminiPluginWithKey = googleAI({ apiKey: input.geminiApiKey });
      currentAi = genkit({ plugins: [geminiPluginWithKey], logLevel: 'warn', flowId: 'recommendReposFlow-gemini-customKey' });
      configuredPrompt = defineRecommendReposPrompt(currentAi);
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'gemini' && input.geminiMainModelName) {
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'ollama' && input.ollamaMainModelName) {
      const baseOllamaModelName = input.ollamaMainModelName.split(':')[0];
      modelToUse = `ollama/${baseOllamaModelName}`;
      console.warn(`RecommendRepos: Ollama model selected: ${input.ollamaMainModelName}. Using base name for Genkit: ${baseOllamaModelName}. Ensure Genkit is configured with an Ollama plugin.`);
    } else if (input.mainApiModel === 'openrouter' && input.openrouterMainModelName) {
      modelToUse = `openrouter/${input.openrouterMainModelName}`;
      console.warn("RecommendRepos: OpenRouter model selected. Ensure Genkit is configured with an OpenRouter plugin.");
    } else if (input.mainApiModel === 'huggingface' && input.huggingfaceMainModelName) {
      modelToUse = `huggingface/${input.huggingfaceMainModelName}`;
      console.warn("RecommendRepos: HuggingFace model selected. Ensure Genkit is configured with a HuggingFace plugin.");
    } else if (input.mainApiModel === 'llamafile') {
      console.warn("RecommendRepos: Llamafile selected as main model. Using default model for generation.");
    }
    
    const {output} = await configuredPrompt(input, modelToUse ? { model: modelToUse } : undefined);
    
    if (!output || !output.recommendations || output.recommendations.length !== 5) {
      throw new Error('AI did not return 5 valid recommendations.');
    }
    for (const repo of output.recommendations) {
        if (typeof repo.name !== 'string' || typeof repo.url !== 'string' || typeof repo.reason !== 'string') {
            throw new Error('Invalid repository object structure in AI output. Each repo must have name, url, and reason as strings.');
        }
        if (!repo.url.startsWith('http://') && !repo.url.startsWith('https://')) {
            throw new Error(`Invalid URL format for repository "${repo.name}": ${repo.url}`);
        }
    }
    return output;
  }
);

export async function recommendRepos(input: RecommendReposInput): Promise<RecommendReposOutput> {
  return recommendReposFlow(input);
}

