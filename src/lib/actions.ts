
// src/lib/actions.ts
'use server';

import { detectLanguage, type DetectLanguageOutput } from '@/ai/flows/detect-language';
import { detectErrors, type DetectErrorsOutput, type DetectErrorsInput } from '@/ai/flows/detect-errors';
import { suggestCodeFixes, type SuggestCodeFixesOutput, type SuggestCodeFixesInput } from '@/ai/flows/suggest-fixes';
import { executePistonCode, type ExecuteCodeInput, type ExecuteCodeOutput as ExecuteCodeFlowOutput } from '@/ai/flows/execute-code-flow';
import { translateCode as translateCodeFlow, type TranslateCodeInput as TranslateCodeFlowInput, type TranslateCodeOutput as TranslateCodeFlowOutput } from '@/ai/flows/translate-code-flow';


export interface AnalysisResult {
  language: string;
  detectedErrors: DetectErrorsOutput['errors'];
  suggestions: string;
  correctedCode: string;
  originalCode: string;
}

export interface ActionResponse<T = AnalysisResult> {
  success: boolean;
  data?: T;
  error?: string;
}

function formatErrorsToString(errors: DetectErrorsOutput['errors']): string {
  if (!errors || errors.length === 0) {
    return "No errors detected.";
  }
  return errors.map(err => 
    `Line ${err.line}: [${err.severity}] ${err.errorType} - {err.description}`
  ).join('\n');
}

export async function analyzeCode(code: string): Promise<ActionResponse<AnalysisResult>> {
  if (!code.trim()) {
    return { success: false, error: "Code input cannot be empty." };
  }

  try {
    // Step 1: Detect Language
    const languageResult: DetectLanguageOutput = await detectLanguage({ codeSnippet: code });
    const language = languageResult.language;

    if (!language) {
      return { success: false, error: "Could not detect programming language." };
    }

    // Step 2: Detect Errors
    const errorDetectionInput: DetectErrorsInput = { code, language };
    const errorsResult: DetectErrorsOutput = await detectErrors(errorDetectionInput);
    const detectedErrors = errorsResult.errors || [];
    
    const errorsString = formatErrorsToString(detectedErrors);

    // Step 3: Suggest Fixes
    const fixSuggestionInput: SuggestCodeFixesInput = { 
      code, 
      language, 
      errors: errorsString,
    };
    const fixesResult: SuggestCodeFixesOutput = await suggestCodeFixes(fixSuggestionInput);

    return {
      success: true,
      data: {
        language,
        detectedErrors,
        suggestions: fixesResult.suggestions,
        correctedCode: fixesResult.correctedCode,
        originalCode: code,
      },
    };
  } catch (e) {
    console.error("Error during code analysis:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during analysis.";
    return { success: false, error: `AI processing failed: ${errorMessage}` };
  }
}


// Renaming to avoid conflict with the Genkit flow output type
export type ExecuteCodeOutput = ExecuteCodeFlowOutput;
export type TranslateCodeInput = TranslateCodeFlowInput;
export type TranslateCodeOutput = TranslateCodeFlowOutput;


export async function executeCodeSnippet(input: ExecuteCodeInput): Promise<ActionResponse<ExecuteCodeOutput>> {
  if (!input.code?.trim()) {
    return { success: false, error: "Code input cannot be empty." };
  }
  if (!input.language?.trim()) {
    return { success: false, error: "Language must be specified." };
  }
   if (!input.files || input.files.length === 0 || !input.files[0].name || !input.files[0].content) {
    return { success: false, error: "File information is missing or invalid." };
  }


  try {
    const result: ExecuteCodeOutput = await executePistonCode(input);
    if (result.pistonError) {
        return { success: false, error: result.pistonError };
    }
    return { success: true, data: result };
  } catch (e) {
    console.error("Error executing code snippet:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during code execution.";
    return { success: false, error: `Execution failed: ${errorMessage}` };
  }
}


export async function translateCode(input: TranslateCodeInput): Promise<ActionResponse<TranslateCodeOutput>> {
  if (!input.sourceCode?.trim()) {
    return { success: false, error: "Source code cannot be empty." };
  }
  if (!input.sourceLanguage?.trim()) {
    return { success: false, error: "Source language must be specified." };
  }
  if (!input.targetLanguage?.trim()) {
    return { success: false, error: "Target language must be specified." };
  }
  if (input.sourceLanguage === input.targetLanguage) {
    return { success: false, error: "Source and target languages must be different." };
  }

  try {
    const result: TranslateCodeOutput = await translateCodeFlow(input);
    return { success: true, data: result };
  } catch (e) {
    console.error("Error translating code:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during code translation.";
    return { success: false, error: `Translation failed: ${errorMessage}` };
  }
}
