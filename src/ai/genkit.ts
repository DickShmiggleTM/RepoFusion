
import {genkit, type PluginProvider} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

// --- Genkit Plugin Configuration Guide ---
//
// This file configures the Genkit AI framework with various model providers.
// To use models from OpenRouter, HuggingFace, Ollama, or Llamafile, you MUST:
//
// 1. INSTALL THE RESPECTIVE GENKIT PLUGINS:
//    - For OpenRouter: `npm install @genkit-ai/openrouter` (verify package name)
//    - For HuggingFace: `npm install @genkit-ai/huggingface` (verify package name)
//    - For Ollama: `npm install @genkit-ai/ollama` (or similar official/community plugin)
//    - For Llamafile: A specific Genkit plugin for Llamafile might be needed.
//      If one doesn't exist, advanced users might create a custom tool or plugin.
//
// 2. CONFIGURE API KEYS IN YOUR `.env` FILE:
//    Create a `.env` file in your project root if it doesn't exist.
//    Add your API keys for cloud services:
//      GOOGLE_API_KEY=your_google_ai_studio_api_key (Also used by googleAI() if not passed by flows)
//      OPENROUTER_API_KEY=your_openrouter_api_key
//      HF_API_TOKEN=your_huggingface_api_token
//
// 3. INITIALIZE & ADD PLUGINS TO THE `activePlugins` ARRAY BELOW:
//    Uncomment and configure the plugin initializations in the sections below.
//
// The API keys and model configurations from the app's UI Settings are passed to
// Genkit flows for contextual awareness and, in Gemini's case, for dynamic key usage.
// However, for other providers, the backend Genkit plugins configured here (using
// environment variables for keys) are responsible for actual API communication.
//
// --- Default Google AI Plugin ---
const googleAIPlugin = googleAI({
  // apiKey: process.env.GOOGLE_API_KEY // Optional: can be set globally or passed by flows
});

// --- Active Plugins Array ---
// Start with the default Google AI plugin. Others are added conditionally.
const activePlugins: PluginProvider[] = [googleAIPlugin];

// --- OpenRouter Plugin Configuration ---
try {
  const {openrouter} = await import('@genkit-ai/openrouter'); // Ensure this package is installed
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    activePlugins.push(openrouter({apiKey: openRouterApiKey}));
    console.info("Genkit: OpenRouter plugin configured successfully using OPENROUTER_API_KEY from .env.");
  } else {
    console.warn(
      "Genkit: OPENROUTER_API_KEY not found in .env. OpenRouter models will be unavailable. " +
      "Please add your key to the .env file and ensure the '@genkit-ai/openrouter' plugin is installed."
    );
  }
} catch (e) {
  console.warn(
    "Genkit: OpenRouter plugin (@genkit-ai/openrouter) not installed or failed to load. " +
    "OpenRouter models will be unavailable. Run 'npm install @genkit-ai/openrouter'. Error:", e
  );
}

// --- HuggingFace Plugin Configuration ---
try {
  const {huggingFace} = await import('@genkit-ai/huggingface'); // Ensure this package is installed
  const huggingFaceApiKey = process.env.HF_API_TOKEN;
  if (huggingFaceApiKey) {
    activePlugins.push(huggingFace({apiKey: huggingFaceApiKey}));
    console.info("Genkit: HuggingFace plugin configured successfully using HF_API_TOKEN from .env.");
  } else {
    console.warn(
      "Genkit: HuggingFace API token (HF_API_TOKEN) not found in .env. HuggingFace models will be unavailable. " +
      "Please add your token to the .env file and ensure the '@genkit-ai/huggingface' plugin is installed."
    );
  }
} catch (e) {
  console.warn(
    "Genkit: HuggingFace plugin (@genkit-ai/huggingface) not installed or failed to load. " +
    "HuggingFace models will be unavailable. Run 'npm install @genkit-ai/huggingface'. Error:", e
  );
}

// --- Ollama Plugin Configuration ---
try {
  const {ollama} = await import('@genkit-ai/ollama'); // Ensure this is the correct package for your Ollama plugin
  // Basic Ollama plugin configuration. Adjust model, endpoint, timeout as needed.
  activePlugins.push(ollama({
    // model: 'llama3', // Optional: A default model if not specified in the call
    // endpoint: 'http://localhost:11434', // Default Ollama endpoint
    // requestTimeout: 300000, // Example: 5 minutes timeout
  }));
  console.info(
    "Genkit: Ollama plugin configured. Ensure your Ollama server is RUNNING, " +
    "models are PULLED (e.g., 'ollama pull llama3'), and the Genkit Ollama plugin " +
    "(e.g., '@genkit-ai/ollama') is INSTALLED."
  );
} catch (e) {
  console.warn(
    "Genkit: Ollama plugin (e.g., '@genkit-ai/ollama') not installed or failed to load. " +
    "Ollama models will be unavailable. Run 'npm install @genkit-ai/ollama' (or the correct plugin package). Error:", e
  );
}

// --- Llamafile Plugin Configuration (Hypothetical) ---
// There isn't a standardized official Genkit Llamafile plugin as of last update.
// This is a placeholder for how one *might* be configured if available.
// You would need to find or develop such a plugin.
/*
try {
  const { llamafile } = await import('some-genkit-llamafile-plugin'); // Replace with actual package if available
  // Llamafile specific configurations, e.g., path to default llamafile or server endpoint
  // The `llamafilePath` from UI settings could theoretically be used here if the plugin supports dynamic paths,
  // but plugins usually initialize with static config or environment variables.
  activePlugins.push(llamafile({
    // Example: filePath: process.env.LLAMAFILE_DEFAULT_PATH || '/path/to/your/default.llamafile',
    // Example: serverUrl: process.env.LLAMAFILE_SERVER_URL || 'http://localhost:8080',
  }));
  console.info(
    "Genkit: Llamafile plugin (hypothetical) configured. Ensure your Llamafile is RUNNING, ACCESSIBLE, " +
    "and the Genkit Llamafile plugin is INSTALLED and configured to use the Llamafile path/URL."
  );
} catch (e) {
  console.warn(
    "Genkit: Llamafile plugin (hypothetical) not installed or failed to load. " +
    "Llamafile models will be unavailable. You would need to install and configure a suitable plugin. Error:", e
  );
}
*/

// --- Initialize Genkit with all active plugins ---
console.log("Genkit: Initializing with active plugins:", activePlugins.map(p => p?.name || "Unknown Plugin").filter(Boolean).join(', '));

const ai = genkit({
  plugins: activePlugins.filter(Boolean), // Filter out any undefined plugins
  // Default model used if a flow doesn't specify one or if the specified model's provider isn't configured.
  // It's good to have a reliable default. Gemini is a good choice as it's often available.
  model: 'googleai/gemini-1.5-flash-latest',
  // For development, logLevel can be set via CLI (`genkit start --log-level debug`)
  // or environment variables, which is often preferred over hardcoding.
  // logLevel: 'debug',
});

export default ai;

// Example of how to list available models from configured providers:
// This is for testing/debugging, e.g., in src/ai/dev.ts or a similar standalone script.
/*
async function listAllAvailableModels() {
  try {
    const allModels = await listModels({ plugins: activePlugins.filter(Boolean) });
    console.log("Available Genkit Models (from all configured plugins):", JSON.stringify(allModels, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}
// listAllAvailableModels(); // Call this in a dev script
*/
