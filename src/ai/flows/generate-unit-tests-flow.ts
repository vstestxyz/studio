
// src/ai/flows/generate-unit-tests-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to generate unit test suites (including classes and mocks) for code snippets using an LLM.
 *
 * - generateUnitTests - A function that takes source code, language, framework, and an option to include explanations,
 *   and returns the generated unit tests and optionally an explanation.
 * - GenerateUnitTestsInput - The input type for the generateUnitTests function.
 * - GenerateUnitTestsOutput - The return type for the generateUnitTests function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateUnitTestsInputSchema = z.object({
  sourceCode: z.string().describe('The code snippet to generate tests for.'),
  language: z.string().describe('The programming language of the source code.'),
  framework: z.string().describe('The testing framework to use for the generated tests.'),
  includeExplanation: z.boolean().describe('Whether to include an explanation of the generated tests.'),
});
export type GenerateUnitTestsInput = z.infer<typeof GenerateUnitTestsInputSchema>;

const GenerateUnitTestsOutputSchema = z.object({
  unitTests: z.string().describe('The generated unit test code. Should be a raw code block without markdown fences.'),
  explanation: z.string().optional().describe('An explanation of the generated tests, if requested.'),
});
export type GenerateUnitTestsOutput = z.infer<typeof GenerateUnitTestsOutputSchema>;

export async function generateUnitTests(input: GenerateUnitTestsInput): Promise<GenerateUnitTestsOutput> {
  return generateUnitTestsFlow(input);
}

const generateUnitTestsPrompt = ai.definePrompt({
  name: 'generateUnitTestsPrompt',
  input: { schema: GenerateUnitTestsInputSchema },
  output: { schema: GenerateUnitTestsOutputSchema },
  prompt: `You are an expert Senior QA Engineer specializing in writing comprehensive and idiomatic test suites, including test classes, setup/teardown methods, and mocks where appropriate. Your task is to generate a complete unit test suite.

Follow these instructions carefully:

1.  **Target Language & Framework**: The test suite must be written in '{{language}}' using the '{{framework}}' testing framework.
2.  **Code to Test**: Analyze the following code snippet thoroughly:
    \`\`\`{{language}}
    {{{sourceCode}}}
    \`\`\`
3.  **Test Structure**:
    *   If the input code defines a class, generate a corresponding test class.
    *   Include appropriate setup (e.g., \`setUp\`, \`beforeEach\`) and teardown (e.g., \`tearDown\`, \`afterEach\`) methods within the test class if they would be beneficial for managing test state or resources.
    *   Organize tests logically.
4.  **Mocking**:
    *   If the code involves external dependencies (e.g., network calls, database interactions, file system operations) or complex object collaborations that are not the focus of the unit test, include appropriate mocking.
    *   Use standard mocking libraries for the language/framework (e.g., \`unittest.mock\` or \`pytest-mock\` for Python, \`Mockito\` for Java, \`Jest mocks\` for JavaScript/TypeScript, \`Moq\` for C#).
    *   Generate mock objects/stubs and include assertions for interactions with mocks if relevant (e.g., verifying a mock method was called with specific arguments).
5.  **Test Coverage Requirements**: Generate tests that cover AT LEAST the following categories:
    *   **Common Case(s)**: Test the typical, expected behavior (happy path).
    *   **Edge Case(s)**: Test boundary conditions (e.g., empty inputs, nulls, zero, min/max values), or other unusual but valid inputs.
    *   **Error/Invalid Input Case(s)**: Test how the code handles or should handle erroneous or unexpected inputs (e.g., wrong data types, values out of expected range, exceptions). This includes testing for expected exceptions.
    *   **Behavioral Tests**: Ensure different logical branches (if/else/switch statements, loops) are exercised.
6.  **Test Naming**: Use clear, descriptive, and meaningful names for all test classes and test functions/methods that indicate what they are testing (e.g., \`test_calculateTotal_withValidInputs_returnsCorrectSum\`, \`test_processOrder_whenInventoryIsLow_raisesOutOfStockError\`).
7.  **Idiomatic Code**: Ensure the generated test code, including any test class structure and mocking, is idiomatic for both the '{{language}}' and the '{{framework}}'. Adhere to common conventions and best practices.
8.  **Output for 'unitTests' field**:
    *   You MUST provide ONLY the raw test code for the 'unitTests' field.
    *   Do NOT include any markdown formatting like \`\`\`{{framework}}\`\`\` or \`\`\` around the code in this field.
    *   Do NOT include any comments or explanations within the 'unitTests' field code itself, unless they are standard practice for the language/framework (e.g., docstrings for Python test methods if appropriate, or necessary comments for complex mock setups).

{{#if includeExplanation}}
9.  **Output for 'explanation' field**:
    *   If 'includeExplanation' is true, you MUST provide a concise explanation for what each major test case (or group of similar tests) does and why it's important for achieving good test coverage.
    *   Explain any mocking strategies used.
    *   Structure the explanation clearly. This explanation should be provided for the 'explanation' field.
{{else}}
10. **Output for 'explanation' field (if not requested)**:
    *   If 'includeExplanation' is false, the 'explanation' field in the output object should be omitted or be an empty string. Do NOT provide any explanation.
{{/if}}

Respond with a JSON object matching the defined output schema.
`,
});


const generateUnitTestsFlow = ai.defineFlow(
  {
    name: 'generateUnitTestsFlow',
    inputSchema: GenerateUnitTestsInputSchema,
    outputSchema: GenerateUnitTestsOutputSchema,
  },
  async (input: GenerateUnitTestsInput) => {
    const { output } = await generateUnitTestsPrompt(input);
    if (!output) {
      throw new Error('AI model did not return an output for unit test generation.');
    }
    
    // Ensure unitTests is a string, even if the model mistakenly makes it null/undefined
    const tests = output.unitTests || "";
    
    // Clean up potential markdown code block fences if the model still adds them despite instructions
    // Use framework or language for fence, as model might use either.
    // Handle cases where language might contain special characters by preferring framework name if simple.
    const frameworkIdentifier = input.framework.replace(/[^a-zA-Z0-9]/g, ''); // basic sanitization for regex
    const languageIdentifier = input.language.replace(/[^a-zA-Z0-9]/g, '');


    const regexPatterns = [
        // Specific framework/language fences (case-insensitive for the label)
        new RegExp(`^\\\`\\\`\\\`(${frameworkIdentifier}|${input.framework}|${languageIdentifier}|${input.language})?\\s*\\n?`, 'im'),
        // Generic fence start (no language specified)
        new RegExp(`^\\\`\\\`\\\`\\s*\\n?`, 'im'), 
        // Fence end
        /\n?\`\`\`$/im 
    ];

    let cleanedUnitTests = tests;
    for (const regex of regexPatterns) {
        cleanedUnitTests = cleanedUnitTests.replace(regex, '');
    }
    
    return { 
        unitTests: cleanedUnitTests.trim(),
        explanation: output.explanation ? output.explanation.trim() : undefined
    };
  }
);

