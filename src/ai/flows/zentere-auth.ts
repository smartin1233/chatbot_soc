'use server';
/**
 * @fileOverview A flow for authenticating with the Zentere API to retrieve an access token.
 *
 * - zentereAuth - A function that handles the authentication process.
 * - ZentereAuthInput - The input type for the zentereAuth function.
 * - ZentereAuthOutput - The return type for the zentereAuth function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ZentereAuthInputSchema = z.object({
  grant_type: z.string(),
  client_id: z.string(),
  username: z.string(),
  password: z.string(),
  client_secret: z.string(),
});
export type ZentereAuthInput = z.infer<typeof ZentereAuthInputSchema>;

export const ZentereAuthOutputSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
  refresh_token: z.string(),
});
export type ZentereAuthOutput = z.infer<typeof ZentereAuthOutputSchema>;

export async function zentereAuth(input: ZentereAuthInput): Promise<ZentereAuthOutput> {
  return zentereAuthFlow(input);
}

const zentereAuthFlow = ai.defineFlow(
  {
    name: 'zentereAuthFlow',
    inputSchema: ZentereAuthInputSchema,
    outputSchema: ZentereAuthOutputSchema,
  },
  async (input) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
    const formData = new URLSearchParams();
    formData.append('grant_type', input.grant_type);
    formData.append('client_id', input.client_id);
    formData.append('username', input.username);
    formData.append('password', input.password);
    formData.append('client_secret', input.client_secret);

    const response = await fetch('https://app-api-dev.zentere.com/api/v2/authentication/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
        signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return ZentereAuthOutputSchema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Authentication request timed out after 10 seconds');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
);
