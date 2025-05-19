
'use server';

/**
 * @fileOverview An AI agent for intelligently merging multiple GitHub repositories.
 *
 * - intelligentMerge - A function that handles the merging of codebases.
 * - IntelligentMergeInput - The input type for the intelligentMerge function.
 * - IntelligentMergeOutput - The return type for the intelligentMerge function.
 */

import ai from '@/hooks/useGenkit';
import {genkit, type ModelArgument, type PluginProvider} from 'genkit';
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
    .describe('The target programming language for the merged codebase (e.g., TypeScript, Python). This helps in generating appropriate boilerplate and project structure.'),
  instructions: z
    .string()
    .optional()
    .describe('Additional instructions for the merging process, such as specific features to prioritize from certain repos, architectural patterns to follow (e.g., microservices, monolith), or how to handle potential conflicts between similar functionalities.'),

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
  path: z.string().describe("The full path of the file, including directories and extension (e.g., 'src/utils/helpers.ts', 'package.json', 'README.md'). Ensure standard naming conventions for common file types are used. Paths should be relative to the project root."),
  content: z.string().describe("The complete textual content of the file. This should be the actual code, configuration, or markdown, aiming for functional and well-structured content. Avoid placeholder comments like 'TODO' where actual implementation details are expected."),
});

const IntelligentMergeOutputSchema = z.object({
  files: z.array(FileSchema).describe("An array of file objects representing the conceptually merged codebase. This should form a highly structured, comprehensive, multi-file conceptual prototype aiming for a deep and broad demonstration of how significant features from all input repositories might be integrated. For complex projects, this could conceptually involve up to 500 files, but prioritize structural integrity, logical organization, and meaningful conceptual content for each file over sheer quantity. If a 'targetLanguage' is specified, ensure common boilerplate files (e.g., 'package.json', 'tsconfig.json' for TypeScript; 'requirements.txt', 'pyproject.toml' for Python) are included with relevant (even if conceptual) dependencies and configurations. Focus on creating a representative skeleton of a potentially complex application, detailing key modules, services, configurations, API routes, UI components, and core logic integrations."),
  summary: z
    .string()
    .describe(
      "A comprehensive summary detailing the analysis of the source repositories, the proposed integration strategy for significant features from ALL input repositories, the architectural design of the merged application, potential challenges (and how they were conceptually addressed in the prototype), and the rationale behind the proposed merged file structure and integration choices. This summary should clearly explain how the generated files form a cohesive and robust conceptual application."
    ),
});
export type IntelligentMergeOutput = z.infer<typeof IntelligentMergeOutputSchema>;

const defineIntelligentMergePrompt = (aiInstance: typeof ai | ReturnType<typeof genkit>) => aiInstance.definePrompt({
  name: 'intelligentMergePrompt',
  input: {schema: IntelligentMergeInputSchema},
  output: {schema: IntelligentMergeOutputSchema},
  prompt: `You are an expert software architect and AI engineer tasked with conceptualizing and planning the merger of codebases from multiple GitHub repositories. Your goal is to produce a highly detailed, robust, and exceptionally comprehensive multi-file conceptual prototype and a detailed summary of your plan. The prototype must demonstrate how significant features from ALL provided repositories can be integrated into a cohesive new application.

Source Repositories to Analyze:
{{#each repositoryUrls}}- {{{this}}}
{{/each}}

Target Language for Merged Project (if specified, otherwise infer or use primary language of repos): {{#if targetLanguage}}{{{targetLanguage}}}{{else}}Not specified{{/if}}

User's Additional Instructions: {{#if instructions}}{{{instructions}}}{{else}}No additional instructions provided.{{/if}}

User's Preferred AI Toolchain Configuration (This is for your contextual awareness. You will perform the task using your current model capabilities. The user is aware that Genkit backend plugins and API keys must be configured for non-Gemini models to be used for actual generation.):
- Main Generation Model Type: {{{mainApiModel}}}
{{#if ollamaMainModelName}}  - Ollama Main Model: {{{ollamaMainModelName}}} {{#if ollamaBaseMainModelName}}(Base name for Genkit: {{ollamaBaseMainModelName}}){{/if}}{{/if}}
{{#if geminiMainModelName}}  - Gemini Main Model: {{{geminiMainModelName}}}{{/if}}
{{#if openrouterMainModelName}}  - OpenRouter Main Model: {{{openrouterMainModelName}}}{{/if}}
{{#if huggingfaceMainModelName}}  - HuggingFace Main Model: {{{huggingfaceMainModelName}}}{{/if}}

{{#if useCustomReasoningModel}}
- Reasoning Model Type: {{{reasoningApiModel}}}
{{#if ollamaReasoningModelName}}  - Ollama Reasoning Model: {{{ollamaReasoningModelName}}} {{#if ollamaBaseReasoningModelName}}(Base name for Genkit: {{ollamaBaseReasoningModelName}}){{/if}}{{/if}}
{{#if geminiReasoningModelName}}  - Gemini Reasoning Model: {{{geminiReasoningModelName}}}{{/if}}
{{#if openrouterReasoningModelName}}  - OpenRouter Reasoning Model: {{{openrouterReasoningModelName}}}{{/if}}
{{#if huggingfaceReasoningModelName}}  - HuggingFace Reasoning Model: {{{huggingfaceReasoningModelName}}}{{/if}}
{{else}}
- Reasoning Model: Using Main Generation Model configuration.
{{/if}}

{{#if useCustomCodingModel}}
- Coding Model Type: {{{codingApiModel}}}
{{#if ollamaCodingModelName}}  - Ollama Coding Model: {{{ollamaCodingModelName}}} {{#if ollamaBaseCodingModelName}}(Base name for Genkit: {{ollamaBaseCodingModelName}}){{/if}}{{/if}}
{{#if geminiCodingModelName}}  - Gemini Coding Model: {{{geminiCodingModelName}}}{{/if}}
{{#if openrouterCodingModelName}}  - OpenRouter Coding Model: {{{openrouterCodingModelName}}}{{/if}}
{{#if huggingfaceCodingModelName}}  - HuggingFace Coding Model: {{{huggingfaceCodingModelName}}}{{/if}}
{{else}}
- Coding Model: Using Main Generation Model configuration.
{{/if}}

{{#if llamafilePath}}Llamafile Path (if Llamafile selected for any model): {{{llamafilePath}}}{{/if}}

API Keys Provided by User (for context only, you will use your configured capabilities. Gemini key might be used dynamically by the backend if 'gemini' is the mainApiModel.):
- Gemini Key: {{#if geminiApiKey}}Provided{{else}}Not provided{{/if}}
- OpenRouter Key: {{#if openrouterApiKey}}Provided{{else}}Not provided{{/if}}
- HuggingFace Key: {{#if huggingfaceApiKey}}Provided{{else}}Not provided{{/if}}

Your Task: Generate a comprehensive, conceptual, multi-file application prototype and a detailed summary.

**Part 1: Comprehensive Analysis and Advanced Merge Plan (Field: "summary")**
   a.  **Deep Source Repository Analysis:** For EACH input repository:
       i.  Identify its primary language, frameworks/major libraries, and core architectural patterns.
       ii. List its 3-5 most significant and unique functionalities/features.
       iii. Briefly assess its code quality, structure, and potential for integration.
   b.  **Synergistic Feature Integration Strategy:**
       i.  Identify specific features from EACH repository that will be integrated into the merged application. Aim for maximum feature retention and synergy.
       ii. Describe, with technical detail, how these diverse features will be combined. For example, if one repo has a robust authentication system and another has a unique data processing pipeline, explain how they would coexist and interact.
       iii. Address potential overlaps or conflicts in features: which version takes precedence, or how they might be harmonized.
   c.  **Robust Architectural Proposal:**
       i.  Propose a high-level architecture for the merged application (e.g., modular monolith, microservices, event-driven). Justify your choice based on the input repositories and the goal of integrating their features.
       ii.  Outline key components/modules and their responsibilities in detail.
       iii. Mention key technologies, design patterns (e.g., CQRS, event sourcing, service discovery if applicable), data management strategies, and potential API designs you envision for this robust application.
   d.  **Challenge Mitigation & Conflict Resolution Strategy:**
       i.  Identify significant potential challenges (e.g., differing architectural styles, complex dependency conflicts, API incompatibilities, data model merging, scaling considerations).
       ii. For each challenge, outline a clear, plausible strategy for how it would be resolved in the conceptual prototype.
   e.  **Rationale for Proposed File Structure:** Explain how the file and directory structure (to be detailed in Part 2) supports the merged functionalities, the proposed architecture, the target language/framework, and scalability. It must be logical and well-justified.

**Part 2: Advanced Conceptual Multi-File Prototype (Field: "files")**
   a.  **File and Directory Structure Definition:** Based on your comprehensive plan, define a logical, scalable, and well-organized file and directory structure. This structure must follow common conventions for the target language/framework (if specified) and be suitable for an advanced, complex application.
   b.  **Key File Generation (Conceptually up to 500 files for highly complex projects, but prioritize quality, structure, and representative examples):**
       i.  Provide an array of file objects. Each object MUST have a 'path' (e.g., "src/modules/auth/auth.service.ts", "src/api/v1/routes/userRoutes.ts", "src/ui/components/DashboardLayout.tsx", "configs/database.config.json", "scripts/deploy.sh", "docs/API.md", "package.json", "README.md") and 'content' (the actual textual code, configuration, or markdown).
       ii. The content for each file should be substantial and representative of the merged concept, demonstrating how functionalities integrate, how new shared components/services might look, how data flows, or key configurations.
       iii. **Boilerplate and Configuration:** If a 'targetLanguage' is specified (e.g., "TypeScript", "Python"), YOU MUST include essential boilerplate files with thoughtful, conceptual content. For example:
           - For TypeScript/Node.js: A detailed 'package.json' (listing key conceptual dependencies like Express, NestJS, ORMs, testing libraries, linters, etc.), a 'tsconfig.json' configured for a modern project, and potentially a basic '.eslintrc.json', 'prettierrc.json', or a conceptual 'Dockerfile'.
           - For Python: A 'requirements.txt' or 'pyproject.toml' (listing key conceptual dependencies like Django, Flask, SQLAlchemy, Pydantic, testing tools, linters), and potentially a basic 'setup.py' or conceptual 'Dockerfile'.
           - For other languages, include equivalent standard project setup files.
       iv. **Core Logic Representation:** Generate code that shows how core functionalities from DIFFERENT repositories might be integrated. For example, if merging an e-commerce backend with a social media platform, show how user profiles might be linked, how product recommendations might appear in a social feed, or how shared data models might be structured.
       v.  **Architectural Components:** Ensure generated files reflect the proposed architecture (e.g., if microservices, show example service definitions, inter-service communication stubs, or API gateway configurations).
       vi. **Avoid Trivial Placeholders:** Do not produce empty files or files with content like "// TODO: Implement". The content should be your best attempt at representing the merged logic, structure, or configuration, even if simplified for a conceptual prototype. It should be rich enough to convey the design.
   c.  **Prototype Nature & Robustness:** This output is for an *advanced conceptual prototype*. While not expected to be immediately runnable without further development, it MUST provide a strong, detailed, and robust structural and conceptual foundation for a complex, feature-rich application. The goal is to generate a comprehensive blueprint.

Ensure your entire response strictly adheres to the JSON schema for the output, providing content for both 'files' (an array of file objects) and 'summary' (a string) fields.
Each file object in the 'files' array must have a 'path' (string) and 'content' (string).
`,
});

const intelligentMergeFlow = ai.defineFlow(
  {
    name: 'intelligentMergeFlow',
    inputSchema: IntelligentMergeInputSchema,
    outputSchema: IntelligentMergeOutputSchema,
  },
  async (input) => {
    let currentAi: typeof ai | ReturnType<typeof genkit> = ai;
    let configuredPrompt = defineIntelligentMergePrompt(currentAi);
    let modelToUse: ModelArgument | undefined = undefined;

    const promptInput: Record<string, any> = { ...input };


    if (input.mainApiModel === 'gemini' && input.geminiApiKey && input.geminiMainModelName) {
      console.log(`IntelligentMerge: Using user-provided Gemini API key for model: ${input.geminiMainModelName}`);
      try {
        const tempGoogleAIPlugin = googleAI({ apiKey: input.geminiApiKey });
        currentAi = genkit({
            plugins: [tempGoogleAIPlugin as PluginProvider],
            logLevel: 'warn',
            flowId: 'intelligentMergeFlow-gemini-customKey'
        });
        configuredPrompt = defineIntelligentMergePrompt(currentAi);
        modelToUse = `googleai/${input.geminiMainModelName}`;
      } catch (e) {
        console.error("IntelligentMerge: Failed to initialize temporary Genkit instance with user's Gemini key. Falling back to global Genkit instance.", e);
        currentAi = ai;
        configuredPrompt = defineIntelligentMergePrompt(currentAi);
        modelToUse = `googleai/${input.geminiMainModelName}`;
      }
    } else if (input.mainApiModel === 'gemini' && input.geminiMainModelName) {
      modelToUse = `googleai/${input.geminiMainModelName}`;
    } else if (input.mainApiModel === 'ollama' && input.ollamaMainModelName) {
      const baseModelName = input.ollamaMainModelName.includes(':') ? input.ollamaMainModelName.split(':')[0] : input.ollamaMainModelName;
      promptInput.ollamaBaseMainModelName = baseModelName;
      modelToUse = `ollama/${baseModelName}`;
      console.warn(`IntelligentMerge: Ollama model selected for main generation: '${input.ollamaMainModelName}'. Using base name for Genkit: '${baseModelName}'.
IMPORTANT: For Ollama to function, ensure the Ollama Genkit plugin is correctly INSTALLED, CONFIGURED, and INITIALIZED in 'src/ai/genkit.ts'. Also, ensure your Ollama server is RUNNING and the model '${baseModelName}' (or the full name including tag) is PULLED and ACCESSIBLE by the plugin.`);
    } else if (input.mainApiModel === 'openrouter' && input.openrouterMainModelName) {
      modelToUse = `openrouter/${input.openrouterMainModelName}`;
      console.warn(`IntelligentMerge: OpenRouter model selected for main generation: '${input.openrouterMainModelName}'.
IMPORTANT: For OpenRouter to function, ensure the OpenRouter Genkit plugin is correctly INSTALLED, CONFIGURED, and INITIALIZED in 'src/ai/genkit.ts', and your OPENROUTER_API_KEY is SET in your '.env' file.`);
    } else if (input.mainApiModel === 'huggingface' && input.huggingfaceMainModelName) {
      modelToUse = `huggingface/${input.huggingfaceMainModelName}`;
      console.warn(`IntelligentMerge: HuggingFace model selected for main generation: '${input.huggingfaceMainModelName}'.
IMPORTANT: For HuggingFace to function, ensure the HuggingFace Genkit plugin is correctly INSTALLED, CONFIGURED, and INITIALIZED in 'src/ai/genkit.ts', and your HF_API_TOKEN is SET in your '.env' file.`);
    } else if (input.mainApiModel === 'llamafile') {
       modelToUse = undefined; // Llamafile usually relies on default plugin config, not specific model string
      console.warn(`IntelligentMerge: Llamafile selected as main model. Using default configured Llamafile model (if a Llamafile Genkit plugin is active in src/ai/genkit.ts).
IMPORTANT: Ensure your Llamafile executable is RUNNING (if applicable) and Genkit is configured with a Llamafile plugin in 'src/ai/genkit.ts'. The Llamafile path ('${input.llamafilePath || 'Not provided'}') is available in the prompt context for the AI's awareness.`);
    } else {
        console.warn("IntelligentMerge: No specific main model selected or configured. Ensure Genkit has a default model or that a selection from the UI is valid and supported by the backend configuration in 'src/ai/genkit.ts'.");
    }

    if (input.useCustomReasoningModel && input.reasoningApiModel === 'ollama' && input.ollamaReasoningModelName) {
        promptInput.ollamaBaseReasoningModelName = input.ollamaReasoningModelName.includes(':') ? input.ollamaReasoningModelName.split(':')[0] : input.ollamaReasoningModelName;
    }
    if (input.useCustomCodingModel && input.codingApiModel === 'ollama' && input.ollamaCodingModelName) {
        promptInput.ollamaBaseCodingModelName = input.ollamaCodingModelName.includes(':') ? input.ollamaCodingModelName.split(':')[0] : input.ollamaCodingModelName;
    }


    const {output} = await configuredPrompt(promptInput, modelToUse ? { model: modelToUse } : undefined);

    if (!output) {
      throw new Error('The AI model did not return a valid output. Please try again with a more specific prompt or check model availability.');
    }
    if (typeof output.summary !== 'string' || !output.summary.trim()) {
        if (!output.files || output.files.length === 0) {
             throw new Error('The AI model returned an invalid or empty summary and no files. Please refine your request or check model output format instructions.');
        }
        console.warn("IntelligentMerge: AI model returned an empty or invalid summary, but files were generated. Proceeding with files.");
        output.summary = output.summary || "Summary was not generated by the AI.";
    }
    if (!Array.isArray(output.files)) {
        console.warn("IntelligentMerge: AI model returned non-array for 'files'. Coercing to empty array.");
        output.files = [];
    }

    const validatedFiles = output.files.map((file, index) => {
      if (!file || typeof file !== 'object') {
        console.warn(`IntelligentMerge: Invalid item in "files" array at index ${index}. Skipping.`);
        return null;
      }
      if (typeof file.path !== 'string' || !file.path.trim()) {
         console.warn(`IntelligentMerge: Invalid file object in AI output at index ${index}: "path" must be a non-empty string. Skipping.`);
        return null;
      }
      if (typeof file.content !== 'string') {
        console.warn(`IntelligentMerge: File "${file.path}" has non-string content (type: ${typeof file.content}). Coercing to empty string.`);
        file.content = "";
      }
      return file;
    }).filter(file => file !== null) as IntelligentMergeOutput['files'];

    output.files = validatedFiles;

    return output;
  }
);

export async function intelligentMerge(input: IntelligentMergeInput): Promise<IntelligentMergeOutput> {
  return intelligentMergeFlow(input);
}
