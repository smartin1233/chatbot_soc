import {genkit} from 'genkit';
import {openAI} from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
  ],
  model: 'gpt-4o-mini',
});
