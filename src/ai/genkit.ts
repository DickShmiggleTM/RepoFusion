
import {genkit, type ModelArgument} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Import dotenv to load .env file variables
import { config } from 'dotenv';
config(); // Load environment variables from .env

// --- Genkit Plugin Configuration Guide ---
//
// IMPORTANT: To use models from OpenRouter, HuggingFace, or Ollama, you MUST:
// 1. INSTALL the respective Genkit plugins for these services.
//    Example: `npm install @genkit-ai/openrouter @genkit-ai/huggingface some-ollama-genkit-plugin`
//    (Replace `some-ollama-genkit-plugin` with the actual package name if available).
//
// 2. CONFIGURE API KEYS in your `.env` file (create one in the project root if it doesn't exist).
//    Genkit plugins for cloud services typically read API keys from environment variables.
//    Example .env entries:
//      GOOGLE_API_KEY=your_google_ai_studio_api_key (Used by googleAI() if not passed directly)
//      OPENROUTER_API_KEY=your_openrouter_api_key
//      HF_API_TOKEN=your_huggingface_api_token
//
// 3. INITIALIZE & ADD PLUGINS to the `activePlugins` array below.
//    Uncomment and update the example sections for the plugins you want to use.
//
// The API keys entered in the app's UI Settings are primarily for:
//  a) Dynamically fetching model lists (e.g., for Gemini via its client libraries).
//  b) Passing to the Genkit flow as *contextual information* for the AI, so it knows your preferred toolchain.
//  c) For Gemini, the flows dynamically initialize a Genkit instance with the UI-provided key for that specific call.
//
// For OpenRouter, HuggingFace, and Ollama, the Genkit backend (this file) MUST have the
// plugins correctly initialized and configured for the actual API calls to be authenticated and routed.

// --- Google AI Plugin (Already configured) ---
// The googleAI() plugin can use GOOGLE_API_KEY from .env or an explicitly passed key.
// The flows in this app demonstrate passing the key dynamically for Gemini if provided in UI settings.
const googleAIPlugin = googleAI({
  // apiKey: process.env.GOOGLE_API_KEY // Optional: can be set here or relies on flow-level dynamic key
});

// --- Placeholder for OpenRouter Plugin ---
// 1. Install the plugin: `npm install @genkit-ai/openrouter` (verify package name)
// 2. Add OPENROUTER_API_KEY to your .env file.
/*
import {openrouter} from '@genkit-ai/openrouter'; // Adjust import if necessary
const openRouterAPIKey = process.env.OPENROUTER_API_KEY;
const openRouterProvider = openRouterAPIKey
  ? openrouter({apiKey: openRouterAPIKey})
  : undefined;

if (openRouterProvider) {
  console.log("OpenRouter Genkit plugin configured using OPENROUTER_API_KEY from .env.");
} else if (process.env.NODE_ENV !== 'production') { // Show warning only in dev/test
  console.warn(
    "OpenRouter API key (OPENROUTER_API_KEY) not found in .env. " +
    "OpenRouter models will not be available unless the key is optional for listing models."
  );
}
*/

// --- Placeholder for HuggingFace Plugin ---
// 1. Install the plugin: `npm install @genkit-ai/huggingface` (verify package name)
// 2. Add HF_API_TOKEN to your .env file.
/*
import {huggingface} from '@genkit-ai/huggingface'; // Adjust import if necessary
const huggingFaceApiKey = process.env.HF_API_TOKEN;
const huggingFaceProvider = huggingFaceApiKey
  ? huggingface({apiKey: huggingFaceApiKey}) // Or the plugin might auto-read from env
  : undefined;

if (huggingFaceProvider) {
  console.log("HuggingFace Genkit plugin configured using HF_API_TOKEN from .env.");
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(
    "HuggingFace API token (HF_API_TOKEN) not found in .env. " +
    "HuggingFace models will not be available."
  );
}
*/

// --- Placeholder for Ollama Plugin ---
// 1. Install a Genkit Ollama plugin (e.g., `npm install genkit-ollama-plugin` - verify actual package name).
// 2. Ensure your Ollama server is running (usually at http://localhost:11434).
/*
import {ollama} from 'genkit-ollama-plugin'; // Adjust import based on the plugin used
const ollamaProvider = ollama({
  // Configuration for the Ollama plugin, e.g.:
  // model: 'llama3', // Default model if not specified in the call
  // endpoint: 'http://localhost:11434', // Default endpoint
  // requestTimeout: 300000, // 5 minutes
});
if (ollamaProvider) {
  console.log("Ollama Genkit plugin configured. Ensure Ollama server is running and models are pulled.");
}
*/

// --- Build the `activePlugins` array ---
// Start with the default Google AI plugin.
const activePlugins: ModelArgument[] = [googleAIPlugin];

// Add other configured providers.
// if (openRouterProvider) {
//   activePlugins.push(openRouterProvider);
// }
// if (huggingFaceProvider) {
//   activePlugins.push(huggingFaceProvider);
// }
// if (ollamaProvider) {
//  activePlugins.push(ollamaProvider);
// }

export const ai = genkit({
  plugins: activePlugins,
  // Default model. Flows can override this. This is a fallback.
  model: 'googleai/gemini-1.5-flash-latest',
  // It's generally better to configure log level via CLI (`genkit start --log-level debug`)
  // or environment variables, but can be set here for development.
  // logLevel: 'debug',
});
