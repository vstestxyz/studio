// src/components/test-class-generator-form.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TestTubeDiagonal, Loader2, AlertTriangle, FileText, Copy } from 'lucide-react';
import { generateUnitTests, type GenerateUnitTestsOutput } from '@/lib/actions';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'apex', label: 'Apex' }, // Added Apex
] as const;

const FRAMEWORKS: Record<typeof LANGUAGES[number]['value'], { value: string; label: string }[]> = {
  python: [
    { value: 'pytest', label: 'PyTest' },
    { value: 'unittest', label: 'Unittest' },
  ],
  javascript: [
    { value: 'jest', label: 'Jest' },
    { value: 'mocha', label: 'Mocha' },
  ],
  typescript: [
    { value: 'jest', label: 'Jest (with TypeScript)' },
    { value: 'vitest', label: 'Vitest' },
  ],
  java: [
    { value: 'junit5', label: 'JUnit 5' },
    { value: 'testng', label: 'TestNG' },
  ],
  csharp: [
    { value: 'xunit', label: 'xUnit' },
    { value: 'nunit', label: 'NUnit' },
    { value: 'mstest', label: 'MSTest' },
  ],
  go: [
    { value: 'testing', label: 'Go Standard Library (testing)' },
  ],
  apex: [ // Added Apex frameworks
    { value: 'apex_test_classes', label: 'Apex Test Classes (@isTest)' },
  ],
};

type LanguageValue = typeof LANGUAGES[number]['value'];

const FormSchema = z.object({
  sourceCode: z.string().min(1, "Source code cannot be empty."),
  language: z.custom<LanguageValue>(val => LANGUAGES.some(lang => lang.value === val), "Please select a language."),
  framework: z.string().min(1, "Please select a testing framework."),
  includeExplanation: z.boolean().default(false),
});

type FormData = z.infer<typeof FormSchema>;

interface TestGenerationResult extends GenerateUnitTestsOutput {
  clientError?: string;
}

export function TestClassGeneratorForm() { // Renamed component
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generationResult, setGenerationResult] = useState<TestGenerationResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sourceCode: "",
      language: "python",
      framework: FRAMEWORKS.python[0].value,
      includeExplanation: false,
    },
  });

  const selectedLanguage = form.watch("language");

  // Effect to update framework when language changes
  useEffect(() => {
    if (selectedLanguage) {
      const availableFrameworks = FRAMEWORKS[selectedLanguage];
      if (availableFrameworks && availableFrameworks.length > 0) {
        const currentFramework = form.getValues("framework");
        // Check if current framework is valid for new language
        if (!availableFrameworks.some(fw => fw.value === currentFramework)) {
          form.setValue("framework", availableFrameworks[0].value, { shouldValidate: true });
        }
      } else {
        form.setValue("framework", "", { shouldValidate: true }); // No frameworks, clear selection
      }
    }
  }, [selectedLanguage, form]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setGenerationResult(null);

    try {
      const response = await generateUnitTests({
        sourceCode: data.sourceCode,
        language: data.language,
        framework: data.framework,
        includeExplanation: data.includeExplanation,
      });

      if (response.success && response.data) {
        setGenerationResult(response.data);
        toast({ title: "Test Suite Generation Complete", description: "Generated test suite is shown below." });
      } else {
        setGenerationResult({ clientError: response.error || "An unknown error occurred.", unitTests: "" });
        toast({ title: "Test Suite Generation Failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate test suite.";
      setGenerationResult({ clientError: errorMessage, unitTests: "" });
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string | undefined, type: string) => {
    if (!text) {
      toast({ title: `No ${type} to copy`, variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: `${type} Copied!`, description: `The ${type.toLowerCase()} have been copied to your clipboard.` }))
      .catch(err => toast({ title: `Copy Failed`, description: `Could not copy ${type.toLowerCase()}.`, variant: "destructive" }));
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <TestTubeDiagonal className="mr-2 h-6 w-6 text-primary" /> AI Test Class Generator
        </CardTitle>
        <CardDescription>
          Provide your code, select language and framework, and let AI generate comprehensive test classes/suites, including mocks and diverse test cases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="source-code-input-tests" className="text-lg font-semibold mb-2 block">Source Code</Label>
            <Textarea
              id="source-code-input-tests"
              {...form.register("sourceCode")}
              placeholder="Paste your function, class, or code snippet here..."
              className="min-h-[200px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              aria-invalid={form.formState.errors.sourceCode ? "true" : "false"}
            />
            {form.formState.errors.sourceCode && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.sourceCode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="language-select-tests" className="text-lg font-semibold mb-2 block">Language</Label>
              <Controller
                control={form.control}
                name="language"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as LanguageValue);
                      // Framework will be updated by the useEffect hook
                    }}
                  >
                    <SelectTrigger id="language-select-tests">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={`lang-${lang.value}`} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.language && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.language.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="framework-select-tests" className="text-lg font-semibold mb-2 block">Testing Framework</Label>
              <Controller
                control={form.control}
                name="framework"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedLanguage || !FRAMEWORKS[selectedLanguage]?.length}
                  >
                    <SelectTrigger id="framework-select-tests">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLanguage && FRAMEWORKS[selectedLanguage]?.map(fw => (
                        <SelectItem key={`fw-${fw.value}`} value={fw.value}>
                          {fw.label}
                        </SelectItem>
                      ))}
                      {(!selectedLanguage || !FRAMEWORKS[selectedLanguage]?.length) && (
                        <SelectItem value="" disabled>No frameworks available for selected language</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.framework && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.framework.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
                name="includeExplanation"
                control={form.control}
                render={({ field }) => (
                    <Checkbox
                        id="include-explanation-checkbox"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Label htmlFor="include-explanation-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Include Explanations
            </Label>
          </div>


          <div className="flex justify-start pt-2">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <TestTubeDiagonal className="mr-2 h-5 w-5" />
              )}
              Generate Test Suite
            </Button>
          </div>
        </form>
      </CardContent>

      {isLoading && (
        <CardFooter className="mt-6 border-t pt-6">
          <div className="flex items-center justify-center p-6 w-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Generating test suite, please wait...</p>
          </div>
        </CardFooter>
      )}

      {generationResult && !isLoading && (
        <CardFooter className="flex-col items-start space-y-6 mt-6 border-t pt-6">
          {generationResult.clientError && (
             <Card className="w-full border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Generation Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-destructive-foreground">{generationResult.clientError}</p>
                </CardContent>
            </Card>
          )}

          {!generationResult.clientError && generationResult.unitTests && (
            <Card className="w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" /> Generated Test Suite
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generationResult.unitTests, "Test Suite")}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Test Suite
                    </Button>
                </div>
                <CardDescription>
                    Framework: <span className="font-semibold text-primary">{FRAMEWORKS[form.getValues("language")]?.find(f => f.value === form.getValues("framework"))?.label || form.getValues("framework")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generationResult.unitTests}
                  readOnly
                  placeholder="Generated unit tests will appear here..."
                  className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm bg-muted/50 border-muted"
                />
              </CardContent>
            </Card>
          )}

          {!generationResult.clientError && generationResult.explanation && (
            <Card className="w-full">
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-accent" /> Test Explanations
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generationResult.explanation, "Explanations")}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Explanations
                    </Button>
                 </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generationResult.explanation}
                  readOnly
                  placeholder="Explanations for the generated tests..."
                  className="min-h-[150px] font-mono text-sm p-3 rounded-md shadow-sm bg-muted/50 border-muted"
                />
              </CardContent>
            </Card>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
