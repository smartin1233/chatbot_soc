import {genkit} from 'genkit';
import openAI from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
  ],
  model: 'openai/gpt-4o-mini',
});
