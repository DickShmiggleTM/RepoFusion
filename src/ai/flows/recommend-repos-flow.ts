
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

  // These are for contextual awareness in the prompt, not direct use in this simple flow
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
  name: z.string().describe('The name of the GitHub repository (e.g., "Next.js").'),
  url: z.string().describe('The full HTTPS URL of the GitHub repository (e.g., "https://github.com/vercel/next.js").'), // .url() removed due to API compatibility
  reason: z.string().describe('A brief (1-2 sentence) explanation of why this repository is recommended based on the request.'),
});

const RecommendReposOutputSchema = z.object({
  recommendations: z.array(RecommendedRepoSchema).length(5).describe('A list of exactly 5 recommended GitHub repositories, each with a name, full GitHub URL, and a reason.'),
});
export type RecommendReposOutput = z.infer<typeof RecommendReposOutputSchema>;

const defineRecommendReposPrompt = (aiInstance: typeof globalAi) => aiInstance.definePrompt({
  name: 'recommendReposPrompt',
  input: {schema: RecommendReposInputSchema},
  output: {schema: RecommendReposOutputSchema},
  prompt: `You are an AI assistant specialized in recommending GitHub repositories. Your goal is to suggest exactly 5 repositories.

Current Model Configuration (for your context, this is the main model you are currently using):
- Main Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}- Ollama Model: {{{ollamaMainModelName}}} (Base name: {{ollamaMainModelName.split(':')[0]}}){{/if}}
{{#if geminiMainModelName}}- Gemini Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}- OpenRouter Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}- HuggingFace Model: {{{huggingfaceMainModelName}}}{{/if}}
{{#if llamafilePath}}- Llamafile Path: {{{llamafilePath}}}{{/if}}

Recommendation Mode: {{{mode}}}

{{#if promptDescription}}
User's Project Description/Goal:
"{{{promptDescription}}}"
Based on this description, please recommend 5 GitHub repositories that would be relevant, potentially compatible for merging, or offer diverse functionalities related to the prompt. For each repository, provide its name, full HTTPS GitHub URL, and a brief reason for your recommendation. Ensure the URLs are valid and point to actual GitHub repositories.
{{else}}
Please provide a general recommendation of 5 GitHub repositories. These repositories should be chosen for their potential compatibility for merging together to create an interesting or useful application, and for their variation in functionality. For example, one could be a UI library, another a backend framework, another a data visualization tool, etc. For each repository, provide its name, full HTTPS GitHub URL, and a brief reason for your recommendation. Ensure the URLs are valid and point to actual GitHub repositories.
{{/if}}

Ensure you provide exactly 5 recommendations. Each recommendation MUST include:
1.  'name': The repository name.
2.  'url': The full HTTPS GitHub URL.
3.  'reason': A concise reason for the recommendation.
Adhere strictly to the JSON output schema.
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
    let baseModelName: string | undefined = undefined;


    if (input.mainApiModel === 'gemini' && input.geminiApiKey && input.geminiMainModelName) {
      console.log(`RecommendRepos: Using user-provided Gemini API key for model: ${input.geminiMainModelName}`);
      try {
        const geminiPluginWithKey = googleAI({ apiKey: input.geminiApiKey });
        currentAi = genkit({ plugins: [geminiPluginWithKey], logLevel: 'warn', flowId: 'recommendReposFlow-gemini-customKey' });
        configuredPrompt = defineRecommendReposPrompt(currentAi);
        modelToUse = `googleai/${input.geminiMainModelName}`;
      } catch (e) {
        console.error("RecommendRepos: Failed to initialize temporary Genkit instance with user's Gemini key.", e);
        currentAi = globalAi;
        configuredPrompt = defineRecommendReposPrompt(currentAi);
        modelToUse = `googleai/${input.geminiMainModelName}`;
      }
    } else if (input.mainApiModel === 'gemini' && input.geminiMainModelName) {
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'ollama' && input.ollamaMainModelName) {
      baseModelName = input.ollamaMainModelName.split(':')[0]; // Strip tag
      modelToUse = `ollama/${baseModelName}`;
      console.warn(`RecommendRepos: Ollama model selected: ${input.ollamaMainModelName}. Using base name for Genkit: ${baseModelName}. Ensure Genkit is configured with an Ollama plugin (see src/ai/genkit.ts) and the model is available locally.`);
    } else if (input.mainApiModel === 'openrouter' && input.openrouterMainModelName) {
      modelToUse = `openrouter/${input.openrouterMainModelName}`;
      console.warn("RecommendRepos: OpenRouter model selected. Ensure Genkit is configured with an OpenRouter plugin and API key (see src/ai/genkit.ts) for this to work.");
    } else if (input.mainApiModel === 'huggingface' && input.huggingfaceMainModelName) {
      modelToUse = `huggingface/${input.huggingfaceMainModelName}`;
      console.warn("RecommendRepos: HuggingFace model selected. Ensure Genkit is configured with a HuggingFace plugin and API key (see src/ai/genkit.ts) for this to work.");
    } else if (input.mainApiModel === 'llamafile') {
      console.warn("RecommendRepos: Llamafile selected as main model. Using default model for generation. Ensure Llamafile is running and accessible if Genkit is configured for it. Llamafile path available in prompt context.");
    }
    
    const {output} = await configuredPrompt(input, modelToUse ? { model: modelToUse } : undefined);
    
    // Robust output validation
    if (!output || !output.recommendations) {
      throw new Error('AI did not return a valid recommendations structure. Please try again or check model output format instructions.');
    }
    if (output.recommendations.length !== 5) {
      throw new Error(`AI did not return exactly 5 recommendations. Received ${output.recommendations.length}. Expected 5.`);
    }

    for (const repo of output.recommendations) {
        if (!repo || typeof repo !== 'object') {
          throw new Error('Invalid item in "recommendations" array: Expected repository objects.');
        }
        if (typeof repo.name !== 'string' || !repo.name.trim()) {
            throw new Error('Invalid repository object in AI output: "name" must be a non-empty string.');
        }
        if (typeof repo.url !== 'string' || !repo.url.trim()) {
            throw new Error(`Invalid repository object for "${repo.name}": "url" must be a non-empty string.`);
        }
        // Basic URL validation
        if (!repo.url.startsWith('http://') && !repo.url.startsWith('https://')) {
            throw new Error(`Invalid URL format for repository "${repo.name}": ${repo.url}. Must be a full HTTP or HTTPS URL.`);
        }
         // Basic check for GitHub URL structure (can be improved)
        if (!/github\.com\/[^/]+\/[^/]+/.test(repo.url)) {
            console.warn(`URL for "${repo.name}" (${repo.url}) does not strictly match 'github.com/owner/repo' pattern, but proceeding.`);
            // Consider if this should be a stricter error based on requirements.
        }
        if (typeof repo.reason !== 'string' || !repo.reason.trim()) {
            throw new Error(`Invalid repository object for "${repo.name}": "reason" must be a non-empty string.`);
        }
    }
    return output;
  }
);

export async function recommendRepos(input: RecommendReposInput): Promise<RecommendReposOutput> {
  return recommendReposFlow(input);
}

