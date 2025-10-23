import genkit from 'genkit';
import { openAIGemini } from '@genkit-ai/openai';

export const ai = genkit({
  plugins: [
    openAIGemini({
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
  ],
  model: 'gpt-4o-mini',
});
