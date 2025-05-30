
// src/ai/flows/execute-code-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to execute code snippets using the Piston API.
 * This flow does NOT use an LLM. It acts as a server-side wrapper for an external API.
 *
 * - executeCodeFlow - A function that takes code, language, and stdin, and returns execution results.
 * - ExecuteCodeInput - The input type for the executeCodeFlow function.
 * - ExecuteCodeOutput - The return type for the executeCodeFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

const PistonFileInputSchema = z.object({
  name: z.string().describe("The name of the file, e.g., main.py"),
  content: z.string().describe("The content of the file (the code)."),
});

const ExecuteCodeInputSchema = z.object({
  language: z.string().describe("The programming language (Piston language name, e.g., 'python', 'javascript')."),
  version: z.string().describe("The language version (Piston version string, e.g., '3.10.0', '*' for latest)."),
  files: z.array(PistonFileInputSchema).min(1).describe("An array of files to execute. Typically one file."),
  stdin: z.string().optional().describe("Standard input for the code execution."),
  args: z.array(z.string()).optional().describe("Command line arguments."),
  compileTimeout: z.number().optional().default(10000).describe("Compile timeout in milliseconds."),
  runTimeout: z.number().optional().default(3000).describe("Run timeout in milliseconds."),
  // runMemoryLimit field from concept is not standard in Piston V2 payload, it uses 'memory_limit' at top level if available
});
export type ExecuteCodeInput = z.infer<typeof ExecuteCodeInputSchema>;

const ExecuteCodeOutputSchema = z.object({
  language: z.string().optional(),
  version: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().optional(),
  compileStdout: z.string().optional(),
  compileStderr: z.string().optional(),
  // Piston's 'output' field (combined stdout/stderr) is omitted for clarity, as we get separate stdout/stderr
  // Piston's 'signal' field is also omitted for simplicity
  pistonError: z.string().optional().describe("Error message from Piston API itself, not from code execution."),
});
export type ExecuteCodeOutput = z.infer<typeof ExecuteCodeOutputSchema>;


export async function executePistonCode(input: ExecuteCodeInput): Promise<ExecuteCodeOutput> {
  // This is the primary exported function that the server action will call.
  return executeCodeFlow(input);
}

const executeCodeFlow = ai.defineFlow(
  {
    name: 'executeCodeFlow',
    inputSchema: ExecuteCodeInputSchema,
    outputSchema: ExecuteCodeOutputSchema,
  },
  async (payload: ExecuteCodeInput): Promise<ExecuteCodeOutput> => {
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            language: payload.language,
            version: payload.version,
            files: payload.files,
            stdin: payload.stdin,
            args: payload.args || [],
            compile_timeout: payload.compileTimeout,
            run_timeout: payload.runTimeout,
            // memory_limit: payload.runMemoryLimit // If Piston supports it at this level
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Piston API request failed: ${response.status} ${response.statusText}`, errorBody);
        return {
          pistonError: `Piston API Error: ${response.status} ${response.statusText}. ${errorBody}`,
          stdout: '',
          stderr: '',
          exitCode: -1,
        };
      }

      const result = await response.json();
      
      // Defensive parsing of Piston's somewhat inconsistent response
      const runOutput = result.run || {};
      const compileOutput = result.compile || {};

      return {
        language: result.language,
        version: result.version,
        stdout: runOutput.stdout || "",
        stderr: runOutput.stderr || "",
        exitCode: runOutput.code !== undefined ? runOutput.code : -1, // Piston uses 'code' for exit code
        compileStdout: compileOutput.stdout || "",
        compileStderr: compileOutput.stderr || "",
      };

    } catch (error) {
      console.error('Error calling Piston API:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        pistonError: `Network or other error: ${errorMessage}`,
        stdout: '',
        stderr: '',
        exitCode: -1,
      };
    }
  }
);

