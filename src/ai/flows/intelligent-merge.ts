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
    .describe('The target programming language for the merged codebase. (e.g., TypeScript, Python)'),
  instructions: z
    .string()
    .optional()
    .describe('Additional instructions for the merging process, such as specific features to prioritize, architectural patterns to follow, or conflicts to resolve in a certain way.'),
  
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
  path: z.string().describe('The full path of the file, including directories and extension (e.g., src/utils/helpers.ts, package.json, README.md). Ensure standard naming conventions for common file types are used.'),
  content: z.string().describe('The complete textual content of the file. This should be the actual code, configuration, or markdown.'),
});

const IntelligentMergeOutputSchema = z.object({
  files: z.array(FileSchema).describe("An array of file objects representing the conceptually merged codebase. This should provide a structured, multi-file prototype. Focus on key files and overall structure (e.g., 5-15 critical files that demonstrate the merge concept). If a target language is specified, include common boilerplate files (e.g., package.json, tsconfig.json for TypeScript; requirements.txt for Python)."),
  summary: z
    .string()
    .describe(
      'A comprehensive summary of the conceptual merging process. Detail the analysis of the source repositories, proposed integration strategies, key functionalities merged, potential challenges (e.g., differing architectures, dependency conflicts), and the rationale behind the proposed merged file structure and integration choices.'
    ),
});
export type IntelligentMergeOutput = z.infer<typeof IntelligentMergeOutputSchema>;

// This prompt definition is now a template function to allow dynamic AI instance
const defineIntelligentMergePrompt = (aiInstance: typeof globalAi) => aiInstance.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software architect and engineer tasked with conceptualizing and planning the merger of codebases from multiple GitHub repositories. Your output will be a conceptual multi-file prototype and a detailed summary.

Analyze the provided repositories:
Repositories:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language for Merged Project (if specified, otherwise infer or use primary language of repos): {{#if targetLanguage}}{{{targetLanguage}}}{{else}}Not specified{{/if}}

User's Additional Instructions: {{#if instructions}}{{{instructions}}}{{else}}No additional instructions provided.{{/if}}

User's Preferred AI Toolchain Configuration (for your contextual awareness only; perform the task using your current capabilities):
- Main Generation Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}  - Ollama Main Model: {{{ollamaMainModelName}}} (Base name: {{{ollamaMainModelName}}}){{/if}}
{{#if geminiMainModelName}}  - Gemini Main Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}  - OpenRouter Main Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}  - HuggingFace Main Model: {{{huggingfaceMainModelName}}}{{/if}}

{{#if useCustomReasoningModel}}
- Reasoning Model Type: {{{reasoningApiModel}}}
{{#if ollamaReasoningModelName}}  - Ollama Reasoning Model: {{{ollamaReasoningModelName}}} (Base name: {{{ollamaReasoningModelName}}}){{/if}}
{{#if geminiReasoningModelName}}  - Gemini Reasoning Model: {{{geminiReasoningModelName}}}{{/if}}
{{#if openrouterReasoningModelName}}  - OpenRouter Reasoning Model: {{{openrouterReasoningModelName}}}{{/if}}
{{#if huggingfaceReasoningModelName}}  - HuggingFace Reasoning Model: {{{huggingfaceReasoningModelName}}}{{/if}}
{{else}}
- Reasoning Model: Using Main Generation Model configuration.
{{/if}}

{{#if useCustomCodingModel}}
- Coding Model Type: {{{codingApiModel}}}
{{#if ollamaCodingModelName}}  - Ollama Coding Model: {{{ollamaCodingModelName}}} (Base name: {{{ollamaCodingModelName}}}){{/if}}
{{#if geminiCodingModelName}}  - Gemini Coding Model: {{{geminiCodingModelName}}}{{/if}}
{{#if openrouterCodingModelName}}  - OpenRouter Coding Model: {{{openrouterCodingModelName}}}{{/if}}
{{#if huggingfaceCodingModelName}}  - HuggingFace Coding Model: {{{huggingfaceCodingModelName}}}{{/if}}
{{else}}
- Coding Model: Using Main Generation Model configuration.
{{/if}}

{{#if llamafilePath}}Llamafile Path (if Llamafile selected for any model): {{{llamafilePath}}}{{/if}}

API Keys Provided by User (for context only):
- Gemini Key: {{#if geminiApiKey}}Provided{{else}}Not provided{{/if}}
- OpenRouter Key: {{#if openrouterApiKey}}Provided{{else}}Not provided{{/if}}
- HuggingFace Key: {{#if huggingfaceApiKey}}Provided{{else}}Not provided{{/if}}

Your Task:
1.  **Conceptual Merge Plan & Multi-File Prototype (Field: "files"):**
    a.  First, analyze the input repositories to understand their languages, frameworks, and core functionalities.
    b.  Propose a sensible file and directory structure for the merged project. This structure should be logical and follow common conventions for the target language/framework.
    c.  Generate a representative set of key files (e.g., 5-15 critical files) for this structure.
    d.  For each file, provide:
        i.  A 'path' (e.g., "src/components/MyComponent.tsx", "server/api/routes.js", "package.json", "README.md"). Use standard naming conventions.
        ii. 'content' (the actual textual code, configuration, or markdown for that file).
    e.  The content should demonstrate how core functionalities from different repositories might be integrated, how new shared components might look, or essential boilerplate for the target technology stack.
    f.  If a 'targetLanguage' is specified (e.g., "TypeScript", "Python"), ensure you include common boilerplate files (e.g., a basic 'package.json' and 'tsconfig.json' for TypeScript/Node.js; 'requirements.txt' or 'pyproject.toml' for Python).
    g.  This output is for a prototype. It's NOT expected to be a complete, immediately runnable, or exhaustive codebase but should provide a strong conceptual and structural foundation.

2.  **Comprehensive Summary (Field: "summary"):**
    a.  Provide a detailed summary of your conceptual merging process.
    b.  Explain your analysis of the source repositories (languages, frameworks, key features).
    c.  Describe the proposed integration strategies for core functionalities.
    d.  Identify potential challenges (e.g., version conflicts, differing architectures, overlapping features, dependency complexities).
    e.  Explain hypothetical conflict resolution strategies.
    f.  Outline the main steps involved in this conceptual merge.
    g.  Justify the rationale behind your proposed merged file structure and integration choices.

Ensure your entire response strictly adheres to the JSON schema for the output, providing content for both 'files' and 'summary' fields. The 'files' array should not be empty if a merge is deemed possible.
Each file object in the 'files' array must have a 'path' (string) and 'content' (string).
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
    let baseModelName: string | undefined = undefined;

    if (input.mainApiModel === 'gemini' && input.geminiApiKey && input.geminiMainModelName) {
      console.log(`IntelligentMerge: Using user-provided Gemini API key for model: ${input.geminiMainModelName}`);
      try {
        const geminiPluginWithKey = googleAI({ apiKey: input.geminiApiKey });
        currentAi = genkit({ plugins: [geminiPluginWithKey],
          logLevel: 'warn', 
          flowId: 'intelligentMergeFlow-gemini-customKey' 
        }); 
        configuredPrompt = defineIntelligentMergePrompt(currentAi); 
        modelToUse = `googleai/${input.geminiMainModelName}`;
      } catch (e) {
        console.error("IntelligentMerge: Failed to initialize temporary Genkit instance with user's Gemini key.", e);
        // Fallback to default Genkit instance if custom key init fails
        currentAi = globalAi; // Reset to global AI
        configuredPrompt = defineIntelligentMergePrompt(currentAi); // Re-define prompt with global AI
        modelToUse = `googleai/${input.geminiMainModelName}`;
      }
    } else if (input.mainApiModel === 'gemini' && input.geminiMainModelName) {
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'ollama' && input.ollamaMainModelName) {
      baseModelName = input.ollamaMainModelName.split(':')[0];
      modelToUse = `ollama/${baseModelName}`;
      console.warn(`IntelligentMerge: Ollama model selected: ${input.ollamaMainModelName}. Using base name for Genkit: ${baseModelName}. Ensure Genkit is configured with an Ollama plugin.`);
    } else if (input.mainApiModel === 'openrouter' && input.openrouterMainModelName) {
      modelToUse = `openrouter/${input.openrouterMainModelName}`;
      console.warn("IntelligentMerge: OpenRouter model selected. Ensure Genkit is configured with an OpenRouter plugin for this to work.");
    } else if (input.mainApiModel === 'huggingface' && input.huggingfaceMainModelName) {
      modelToUse = `huggingface/${input.huggingfaceMainModelName}`;
      console.warn("IntelligentMerge: HuggingFace model selected. Ensure Genkit is configured with a HuggingFace plugin for this to work.");
    } else if (input.mainApiModel === 'llamafile') {
      console.warn("IntelligentMerge: Llamafile selected as main model. Using default model for generation. Llamafile path is available in prompt context.");
      // No specific modelToUse is set here, relying on default or prompt-defined model.
    }

    const {output} = await configuredPrompt(input, modelToUse ? { model: modelToUse } : undefined);
    
    if (!output) {
      throw new Error('The AI model did not return a valid output. Please try again with a more specific prompt or check model availability.');
    }
    if (typeof output.summary !== 'string' || !output.summary.trim()) {
        throw new Error('The AI model returned an invalid or empty summary. Please refine your request.');
    }
    if (!Array.isArray(output.files)) {
        throw new Error('The AI model returned an invalid data structure for "files". Expected an array.');
    }
    
    if (output.files.length > 0) {
      for (const file of output.files) {
        if (typeof file.path !== 'string' || !file.path.trim()) {
          throw new Error('Invalid file object in AI output: "path" must be a non-empty string.');
        }
        if (typeof file.content !== 'string') { 
          throw new Error(`Invalid file object in AI output for path "${file.path}": "content" must be a string.`);
        }
      }
    }
    return output;
  }
);

export async function intelligentMerge(input: IntelligentMergeInput): Promise<IntelligentMergeOutput> {
  return intelligentMergeFlow(input);
}
