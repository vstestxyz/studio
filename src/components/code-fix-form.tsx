
// src/components/code-fix-form.tsx
"use client";

import { useState, useRef, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { analyzeCode, type AnalysisResult, type ActionResponse } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/code-block';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Copy, Download, Sparkles, Loader2, AlertTriangle, Wrench, Play, Share2 } from 'lucide-react';

const FormSchema = z.object({
  code: z.string().min(1, "Code cannot be empty."),
});

type FormData = z.infer<typeof FormSchema>;

export function CodeFixForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
    },
  });

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue("code", text);
        toast({ title: "File loaded", description: `${file.name} loaded successfully.` });
      };
      reader.readAsText(file);
    }
     // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setActionError(null);
    try {
      const response: ActionResponse = await analyzeCode(data.code);
      if (response.success && response.data) {
        setAnalysisResult(response.data);
        toast({ title: "Analysis Complete", description: `Language: ${response.data.language}` });
      } else {
        setActionError(response.error || "An unknown error occurred.");
        toast({ title: "Analysis Failed", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze code.";
      setActionError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (codeToCopy: string, type: string) => {
    navigator.clipboard.writeText(codeToCopy)
      .then(() => toast({ title: "Copied to clipboard!", description: `${type} code copied.` }))
      .catch(() => toast({ title: "Copy failed", description: "Could not copy code to clipboard.", variant: "destructive" }));
  };

  const handleDownloadCode = (codeToDownload: string, language: string) => {
    const extensionMap: { [key: string]: string } = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      typescript: 'ts',
      go: 'go',
      ruby: 'rb',
      php: 'php',
    };
    const fileExtension = extensionMap[language.toLowerCase()] || 'txt';
    const fileName = `corrected_code.${fileExtension}`;
    
    const blob = new Blob([codeToDownload], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: `${fileName} is downloading.` });
  };

  const handleRunCodePlaceholder = () => {
    toast({
      title: "Feature Not Implemented",
      description: "The 'Run Code' functionality is not yet available.",
      variant: "default",
    });
  };

  const handleShareLinkPlaceholder = () => {
    toast({
      title: "Feature Not Implemented",
      description: "The 'Share Link' functionality is not yet available.",
      variant: "default",
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Wrench className="mr-2 h-6 w-6 text-primary" /> CodeFix AI
        </CardTitle>
        <CardDescription>
          Enter your code snippet, and let our AI detect the language, find errors, and suggest corrections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="code-input" className="text-lg font-semibold mb-2 block">Your Code</Label>
            <Textarea
              id="code-input"
              {...form.register("code")}
              placeholder="Paste your code here or upload a file..."
              className="min-h-[200px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              aria-invalid={form.formState.errors.code ? "true" : "false"}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload File
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.js,.py,.java,.cs,.cpp,.c,.html,.css,.ts,.tsx,.json,.md,.*"
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto flex-grow sm:flex-grow-0">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Analyze Code
            </Button>
          </div>
        </form>
      </CardContent>
    

      {isLoading && (
        <Card className="flex items-center justify-center p-10 mt-6 border-t">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Analyzing your code, please wait...</p>
        </Card>
      )}

      {actionError && !isLoading && (
         <Card className="border-destructive bg-destructive/10 mt-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{actionError}</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && !isLoading && (
        <div className="space-y-8 mt-6 border-t pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Detected Language: <span className="font-semibold text-primary">{analysisResult.language}</span></CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Original Code & Detected Errors</CardTitle>
              {analysisResult.detectedErrors.length === 0 && (
                <CardDescription>No errors detected in the original code.</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <CodeBlock 
                code={analysisResult.originalCode} 
                language={analysisResult.language}
                errors={analysisResult.detectedErrors} 
              />
              {analysisResult.detectedErrors.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Error Details:</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {analysisResult.detectedErrors.map((err, idx) => (
                      <li key={idx} className="text-destructive">
                        Line {err.line}: [{err.severity}] {err.errorType} - {err.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-success/50">
            <CardHeader>
              <CardTitle className="text-success">Fix Summary &amp; AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm font-mono p-3 bg-success/10 rounded-md">
                {analysisResult.suggestions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corrected Code</CardTitle>
              <CardDescription>AI-generated corrected version of your code.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={analysisResult.correctedCode} language={analysisResult.language} />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleCopyCode(analysisResult.correctedCode, "Corrected")}>
                <Copy className="mr-2 h-4 w-4" /> Copy Corrected Code
              </Button>
              <Button variant="outline" onClick={() => handleDownloadCode(analysisResult.correctedCode, analysisResult.language)}>
                <Download className="mr-2 h-4 w-4" /> Download Corrected Code
              </Button>
              <Button variant="outline" onClick={handleRunCodePlaceholder}>
                <Play className="mr-2 h-4 w-4" /> Run Code
              </Button>
              <Button variant="outline" onClick={handleShareLinkPlaceholder}>
                <Share2 className="mr-2 h-4 w-4" /> Share Link
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </Card>
  );
}

