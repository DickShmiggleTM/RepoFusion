
'use server';

/**
 * @fileOverview An AI agent for intelligently merging multiple GitHub repositories.
 *
 * - intelligentMerge - A function that handles the merging of codebases.
 * - IntelligentMergeInput - The input type for the intelligentMerge function.
 * - IntelligentMergeOutput - The return type for the intelligentMerge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ApiModelTypeSchema = z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional();

// Removed 'export' from the line below
const IntelligentMergeInputSchema = z.object({
  repositoryUrls: z
    .array(z.string().url())
    .describe('An array of GitHub repository URLs to merge.'),
  targetLanguage: z
    .string()
    .optional()
    .describe('The target programming language for the merged codebase.'),
  instructions: z
    .string()
    .optional()
    .describe('Additional instructions for the merging process, such as specific features to prioritize or conflicts to resolve in a certain way.'),
  
  mainApiModel: ApiModelTypeSchema.describe('The main API model type to use for generation.'),
  ollamaMainModelName: z.string().optional().describe('The name of the Ollama model for main generation.'),
  geminiMainModelName: z.string().optional().describe('The name of the Gemini model for main generation.'),
  openrouterMainModelName: z.string().optional().describe('The ID of the OpenRouter model for main generation.'),
  huggingfaceMainModelName: z.string().optional().describe('The ID of the HuggingFace model for main generation.'),

  useCustomReasoningModel: z.boolean().optional().describe('Whether to use a custom reasoning model.'),
  reasoningApiModel: ApiModelTypeSchema.describe('The API model type for reasoning tasks.'),
  ollamaReasoningModelName: z.string().optional().describe('The name of the Ollama model for reasoning.'),
  geminiReasoningModelName: z.string().optional().describe('The name of the Gemini model for reasoning.'),
  openrouterReasoningModelName: z.string().optional().describe('The ID of the OpenRouter model for reasoning.'),
  huggingfaceReasoningModelName: z.string().optional().describe('The ID of the HuggingFace model for reasoning.'),

  useCustomCodingModel: z.boolean().optional().describe('Whether to use a custom coding model.'),
  codingApiModel: ApiModelTypeSchema.describe('The API model type for coding tasks.'),
  ollamaCodingModelName: z.string().optional().describe('The name of the Ollama model for coding.'),
  geminiCodingModelName: z.string().optional().describe('The name of the Gemini model for coding.'),
  openrouterCodingModelName: z.string().optional().describe('The ID of the OpenRouter model for coding.'),
  huggingfaceCodingModelName: z.string().optional().describe('The ID of the HuggingFace model for coding.'),
  
  llamafilePath: z.string().optional().describe('Path or URL to the Llamafile, if selected.'),
  geminiApiKey: z.string().optional().describe('API Key for Gemini (Google AI).'),
  openrouterApiKey: z.string().optional().describe('API Key for OpenRouter.'),
  huggingfaceApiKey: z.string().optional().describe('API Key for HuggingFace.'),
});
export type IntelligentMergeInput = z.infer<typeof IntelligentMergeInputSchema>;

const IntelligentMergeOutputSchema = z.object({
  mergedCodebase: z
    .string()
    .describe('The complete, working, and fully functional merged codebase.'),
  summary: z
    .string()
    .describe('A summary of the merging process, including conflict resolution and integration strategies.'),
});
export type IntelligentMergeOutput = z.infer<typeof IntelligentMergeOutputSchema>;

export async function intelligentMerge(input: IntelligentMergeInput): Promise<IntelligentMergeOutput> {
  return intelligentMergeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software engineer specializing in merging codebases from multiple GitHub repositories.

You will analyze the codebases from the following repositories, resolve any conflicts, integrate their functionalities, and create a unified project.

Repositories:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language: {{#if targetLanguage}}{{{targetLanguage}}}{{else}}Not specified{{/if}}

Main Generation Model Configuration:
- Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}  - Ollama Model: {{{ollamaMainModelName}}}{{/if}}
{{#if geminiMainModelName}}  - Gemini Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}  - OpenRouter Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}  - HuggingFace Model: {{{huggingfaceMainModelName}}}{{/if}}

{{#if useCustomReasoningModel}}
Reasoning Model Configuration:
- Type: {{{reasoningApiModel}}}
{{#if ollamaReasoningModelName}}  - Ollama Model: {{{ollamaReasoningModelName}}}{{/if}}
{{#if geminiReasoningModelName}}  - Gemini Model: {{{geminiReasoningModelName}}}{{/if}}
{{#if openrouterReasoningModelName}}  - OpenRouter Model: {{{openrouterReasoningModelName}}}{{/if}}
{{#if huggingfaceReasoningModelName}}  - HuggingFace Model: {{{huggingfaceReasoningModelName}}}{{/if}}
{{else}}
Reasoning Model: Using Main Generation Model.
{{/if}}

{{#if useCustomCodingModel}}
Coding Model Configuration:
- Type: {{{codingApiModel}}}
{{#if ollamaCodingModelName}}  - Ollama Model: {{{ollamaCodingModelName}}}{{/if}}
{{#if geminiCodingModelName}}  - Gemini Model: {{{geminiCodingModelName}}}{{/if}}
{{#if openrouterCodingModelName}}  - OpenRouter Model: {{{openrouterCodingModelName}}}{{/if}}
{{#if huggingfaceCodingModelName}}  - HuggingFace Model: {{{huggingfaceCodingModelName}}}{{/if}}
{{else}}
Coding Model: Using Main Generation Model.
{{/if}}

{{#if llamafilePath}}Llamafile Path (if Llamafile selected for any model): {{{llamafilePath}}}{{/if}}

API Keys Provided:
- Gemini: {{#if geminiApiKey}}Yes{{else}}No{{/if}}
- OpenRouter: {{#if openrouterApiKey}}Yes{{else}}No{{/if}}
- HuggingFace: {{#if huggingfaceApiKey}}Yes{{else}}No{{/if}}

Instructions: {{#if instructions}}{{{instructions}}}{{else}}No additional instructions provided.{{/if}}

Provide the complete, working, and fully functional merged codebase, as well as a summary of the merging process, including conflict resolution and integration strategies.
Ensure all external dependencies are resolved correctly, and the merged codebase is fully functional.

Merged Codebase:`,
});

const intelligentMergeFlow = ai.defineFlow(
  {
    name: 'intelligentMergeFlow',
    inputSchema: IntelligentMergeInputSchema,
    outputSchema: IntelligentMergeOutputSchema,
  },
  async input => {
    // For now, the flow uses the globally configured model in genkit.ts.
    // Future work: Dynamically select model/plugins based on input settings, including API keys
    // and specific model names for Gemini, OpenRouter, HuggingFace, Ollama, Llamafile.
    // This includes handling 'llamafile' by potentially invoking a local Llamafile executable
    // or 'ollama' by making requests to a local Ollama server via a custom Genkit tool/action.
    // API keys and model IDs (e.g., input.geminiMainModelName) are available here for such logic.
    const {output} = await prompt(input);
    return output!;
  }
);

