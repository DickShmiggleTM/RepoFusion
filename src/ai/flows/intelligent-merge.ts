
'use server';

/**
 * @fileOverview An AI agent for intelligently merging multiple GitHub repositories.
 *
 * - intelligentMerge - A function that handles the merging of codebases.
 * - IntelligentMergeInput - The input type for the intelligentMerge function.
 * - IntelligentMergeOutput - The return type for the intelligentMerge function.
 */

import {ai as globalAi} from '@/ai/genkit';
import {genkit, type ModelArgument} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const ApiModelTypeSchema = z.enum(['gemini', 'openrouter', 'huggingface', 'llamafile', 'ollama']).optional();

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
  
  llamafilePath: z.string().optional().describe('Path or URL to the Llamafile, if selected for any model type.'),
  geminiApiKey: z.string().optional().describe('API Key for Gemini (Google AI).'),
  openrouterApiKey: z.string().optional().describe('API Key for OpenRouter.'),
  huggingfaceApiKey: z.string().optional().describe('API Key for HuggingFace.'),
});
export type IntelligentMergeInput = z.infer<typeof IntelligentMergeInputSchema>;

const FileSchema = z.object({
  path: z.string().describe('The full path of the file, including directories and extension (e.g., src/utils/helpers.ts).'),
  content: z.string().describe('The complete content of the file.'),
});

const IntelligentMergeOutputSchema = z.object({
  files: z.array(FileSchema).describe('An array of file objects representing the conceptually merged codebase. Focus on key files and structure. Provide a reasonable number of files for a prototype (e.g., 5-10 critical files).'),
  summary: z
    .string()
    .describe(
      'A comprehensive summary of the conceptual merging process, including analysis of the repositories, proposed integration strategies, potential challenges, and hypothetical conflict resolution approaches.'
    ),
});
export type IntelligentMergeOutput = z.infer<typeof IntelligentMergeOutputSchema>;

// This prompt definition is now a template function to allow dynamic AI instance
const defineIntelligentMergePrompt = (aiInstance: typeof globalAi) => aiInstance.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software engineer specializing in conceptualizing and planning the merger of codebases from multiple GitHub repositories. Your goal is to act as an AI consultant providing a detailed plan and a multi-file conceptual prototype.

You will analyze the potential integration of the codebases from the following repositories:
Repositories:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language (if specified, otherwise infer or use primary language of repos): {{#if targetLanguage}}{{{targetLanguage}}}{{else}}Not specified{{/if}}

Additional Instructions from User: {{#if instructions}}{{{instructions}}}{{else}}No additional instructions provided.{{/if}}

Your task is to generate a conceptual multi-file prototype and a summary. The user has indicated preferred AI toolchain settings below for your contextual awareness. You should perform the task using your current capabilities to the best of your ability.

User's Preferred AI Toolchain Configuration:
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
- Reasoning Model: Using Main Generation Model configuration.
{{/if}}

{{#if useCustomCodingModel}}
- Coding Model Type: {{{codingApiModel}}}
{{#if ollamaCodingModelName}}  - Ollama Coding Model: {{{ollamaCodingModelName}}}{{/if}}
{{#if geminiCodingModelName}}  - Gemini Coding Model: {{{geminiCodingModelName}}}{{/if}}
{{#if openrouterCodingModelName}}  - OpenRouter Coding Model: {{{openrouterCodingModelName}}}{{/if}}
{{#if huggingfaceCodingModelName}}  - HuggingFace Coding Model: {{{huggingfaceCodingModelName}}}{{/if}}
{{else}}
- Coding Model: Using Main Generation Model configuration.
{{/if}}

{{#if llamafilePath}}Llamafile Path (if Llamafile selected for any model): {{{llamafilePath}}}{{/if}}

API Keys Provided by User (for context only - your ability to use these depends on pre-configured Genkit plugins):
- Gemini Key: {{#if geminiApiKey}}Yes{{else}}No{{/if}}
- OpenRouter Key: {{#if openrouterApiKey}}Yes{{else}}No{{/if}}
- HuggingFace Key: {{#if huggingfaceApiKey}}Yes{{else}}No{{/if}}

Task:
Your goal is to provide a conceptual plan and a multi-file prototype for merging the specified repositories.

For the "files" output field (this should be an array of file objects):
1.  Propose a sensible file and directory structure for the merged project.
2.  Generate a representative set of key files (e.g., 5-10 critical files) for this structure. For each file, provide:
    a.  A 'path' (e.g., "src/components/MyComponent.tsx", "server/api/routes.js", "README.md").
    b.  'content' (the actual textual code or content for that file).
3.  The content of these files should demonstrate how critical functionalities from different repositories might be integrated or how new shared components might look.
4.  If there are UI components, describe their conceptual integration through file content.
5.  This output is for a prototype. It is NOT expected to be a complete, directly runnable, or fully functional codebase but should provide a strong conceptual and structural foundation.

For the "summary" output field:
1.  Provide a comprehensive summary of your conceptual merging process.
2.  Analyze the provided repositories: their primary languages, frameworks, and key features.
3.  Describe the proposed integration strategies for core functionalities.
4.  Identify potential challenges (e.g., version conflicts, differing architectures, overlapping features).
5.  Explain hypothetical conflict resolution strategies you would employ.
6.  Outline the main steps involved in this conceptual merge.
7.  Explain the rationale behind your proposed merged structure and integration choices.

Ensure your entire response strictly adheres to the JSON schema for the output, providing content for both 'files' and 'summary' fields.
The 'files' array should not be empty if a merge is deemed possible.
`,
});

const intelligentMergeFlow = globalAi.defineFlow(
  {
    name: 'intelligentMergeFlow',
    inputSchema: IntelligentMergeInputSchema,
    outputSchema: IntelligentMergeOutputSchema,
  },
  async (input) => {
    let currentAi = globalAi;
    let configuredPrompt = defineIntelligentMergePrompt(currentAi);
    let modelToUse: ModelArgument | undefined = undefined;

    if (input.mainApiModel === 'gemini' && input.geminiApiKey && input.geminiMainModelName) {
      console.log(`Using user-provided Gemini API key for model: ${input.geminiMainModelName}`);
      const geminiPluginWithKey = googleAI({ apiKey: input.geminiApiKey });
      currentAi = genkit({ plugins: [geminiPluginWithKey],
        // Ensure some log level, as it might default to none otherwise in temp instance
        logLevel: 'warn', 
        // This flowId can help in tracing if needed
        flowId: 'intelligentMergeFlow-gemini-customKey' 
      }); 
      configuredPrompt = defineIntelligentMergePrompt(currentAi); // Re-define prompt with this AI instance
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'gemini' && input.geminiMainModelName) {
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'ollama' && input.ollamaMainModelName) {
      modelToUse = `ollama/${input.ollamaMainModelName}`;
      console.warn("Ollama model selected. Ensure Genkit is configured with an Ollama plugin for this to work.");
    } else if (input.mainApiModel === 'openrouter' && input.openrouterMainModelName) {
      modelToUse = `openrouter/${input.openrouterMainModelName}`;
      console.warn("OpenRouter model selected. Ensure Genkit is configured with an OpenRouter plugin for this to work.");
    } else if (input.mainApiModel === 'huggingface' && input.huggingfaceMainModelName) {
      modelToUse = `huggingface/${input.huggingfaceMainModelName}`;
      console.warn("HuggingFace model selected. Ensure Genkit is configured with a HuggingFace plugin for this to work.");
    } else if (input.mainApiModel === 'llamafile') {
      console.warn("Llamafile selected as main model. Direct generation with Llamafile as the primary model via 'model' parameter is not standard. Using default model for generation. Llamafile path is available in prompt context.");
      // modelToUse will remain undefined, relying on prompt's default or global default
    }

    const {output} = await configuredPrompt(input, modelToUse ? { model: modelToUse } : undefined);
    
    if (!output) {
      throw new Error('The AI model did not return a valid output. Please try again.');
    }
    if (!Array.isArray(output.files) || typeof output.summary !== 'string') {
        throw new Error('The AI model returned an invalid data structure. Expected an array for "files" and a string for "summary".');
    }
    if (output.files.length > 0) {
      for (const file of output.files) {
        if (typeof file.path !== 'string' || typeof file.content !== 'string') {
          throw new Error('Invalid file object structure in AI output. Each file must have a string "path" and "content".');
        }
      }
    }
    return output;
  }
);

export async function intelligentMerge(input: IntelligentMergeInput): Promise<IntelligentMergeOutput> {
  return intelligentMergeFlow(input);
}
