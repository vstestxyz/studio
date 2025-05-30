
// src/components/code-translator-form.tsx
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Languages, Loader2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { translateCode, type TranslateCodeOutput } from '@/lib/actions';

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'csharp', label: 'C#' }, // Added C#
  { value: 'swift', label: 'Swift' }, // Added Swift
] as const;

type LanguageValue = typeof SUPPORTED_LANGUAGES[number]['value'];

const FormSchema = z.object({
  sourceCode: z.string().min(1, "Source code cannot be empty."),
  sourceLanguage: z.custom<LanguageValue>(val => SUPPORTED_LANGUAGES.some(lang => lang.value === val), "Please select a source language."),
  targetLanguage: z.custom<LanguageValue>(val => SUPPORTED_LANGUAGES.some(lang => lang.value === val), "Please select a target language."),
}).refine(data => data.sourceLanguage !== data.targetLanguage, {
  message: "Source and target languages must be different.",
  path: ["targetLanguage"], // Attach error to targetLanguage field for better UX
});

type FormData = z.infer<typeof FormSchema>;

interface TranslationResult extends TranslateCodeOutput {
  clientError?: string;
}

export function CodeTranslatorForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sourceCode: "",
      sourceLanguage: "python",
      targetLanguage: "javascript",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setTranslationResult(null);

    try {
      const response = await translateCode({
        sourceCode: data.sourceCode,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
      });

      if (response.success && response.data) {
        setTranslationResult(response.data);
        toast({ title: "Translation Complete", description: "Translated code is shown below." });
      } else {
        setTranslationResult({ clientError: response.error || "An unknown error occurred during translation.", translatedCode: "" });
        toast({ title: "Translation Failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to translate code.";
      setTranslationResult({ clientError: errorMessage, translatedCode: "" });
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const currentSource = form.getValues("sourceLanguage");
    const currentTarget = form.getValues("targetLanguage");
    form.setValue("sourceLanguage", currentTarget);
    form.setValue("targetLanguage", currentSource);
    // Optionally swap code content if desired
    // const currentSourceCode = form.getValues("sourceCode");
    // const currentTranslatedCode = translationResult?.translatedCode || "";
    // form.setValue("sourceCode", currentTranslatedCode);
    // setTranslationResult(currentSourceCode ? { translatedCode: currentSourceCode } : null);
    toast({title: "Languages Swapped", description: `Source is now ${currentTarget}, Target is now ${currentSource}`})
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Languages className="mr-2 h-6 w-6 text-primary" /> AI Code Translator
        </CardTitle>
        <CardDescription>
          Translate code snippets between different programming languages using AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Language and Code */}
            <div className="space-y-2">
              <Label htmlFor="source-language-select" className="text-lg font-semibold">From</Label>
              <Select
                value={form.watch("sourceLanguage")}
                onValueChange={(value) => form.setValue("sourceLanguage", value as LanguageValue, { shouldValidate: true })}
              >
                <SelectTrigger id="source-language-select">
                  <SelectValue placeholder="Source Language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={`source-${lang.value}`} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sourceLanguage && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.sourceLanguage.message}</p>
              )}
              <Textarea
                id="source-code-input"
                {...form.register("sourceCode")}
                placeholder="Enter source code here..."
                className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                aria-invalid={form.formState.errors.sourceCode ? "true" : "false"}
              />
              {form.formState.errors.sourceCode && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.sourceCode.message}</p>
              )}
            </div>

            {/* Target Language and Code */}
            <div className="space-y-2">
              <Label htmlFor="target-language-select" className="text-lg font-semibold">To</Label>
              <Select
                value={form.watch("targetLanguage")}
                onValueChange={(value) => form.setValue("targetLanguage", value as LanguageValue, { shouldValidate: true })}
              >
                <SelectTrigger id="target-language-select">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={`target-${lang.value}`} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.targetLanguage && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.targetLanguage.message}</p>
              )}
              <Textarea
                id="translated-code-output"
                value={translationResult?.translatedCode || ""}
                readOnly
                placeholder="Translated code will appear here..."
                className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm bg-muted/50 border-muted"
              />
            </div>
          </div>
            {form.formState.errors.root?.message && (
             <p className="text-sm text-destructive mt-1 text-center">{form.formState.errors.root.message}</p>
            )}


          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Languages className="mr-2 h-5 w-5" />
              )}
              Translate Code
            </Button>
            <Button type="button" variant="outline" onClick={handleSwapLanguages} className="w-full sm:w-auto">
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Swap Languages
            </Button>
          </div>
        </form>
      </CardContent>

      {isLoading && (
        <CardFooter className="mt-6 border-t pt-6">
          <div className="flex items-center justify-center p-6 w-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Translating your code, please wait...</p>
          </div>
        </CardFooter>
      )}

      {translationResult && !isLoading && translationResult.clientError && (
        <CardFooter className="flex-col items-start space-y-2 mt-6 border-t pt-6">
            <Card className="w-full border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Translation Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-destructive-foreground">{translationResult.clientError}</p>
                </CardContent>
            </Card>
        </CardFooter>
      )}
    </Card>
  );
}
