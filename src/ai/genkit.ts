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
// const openRouterAPIKey = process.env.OPENROUTER_API_KEY;
// const openRouterPlugin = openRouterAPIKey
//   ? openrouter({ apiKey: openRouterAPIKey })
//   : undefined;
// if (openRouterPlugin) {
//   console.log("OpenRouter plugin configured.");
// } else if (process.env.NODE_ENV === 'development') { // Only warn if key is expected
//   console.warn("OpenRouter API key not found in environment variables. OpenRouter plugin will not be available.");
// }

// --- Initialize HuggingFace Plugin (Example) ---
// const huggingFaceApiKey = process.env.HF_API_TOKEN; // Or appropriate env var name
// const hfPlugin = huggingFaceApiKey
//   ? huggingface({ apiKey: huggingFaceApiKey })
//   : undefined;
// if (hfPlugin) {
//   console.log("HuggingFace plugin configured.");
// } else if (process.env.NODE_ENV === 'development') {
//   console.warn("HuggingFace API token not found in environment variables. HuggingFace plugin will not be available.");
// }

// --- Initialize Ollama Plugin (Example) ---
// This is a placeholder. The actual Ollama plugin might have different initialization.
// const ollamaPlugin = ollama({
//   // model: 'llama3', // Default model for the plugin if not specified in the call
//   // endpoint: 'http://localhost:11434', // Default endpoint
//   // requestTimeout: 300000 // 5 minutes
// });
// if (ollamaPlugin) {
//   console.log("Ollama plugin configured (placeholder).");
// }


// Build the plugins array dynamically
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
  model: 'googleai/gemini-2.0-flash',
  // It's generally better to configure log level via CLI or environment variables
  // logLevel: 'debug', // Example: set to 'debug' for more verbose logging if needed
});

/**
 * IMPORTANT:
 * To use OpenRouter, HuggingFace, or Ollama:
 * 1. Install their respective Genkit plugins (e.g., `npm install @genkit-ai/openrouter @genkit-ai/huggingface genkit-ollama-plugin`).
 *    The package names `genkit-ollama-plugin` is a placeholder; find the actual package if available.
 * 2. For OpenRouter and HuggingFace, set the following environment variables in your .env file:
 *    OPENROUTER_API_KEY=your_openrouter_api_key
 *    HF_API_TOKEN=your_huggingface_api_token
 * 3. Uncomment the relevant plugin initialization code above and ensure the import paths are correct.
 * 4. For Ollama, ensure your Ollama instance is running and accessible.
 *    The Ollama plugin configuration might need adjustments based on the specific plugin you use.
 */