
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openrouter} from '@genkit-ai/openrouter'; // Hypothetical import
// import {huggingface} from '@genkit-ai/huggingface'; // Hypothetical import

// To use OpenRouter or HuggingFace, you would initialize their respective plugins here
// and potentially create separate `ai` instances or a more complex configuration
// that the flow could choose from based on user settings.
// For example:
// const openRouterPlugin = openrouter({ apiKey: process.env.OPENROUTER_API_KEY });
// const hfPlugin = huggingface({ apiKey: process.env.HF_API_KEY });

export const ai = genkit({
  plugins: [
    googleAI(),
    // openRouterPlugin, // Add if configured
    // hfPlugin,         // Add if configured
  ],
  // Default model. The flow can override this if dynamic model selection is implemented.
  model: 'googleai/gemini-2.0-flash', 
});
