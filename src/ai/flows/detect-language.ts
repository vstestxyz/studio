'use server';

/**
 * @fileOverview This file contains the Genkit flow for automatically detecting the programming language of a code snippet.
 *
 * - detectLanguage - A function that takes a code snippet and returns the detected language.
 * - DetectLanguageInput - The input type for the detectLanguage function, which is the code snippet.
 * - DetectLanguageOutput - The return type for the detectLanguage function, which is the detected language.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLanguageInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to detect the language of.'),
});
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectLanguageOutputSchema = z.object({
  language: z.string().describe('The detected programming language.'),
});
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

export async function detectLanguage(input: DetectLanguageInput): Promise<DetectLanguageOutput> {
  return detectLanguageFlow(input);
}

const detectLanguagePrompt = ai.definePrompt({
  name: 'detectLanguagePrompt',
  input: {schema: DetectLanguageInputSchema},
  output: {schema: DetectLanguageOutputSchema},
  prompt: `Determine the programming language of the following code snippet. Respond ONLY with the name of the language, and nothing else.\n\nCode Snippet:\n\n{{codeSnippet}}`,
});

const detectLanguageFlow = ai.defineFlow(
  {
    name: 'detectLanguageFlow',
    inputSchema: DetectLanguageInputSchema,
    outputSchema: DetectLanguageOutputSchema,
  },
  async input => {
    const {output} = await detectLanguagePrompt(input);
    return output!;
  }
);
