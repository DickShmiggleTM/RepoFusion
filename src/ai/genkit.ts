
import {genkit, type PluginProvider} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Import dotenv to load .env file variables
import { config } from 'dotenv';
config(); // Load environment variables from .env

// --- Genkit Plugin Configuration Guide ---
//
// IMPORTANT: To use models from OpenRouter, HuggingFace, Llamafile, or Ollama, you MUST:
// 1. INSTALL the respective Genkit plugins for these services.
//    Example: `npm install @genkit-ai/openrouter @genkit-ai/huggingface @genkit-ai/ollama`
//    (Verify actual package names; @genkit-ai/ollama is used as an example, check for the official or a reputable community plugin).
//    For Llamafile, a specific Genkit plugin might be needed if one exists.
//
// 2. CONFIGURE API KEYS in your `.env` file (create one in the project root if it doesn't exist).
//    Genkit plugins for cloud services typically read API keys from environment variables.
//    Example .env entries:
//      GOOGLE_API_KEY=your_google_ai_studio_api_key (Used by googleAI() if not passed directly by flows)
//      OPENROUTER_API_KEY=your_openrouter_api_key
//      HF_API_TOKEN=your_huggingface_api_token
//
// 3. INITIALIZE & ADD PLUGINS to the `activePlugins` array below.
//    The sections below are uncommented as placeholders. You'll need to ensure the packages are installed.
//
// The API keys entered in the app's UI Settings are primarily for:
//  a) Dynamically fetching model lists for certain providers (e.g., Gemini).
//  b) Passing to the Genkit flow as *contextual information* for the AI, so it knows your preferred toolchain.
//  c) For Gemini, the flows can dynamically initialize a Genkit instance with the UI-provided key.
//
// For OpenRouter, HuggingFace, Llamafile and Ollama, this backend file (`src/ai/genkit.ts`) MUST have the
// plugins correctly initialized and configured for the actual API calls to be authenticated and routed.

// --- Google AI Plugin (Default) ---
const googleAIPlugin = googleAI({
  // The API key can be set here globally, or flows can pass it dynamically.
  // apiKey: process.env.GOOGLE_API_KEY 
});

// --- OpenRouter Plugin ---
let openRouterProvider: PluginProvider | undefined = undefined;
try {
  const {openrouter} = await import('@genkit-ai/openrouter'); // Dynamic import
  const openRouterAPIKey = process.env.OPENROUTER_API_KEY;
  if (openRouterAPIKey) {
    openRouterProvider = openrouter({apiKey: openRouterAPIKey});
    console.info("Genkit: OpenRouter plugin configured using OPENROUTER_API_KEY from .env.");
  } else {
    console.warn(
      "Genkit: OPENROUTER_API_KEY not found in .env. OpenRouter models will not be available unless the key is optional for listing/using models."
    );
  }
} catch (e) {
  console.warn("Genkit: OpenRouter plugin (@genkit-ai/openrouter) not installed or failed to load. OpenRouter models will be unavailable. Run 'npm install @genkit-ai/openrouter'.", e);
}


// --- HuggingFace Plugin ---
let huggingFaceProvider: PluginProvider | undefined = undefined;
try {
  const {huggingFace} = await import('@genkit-ai/huggingface'); // Dynamic import
  const huggingFaceApiKey = process.env.HF_API_TOKEN;
  if (huggingFaceApiKey) {
    huggingFaceProvider = huggingFace({apiKey: huggingFaceApiKey});
    console.info("Genkit: HuggingFace plugin configured using HF_API_TOKEN from .env.");
  } else {
    console.warn(
      "Genkit: HuggingFace API token (HF_API_TOKEN) not found in .env. HuggingFace models will not be available."
    );
  }
} catch (e) {
    console.warn("Genkit: HuggingFace plugin (@genkit-ai/huggingface) not installed or failed to load. HuggingFace models will be unavailable. Run 'npm install @genkit-ai/huggingface'.", e);
}

// --- Ollama Plugin ---
let ollamaProvider: PluginProvider | undefined = undefined;
try {
  const {ollama} = await import('@genkit-ai/ollama'); // Dynamic import - Ensure this is the correct package for your Ollama plugin
  ollamaProvider = ollama({
    // Common configuration for the Ollama plugin:
    // model: 'llama3', // A default model if not specified in the call
    // endpoint: 'http://localhost:11434', // Default Ollama endpoint
    // requestTimeout: 300000, // Example: 5 minutes timeout
  });
  console.info("Genkit: Ollama plugin configured. Ensure Ollama server is running and models are pulled.");
} catch (e) {
    console.warn("Genkit: Ollama plugin (e.g., @genkit-ai/ollama) not installed or failed to load. Ollama models will be unavailable. Run 'npm install @genkit-ai/ollama' (or the correct plugin package).", e);
}

// --- Llamafile Plugin (Hypothetical) ---
// Currently, there isn't a standardized official Genkit Llamafile plugin.
// If one becomes available, its configuration would look something like this:
/*
let llamafileProvider: PluginProvider | undefined = undefined;
try {
  const { llamafile } = await import('some-genkit-llamafile-plugin'); // Replace with actual package if available
  llamafileProvider = llamafile({
    // Llamafile specific configurations, e.g., path to default llamafile or server endpoint
    // filePath: '/path/to/your/default.llamafile', // Or server URL
  });
  console.info("Genkit: Llamafile plugin configured (hypothetical). Ensure Llamafile is running and accessible.");
} catch (e) {
  console.warn("Genkit: Llamafile plugin not installed or failed to load. Llamafile models will be unavailable.");
}
*/


// --- Build the `activePlugins` array ---
// Start with the default Google AI plugin.
const activePlugins: PluginProvider[] = [googleAIPlugin];

// Add other configured providers if they were successfully initialized.
if (openRouterProvider) {
  activePlugins.push(openRouterProvider);
}
if (huggingFaceProvider) {
  activePlugins.push(huggingFaceProvider);
}
if (ollamaProvider) {
 activePlugins.push(ollamaProvider);
}
// if (llamafileProvider) { // Hypothetical
//   activePlugins.push(llamafileProvider);
// }

console.log("Genkit: Initialized with active plugins:", activePlugins.map(p => p.name).join(', '));

export const ai = genkit({
  plugins: activePlugins,
  // Default model used if a flow doesn't specify one or if the specified model's provider isn't configured.
  // It's good to have a reliable default.
  model: 'googleai/gemini-1.5-flash-latest', 
  // It's generally better to configure log level via CLI (`genkit start --log-level debug`)
  // or environment variables, but can be set here for development.
  // logLevel: 'debug', 
  // flowStateStore: 'firebase', // Example if using Firebase for flow state persistence
  // traceStore: 'firebase', // Example if using Firebase for trace persistence
});

// Example of how to list available models from configured providers:
// (This is for testing/debugging in dev.ts or similar, not typically run in genkit.ts directly)
/*
async function listModels() {
  if (googleAIPlugin) {
    const googleModels = await listModels({plugins: [googleAIPlugin]});
    console.log("Available Google AI Models:", JSON.stringify(googleModels, null, 2));
  }
  if (openRouterProvider) {
    const orModels = await listModels({plugins: [openRouterProvider]});
    console.log("Available OpenRouter Models:", JSON.stringify(orModels, null, 2));
  }
  // Add similar for HuggingFace, Ollama if their plugins support model listing
}
// listModels();
*/

