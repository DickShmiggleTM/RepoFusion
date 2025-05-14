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

Target Language: {{{targetLanguage}}}

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
    const {output} = await prompt(input);
    return output!;
  }
);
