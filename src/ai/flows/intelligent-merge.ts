
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
    .describe(
      'A textual representation of the merged codebase structure, key integrated snippets, or a high-level conceptual overview suitable for a prototype. This is not expected to be a directly compilable/runnable complete codebase.'
    ),
  summary: z
    .string()
    .describe(
      'A comprehensive summary of the conceptual merging process, including analysis of the repositories, proposed integration strategies, potential challenges, and hypothetical conflict resolution approaches.'
    ),
});
export type IntelligentMergeOutput = z.infer<typeof IntelligentMergeOutputSchema>;

export async function intelligentMerge(input: IntelligentMergeInput): Promise<IntelligentMergeOutput> {
  return intelligentMergeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software engineer specializing in conceptualizing and planning the merger of codebases from multiple GitHub repositories. Your goal is to act as an AI consultant providing a detailed plan and conceptual output for a prototype.

You will analyze the potential integration of the codebases from the following repositories:
Repositories:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language (if specified, otherwise infer or use primary language of repos): {{#if targetLanguage}}{{{targetLanguage}}}{{else}}Not specified{{/if}}

Additional Instructions from User: {{#if instructions}}{{{instructions}}}{{else}}No additional instructions provided.{{/if}}

User's Preferred AI Toolchain (for your contextual awareness - perform the task using your current capabilities):
- Main Generation Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}  - Ollama Main Model: {{{ollamaMainModelName}}}{{/if}}
{{#if geminiMainModelName}}  - Gemini Main Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}  - OpenRouter Main Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}  - HuggingFace Main Model: {{{huggingfaceMainModelName}}}{{/if}}

{{#if useCustomReasoningModel}}
- Reasoning Model Type: {{{reasoningApiModel}}}
{{#if ollamaReasoningModelName}}  - Ollama Reasoning Model: {{{ollamaReasoningModelName}}}{{/if}}
{{#if geminiReasoningModelName}}  - Gemini Reasoning Model: {{{geminiReasoningModelName}}}{{/if}}
{{#if openrouterReasoningModelName}}  - OpenRouter Reasoning Model: {{{openrouterReasoningModelName}}}{{/if}}
{{#if huggingfaceReasoningModelName}}  - HuggingFace Reasoning Model: {{{huggingfaceReasoningModelName}}}{{/if}}
{{else}}
- Reasoning Model: Using Main Generation Model.
{{/if}}

{{#if useCustomCodingModel}}
- Coding Model Type: {{{codingApiModel}}}
{{#if ollamaCodingModelName}}  - Ollama Coding Model: {{{ollamaCodingModelName}}}{{/if}}
{{#if geminiCodingModelName}}  - Gemini Coding Model: {{{geminiCodingModelName}}}{{/if}}
{{#if openrouterCodingModelName}}  - OpenRouter Coding Model: {{{openrouterCodingModelName}}}{{/if}}
{{#if huggingfaceCodingModelName}}  - HuggingFace Coding Model: {{{huggingfaceCodingModelName}}}{{/if}}
{{else}}
- Coding Model: Using Main Generation Model.
{{/if}}

{{#if llamafilePath}}Llamafile Path (if Llamafile selected for any model): {{{llamafilePath}}}{{/if}}

API Keys Provided by User (for context only):
- Gemini Key: {{#if geminiApiKey}}Yes{{else}}No{{/if}}
- OpenRouter Key: {{#if openrouterApiKey}}Yes{{else}}No{{/if}}
- HuggingFace Key: {{#if huggingfaceApiKey}}Yes{{else}}No{{/if}}

Task:
Your goal is to provide a conceptual plan and representative output for merging the specified repositories.

For the "mergedCodebase" output field (this should be a single string containing the textual representation):
1.  Provide a high-level overview of the proposed file/directory structure for the merged project (e.g., using ASCII tree format or clear descriptions).
2.  Include key example code snippets (text) demonstrating how critical functionalities from different repositories might be integrated. Focus on one or two important integration points.
3.  If there are UI components, describe their conceptual integration.
4.  This output should be a textual representation suitable for a prototype. It is NOT expected to be a complete, directly runnable, or fully functional codebase.

For the "summary" output field:
1.  Provide a comprehensive summary of your conceptual merging process.
2.  Analyze the provided repositories: their primary languages, frameworks, and key features.
3.  Describe the proposed integration strategies for core functionalities.
4.  Identify potential challenges (e.g., version conflicts, differing architectures, overlapping features).
5.  Explain hypothetical conflict resolution strategies you would employ.
6.  Outline the main steps involved in this conceptual merge.
7.  Explain the rationale behind your proposed merged structure and integration choices.

Ensure your entire response strictly adheres to the JSON schema for the output, providing content for both 'mergedCodebase' and 'summary' fields.
`,
});

const intelligentMergeFlow = ai.defineFlow(
  {
    name: 'intelligentMergeFlow',
    inputSchema: IntelligentMergeInputSchema,
    outputSchema: IntelligentMergeOutputSchema,
  },
  async input => {
    // The current Genkit setup uses a globally configured AI model (from src/ai/genkit.ts).
    // The detailed model configuration and API keys from the input are passed to the AI
    // for contextual awareness, as instructed in the prompt.
    // Future enhancements could involve dynamically selecting and configuring Genkit plugins
    // or tools based on these inputs, which would be a significant backend change.
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid output. Please try again.');
    }
    if (typeof output.mergedCodebase !== 'string' || typeof output.summary !== 'string') {
        throw new Error('The AI model returned an invalid data structure. Expected string for mergedCodebase and summary.');
    }
    return output;
  }
);

