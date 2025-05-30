
// src/ai/flows/translate-code-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to translate code from one language to another using an LLM.
 *
 * - translateCodeFlow - A function that takes source code, source language, and target language,
 *   and returns the translated code.
 * - TranslateCodeInput - The input type for the translateCodeFlow function.
 * - TranslateCodeOutput - The return type for the translateCodeFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateCodeInputSchema = z.object({
  sourceCode: z.string().describe('The code snippet to translate.'),
  sourceLanguage: z.string().describe('The programming language of the source code.'),
  targetLanguage: z.string().describe('The target programming language for translation.'),
});
export type TranslateCodeInput = z.infer<typeof TranslateCodeInputSchema>;

const TranslateCodeOutputSchema = z.object({
  translatedCode: z.string().describe('The translated code snippet.'),
  // explanation: z.string().optional().describe('An explanation of the translated code, if requested.'),
});
export type TranslateCodeOutput = z.infer<typeof TranslateCodeOutputSchema>;

export async function translateCode(input: TranslateCodeInput): Promise<TranslateCodeOutput> {
  return translateCodeFlow(input);
}

const translateCodePrompt = ai.definePrompt({
  name: 'translateCodePrompt',
  input: { schema: TranslateCodeInputSchema },
  output: { schema: TranslateCodeOutputSchema },
  prompt: `You are an expert multilingual software engineer and compiler. Translate the following code from {{sourceLanguage}} to idiomatic {{targetLanguage}}.

Requirements:
- Preserve logic and data structures.
- Use idiomatic syntax and naming conventions for the {{targetLanguage}}.
- Ensure the translated code is complete and runnable.
- ONLY output the raw code for the {{targetLanguage}} snippet. Do NOT include any markdown formatting like \`\`\`{{targetLanguage}}\`\`\` or \`\`\` around the code.
- Do NOT include any explanations, comments, or any text other than the translated code itself.

Source Code ({{sourceLanguage}}):
\`\`\`{{sourceLanguage}}
{{{sourceCode}}}
\`\`\`

Translated Code ({{targetLanguage}}):
`,
});

const translateCodeFlow = ai.defineFlow(
  {
    name: 'translateCodeFlow',
    inputSchema: TranslateCodeInputSchema,
    outputSchema: TranslateCodeOutputSchema,
  },
  async (input: TranslateCodeInput) => {
    const { output } = await translateCodePrompt(input);
    if (!output) {
      throw new Error('AI model did not return an output for code translation.');
    }
    // Clean up potential markdown code block fences if the model still adds them despite instructions
    let translated = output.translatedCode;
    const langLower = input.targetLanguage.toLowerCase();
    const langUpper = input.targetLanguage.toUpperCase();
    
    const regexLower = new RegExp(`^\\\`\\\`\\\`(${langLower}|${input.targetLanguage})?\\s*\\n?`, 'im');
    const regexUpper = new RegExp(`^\\\`\\\`\\\`(${langUpper}|${input.targetLanguage})?\\s*\\n?`, 'im');
    const regexEnd = /\n?\`\`\`$/, 'im';

    translated = translated.replace(regexLower, '');
    translated = translated.replace(regexUpper, '');
    translated = translated.replace(regexEnd, '');
    
    return { translatedCode: translated.trim() };
  }
);
