// src/lib/actions.ts
'use server';

import { detectLanguage, type DetectLanguageOutput } from '@/ai/flows/detect-language';
import { detectErrors, type DetectErrorsOutput, type DetectErrorsInput } from '@/ai/flows/detect-errors';
import { suggestCodeFixes, type SuggestCodeFixesOutput, type SuggestCodeFixesInput } from '@/ai/flows/suggest-fixes';

export interface AnalysisResult {
  language: string;
  detectedErrors: DetectErrorsOutput['errors'];
  suggestions: string;
  correctedCode: string;
  originalCode: string;
}

export interface ActionResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

function formatErrorsToString(errors: DetectErrorsOutput['errors']): string {
  if (!errors || errors.length === 0) {
    return "No errors detected.";
  }
  return errors.map(err => 
    `Line ${err.line}: [${err.severity}] ${err.errorType} - ${err.description}`
  ).join('\n');
}

export async function analyzeCode(code: string): Promise<ActionResponse> {
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
