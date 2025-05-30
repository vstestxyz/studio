
// src/components/code-runner-form.tsx
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
import { Play, Loader2, TerminalSquare, ChevronRight, AlertTriangle } from 'lucide-react';
import { executeCodeSnippet, type ExecuteCodeOutput } from '@/lib/actions'; // Assuming this will be created

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python', extension: 'py', pistonName: 'python', pistonVersion: '3.10.0' },
  { value: 'javascript', label: 'JavaScript', extension: 'js', pistonName: 'javascript', pistonVersion: '18.15.0' },
  { value: 'java', label: 'Java', extension: 'java', pistonName: 'java', pistonVersion: '15.0.2' },
  { value: 'cpp', label: 'C++', extension: 'cpp', pistonName: 'c++', pistonVersion: '10.2.0' },
  // Add more languages here as Piston supports them and as needed
] as const;

type LanguageValue = typeof SUPPORTED_LANGUAGES[number]['value'];

const FormSchema = z.object({
  code: z.string().min(1, "Code cannot be empty."),
  language: z.custom<LanguageValue>(val => SUPPORTED_LANGUAGES.some(lang => lang.value === val), "Please select a language."),
  stdin: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface ExecutionResult extends ExecuteCodeOutput {
  // Combines the flow output with potential client-side error messages
  clientError?: string;
}


export function CodeRunnerForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
      language: "python",
      stdin: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setExecutionResult(null);
    
    const selectedLanguageDetails = SUPPORTED_LANGUAGES.find(l => l.value === data.language);
    if (!selectedLanguageDetails) {
      toast({ title: "Error", description: "Invalid language selected.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await executeCodeSnippet({
        code: data.code,
        language: selectedLanguageDetails.pistonName,
        version: selectedLanguageDetails.pistonVersion, // Pass pistonName and version
        stdin: data.stdin || "",
        files: [{ name: `main.${selectedLanguageDetails.extension}`, content: data.code }]
      });

      if (response.success && response.data) {
        setExecutionResult(response.data);
        toast({ title: "Execution Complete", description: "Check the output below." });
      } else {
        setExecutionResult({ clientError: response.error || "An unknown error occurred during execution." });
        toast({ title: "Execution Failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to execute code.";
      setExecutionResult({ clientError: errorMessage });
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <TerminalSquare className="mr-2 h-6 w-6 text-primary" /> Code Snippet Runner
        </CardTitle>
        <CardDescription>
          Write, run, and test your code snippets. Powered by Piston API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="code-runner-input" className="text-lg font-semibold mb-2 block">Your Code</Label>
            <Textarea
              id="code-runner-input"
              {...form.register("code")}
              placeholder="Enter your code snippet here..."
              className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              aria-invalid={form.formState.errors.code ? "true" : "false"}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language-select" className="text-lg font-semibold mb-2 block">Language</Label>
              <Select
                value={form.watch("language")}
                onValueChange={(value) => form.setValue("language", value as LanguageValue, { shouldValidate: true })}
              >
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.language && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.language.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="stdin-input" className="text-lg font-semibold mb-2 block">Standard Input (stdin)</Label>
              <Textarea
                id="stdin-input"
                {...form.register("stdin")}
                placeholder="Enter standard input for your code (optional)..."
                className="min-h-[100px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Run Code
            </Button>
          </div>
        </form>
      </CardContent>

      {isLoading && (
        <CardFooter className="mt-6 border-t pt-6">
          <div className="flex items-center justify-center p-6 w-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Executing your code, please wait...</p>
          </div>
        </CardFooter>
      )}

      {executionResult && !isLoading && (
        <CardFooter className="flex-col items-start space-y-4 mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold">Execution Output:</h3>
          {executionResult.clientError && (
             <Card className="w-full border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Execution Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-destructive/10 p-3 rounded-md text-destructive-foreground">{executionResult.clientError}</pre>
                </CardContent>
            </Card>
          )}

          {!executionResult.clientError && (
            <>
              {(executionResult.compileStdout || executionResult.compileStderr) && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Compiler Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {executionResult.compileStdout && (
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">Stdout:</Label>
                        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-md mt-1">{executionResult.compileStdout || "N/A"}</pre>
                      </div>
                    )}
                    {executionResult.compileStderr && (
                      <div className="mt-2">
                        <Label className="text-sm font-semibold text-destructive">Stderr:</Label>
                        <pre className="text-sm whitespace-pre-wrap font-mono bg-destructive/10 p-3 rounded-md mt-1 text-destructive-foreground">{executionResult.compileStderr || "N/A"}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Runtime Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Standard Output (stdout):</Label>
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-md mt-1">{executionResult.stdout !== undefined && executionResult.stdout !== "" ? executionResult.stdout : "No output"}</pre>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-destructive">Standard Error (stderr):</Label>
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-destructive/10 p-3 rounded-md mt-1 text-destructive-foreground">{executionResult.stderr !== undefined && executionResult.stderr !== "" ? executionResult.stderr : "No errors"}</pre>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Exit Code:</Label>
                    <p className={`text-sm font-mono p-1 rounded-md mt-1 inline-block ${executionResult.exitCode === 0 ? 'bg-success/20 text-success-foreground' : 'bg-destructive/20 text-destructive-foreground'}`}>
                      {executionResult.exitCode !== undefined ? executionResult.exitCode : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
