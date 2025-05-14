
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

const ApiModelSchema = z.enum(['gemini', 'openrouter', 'huggingface']).optional();

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
  mainApiModel: ApiModelSchema.describe('The main API model to use for generation.'),
  useCustomReasoningModel: z.boolean().optional().describe('Whether to use a custom reasoning model.'),
  reasoningApiModel: ApiModelSchema.describe('The API model to use for reasoning tasks, if useCustomReasoningModel is true.'),
  useCustomCodingModel: z.boolean().optional().describe('Whether to use a custom coding model.'),
  codingApiModel: ApiModelSchema.describe('The API model to use for coding tasks, if useCustomCodingModel is true.'),
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

// TODO: Update prompt and flow logic to actually use the different model choices (mainApiModel, reasoningApiModel, codingApiModel)
// This currently only passes them through but doesn't change Genkit's model behavior.
const prompt = ai.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software engineer specializing in merging codebases from multiple GitHub repositories.

You will analyze the codebases from the following repositories, resolve any conflicts, integrate their functionalities, and create a unified project.

Repositories:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language: {{{targetLanguage}}}
Main Model: {{{mainApiModel}}}
{{#if useCustomReasoningModel}}Reasoning Model: {{{reasoningApiModel}}}{{/if}}
{{#if useCustomCodingModel}}Coding Model: {{{codingApiModel}}}{{/if}}

Instructions: {{{instructions}}}

Provide the complete, working, and fully functional merged codebase, as well as a summary of the merging process, including conflict resolution and integration strategies.

Make sure all external dependancies are resolved correctly, and the merged codebase is fully functional.


Merged Codebase:`, // Prompt should request the merged code
});

const intelligentMergeFlow = ai.defineFlow(
  {
    name: 'intelligentMergeFlow',
    inputSchema: IntelligentMergeInputSchema,
    outputSchema: IntelligentMergeOutputSchema,
  },
  async input => {
    // For now, the flow uses the globally configured model in genkit.ts.
    // Future work: Dynamically select model/plugins based on input.mainApiModel, input.reasoningApiModel, etc.
    // This might involve conditional logic to call different prompts or Genkit configurations.
    // For example:
    // if (input.mainApiModel === 'openrouter') { /* use OpenRouter configured model */ }
    // else if (input.mainApiModel === 'huggingface') { /* use HuggingFace configured model */ }
    // else { /* use default Gemini model */ }
    // Similar logic would be needed for reasoning and coding models if they are to use different APIs.
    // The current prompt template includes these model choices for visibility, but they don't alter execution path yet.
    const {output} = await prompt(input);
    return output!;
  }
);

