
'use server';
/**
 * @fileOverview An AI agent for recommending GitHub repositories.
 *
 * - recommendRepos - A function that handles repository recommendations.
 * - RecommendReposInput - The input type for the recommendRepos function.
 * - RecommendReposOutput - The return type for the recommendRepos function.
 */

import {ai} from '@/ai/genkit';
import type { AppSettings } from '@/types/settings';
import {z} from 'genkit';

const RecommendReposInputSchema = z.object({
  mode: z.enum(['general', 'promptBased']).describe("The mode of recommendation: 'general' or 'promptBased'."),
  promptDescription: z.string().optional().describe('A description of desired features or project goals for prompt-based recommendations.'),
  // Include AppSettings fields for model configuration
  mainApiModel: z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional(),
  ollamaMainModelName: z.string().optional(),
  geminiMainModelName: z.string().optional(),
  openrouterMainModelName: z.string().optional(),
  huggingfaceMainModelName: z.string().optional(),
  llamafilePath: z.string().optional(),
  geminiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  huggingfaceApiKey: z.string().optional(),
  // Reasoning and Coding models are not strictly needed for this flow but are part of AppSettings
  // We can simplify this input if they are truly not used, but for consistency with AppSettings:
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
  url: z.string().url().describe('The full URL of the GitHub repository.'),
  reason: z.string().describe('A brief explanation why this repository is recommended.'),
});

const RecommendReposOutputSchema = z.object({
  recommendations: z.array(RecommendedRepoSchema).length(5).describe('A list of 5 recommended GitHub repositories.'),
});
export type RecommendReposOutput = z.infer<typeof RecommendReposOutputSchema>;

export async function recommendRepos(input: RecommendReposInput): Promise<RecommendReposOutput> {
  return recommendReposFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendReposPrompt',
  input: {schema: RecommendReposInputSchema},
  output: {schema: RecommendReposOutputSchema},
  prompt: `You are an AI assistant specialized in recommending GitHub repositories. Your goal is to suggest 5 repositories.

Current Model Configuration (for your context, not for you to change):
- Main Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}- Ollama Model: {{{ollamaMainModelName}}}{{/if}}
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

const recommendReposFlow = ai.defineFlow(
  {
    name: 'recommendReposFlow',
    inputSchema: RecommendReposInputSchema,
    outputSchema: RecommendReposOutputSchema,
  },
  async (input) => {
    // Here, we would ideally configure Genkit to use the specific model (and API key if needed)
    // from input.mainApiModel, input.geminiApiKey etc.
    // For now, it will use the globally configured model in genkit.ts.
    // This logic would be similar to the placeholder in intelligentMergeFlow.
    const {output} = await prompt(input);
    if (!output || output.recommendations.length !== 5) {
      throw new Error('AI did not return 5 recommendations.');
    }
    return output;
  }
);
