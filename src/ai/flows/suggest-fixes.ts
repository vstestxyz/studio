
// src/ai/flows/suggest-fixes.ts
'use server';

/**
 * @fileOverview Suggests code fixes for detected errors in a code snippet.
 *
 * - suggestCodeFixes - A function that takes code with detected errors and suggests fixes.
 * - SuggestCodeFixesInput - The input type for the suggestCodeFixes function.
 * - SuggestCodeFixesOutput - The return type for the suggestCodeFixes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeFixesInputSchema = z.object({
  code: z.string().describe('The code snippet with detected errors.'),
  language: z.string().describe('The programming language of the code snippet.'),
  errors: z.string().describe('The detected errors in the code snippet.'),
});

export type SuggestCodeFixesInput = z.infer<typeof SuggestCodeFixesInputSchema>;

const SuggestCodeFixesOutputSchema = z.object({
  correctedCode: z.string().describe('The corrected version of the code snippet.'),
  suggestions: z.string().describe('Suggestions for fixing the detected errors.'),
});

export type SuggestCodeFixesOutput = z.infer<typeof SuggestCodeFixesOutputSchema>;

export async function suggestCodeFixes(input: SuggestCodeFixesInput): Promise<SuggestCodeFixesOutput> {
  return suggestCodeFixesFlow(input);
}

const suggestCodeFixesPrompt = ai.definePrompt({
  name: 'suggestCodeFixesPrompt',
  input: {schema: SuggestCodeFixesInputSchema},
  output: {schema: SuggestCodeFixesOutputSchema},
  prompt: `You are an AI code assistant that suggests fixes for code with errors.

You are given a code snippet, the programming language, and the detected errors.
Your task is to suggest fixes for the errors and provide a corrected version of the code.

Language: {{language}}
Errors: {{{errors}}}
Code:
{{#if code}}
\`\`\`
{{language}}
{{{code}}}
\`\`\`
{{else}}
  No code provided.
{{/if}}

Corrected Code:
`, // No Handlebars await/function calls allowed here; use tools instead.
});

const suggestCodeFixesFlow = ai.defineFlow(
  {
    name: 'suggestCodeFixesFlow',
    inputSchema: SuggestCodeFixesInputSchema,
    outputSchema: SuggestCodeFixesOutputSchema,
  },
  async input => {
    const {output} = await suggestCodeFixesPrompt(input);
    return output!;
  }
);

