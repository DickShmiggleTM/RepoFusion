
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Hypothetical imports - ensure you have the correct packages installed
// For OpenRouter, you might need to install a package like '@genkit-ai/openrouter'
// import {openrouter} from '@genkit-ai/openrouter';
// For HuggingFace, you might need to install a package like '@genkit-ai/huggingface'
// import {huggingface} from '@genkit-ai/huggingface';
// For Ollama, you might need to install a specific Genkit Ollama plugin
// import {ollama} from 'genkit-ollama-plugin'; // Example placeholder

// Ensure .env file is loaded for API keys if not handled globally
// import { config } from 'dotenv';
// config(); // Call if you manage .env loading here

// --- Initialize OpenRouter Plugin (Example) ---
// IMPORTANT: To use OpenRouter, set OPENROUTER_API_KEY in your .env file.
// const openRouterAPIKey = process.env.OPENROUTER_API_KEY;
// const openRouterPlugin = openRouterAPIKey
//   ? openrouter({ apiKey: openRouterAPIKey }) // Plugin might auto-read from env or require explicit pass-through
//   : undefined;
// if (openRouterPlugin) {
//   console.log("OpenRouter plugin configured.");
// } else if (process.env.NODE_ENV === 'development') { 
//   console.warn("OpenRouter API key (OPENROUTER_API_KEY) not found in environment variables. OpenRouter plugin will not be available.");
// }

// --- Initialize HuggingFace Plugin (Example) ---
// IMPORTANT: To use HuggingFace, set HF_API_TOKEN in your .env file.
// const huggingFaceApiKey = process.env.HF_API_TOKEN; 
// const hfPlugin = huggingFaceApiKey
//   ? huggingface({ apiKey: huggingFaceApiKey }) // Plugin might auto-read from env or require explicit pass-through
//   : undefined;
// if (hfPlugin) {
//   console.log("HuggingFace plugin configured.");
// } else if (process.env.NODE_ENV === 'development') {
//   console.warn("HuggingFace API token (HF_API_TOKEN) not found in environment variables. HuggingFace plugin will not be available.");
// }

// --- Initialize Ollama Plugin (Example) ---
// IMPORTANT: Ensure your Ollama instance is running and accessible.
// This is a placeholder. The actual Ollama plugin might have different initialization.
// const ollamaPlugin = ollama({
//   // model: 'llama3', // Default model for the plugin if not specified in the call
//   // endpoint: 'http://localhost:11434', // Default endpoint
//   // requestTimeout: 300000 // 5 minutes
// });
// if (ollamaPlugin) {
//   console.log("Ollama plugin configured (placeholder). Ensure Ollama server is running.");
// }


// Build the plugins array dynamically
// The googleAI() plugin is initialized by default.
// Add other plugins here if they are configured.
const activePlugins = [googleAI()];

// if (openRouterPlugin) {
//   activePlugins.push(openRouterPlugin);
// }
// if (hfPlugin) {
//   activePlugins.push(hfPlugin);
// }
// if (ollamaPlugin) {
//  activePlugins.push(ollamaPlugin);
// }

export const ai = genkit({
  plugins: activePlugins,
  // Default model. The flow can override this if dynamic model selection is implemented.
  // This default is used if a flow doesn't specify a model or if the specified model isn't available.
  model: 'googleai/gemini-1.5-flash-latest', // Changed to a common default model
  // It's generally better to configure log level via CLI or environment variables
  // logLevel: 'debug', // Example: set to 'debug' for more verbose logging if needed
});

/**
 * IMPORTANT: Genkit Plugin Configuration Guide
 * 
 * To use OpenRouter, HuggingFace, or Ollama models via Genkit:
 * 
 * 1. Install their respective Genkit plugins:
 *    - Example: `npm install @genkit-ai/openrouter @genkit-ai/huggingface some-ollama-plugin`
 *    - (Replace `some-ollama-plugin` with the actual package name if available.)
 * 
 * 2. Configure API Keys in `.env` file:
 *    - Create a `.env` file in the root of your project if it doesn't exist.
 *    - Add your API keys:
 *      OPENROUTER_API_KEY=your_openrouter_api_key
 *      HF_API_TOKEN=your_huggingface_api_token
 *    - These environment variables are typically read by the Genkit plugins when they initialize.
 * 
 * 3. Uncomment and Update Plugin Initialization Code Above:
 *    - Uncomment the sections for OpenRouter, HuggingFace, and/or Ollama.
 *    - Ensure the import paths and initialization code match the specific Genkit plugins you've installed.
 *    - The plugins should ideally pick up API keys from `process.env`.
 * 
 * 4. Add Plugins to `activePlugins` Array:
 *    - Uncomment the lines that add the initialized plugins to the `activePlugins` array.
 * 
 * 5. Ollama Specifics:
 *    - Ensure your Ollama server instance is running (usually at `http://localhost:11434`).
 *    - The Ollama Genkit plugin (if available) will need to be configured to connect to this instance.
 * 
 * The API Keys entered in the UI Settings are primarily for:
 *  a) Dynamically fetching model lists (e.g., for Gemini).
 *  b) Passing to the Genkit flow as context, so the AI knows your preferred toolchain.
 *  c) For Gemini, the flow dynamically initializes a Genkit instance with the UI-provided key for that specific call.
 * 
 * For OpenRouter and HuggingFace, the Genkit backend (this file) must have the plugins configured
 * with API keys from environment variables for the actual API calls to be authenticated.
 */

    