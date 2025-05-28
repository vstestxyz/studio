// src/components/code-compare-form.tsx
"use client";

import { useState, useRef, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DiffDisplay, type DiffPart } from '@/components/diff-display';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, GitCompareArrows, Scale } from 'lucide-react';
import { diffLines } from 'diff';

export function CodeCompareForm() {
  const { toast } = useToast();
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [diffResult, setDiffResult] = useState<DiffPart[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const modifiedFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, setText: (text: string) => void, fieldName: string) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setText(text);
        toast({ title: "File loaded", description: `${file.name} loaded into ${fieldName}.` });
      };
      reader.readAsText(file);
    }
     // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCompare = () => {
    if (!originalText.trim() && !modifiedText.trim()) {
      toast({
        title: "Input Missing",
        description: "Please provide text in at least one of the input fields.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    // Simulate API delay for loading state if needed, otherwise direct diff
    setTimeout(() => {
      const differences = diffLines(originalText, modifiedText);
      setDiffResult(differences as DiffPart[]); // Cast because 'diff' library types might not exactly match DiffPart
      setIsLoading(false);
      toast({ title: "Comparison Complete", description: "Differences are highlighted below." });
    }, 500); // Simulate a short processing time
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Scale className="mr-2 h-6 w-6 text-primary" /> Smart Text/Code Comparison
        </CardTitle>
        <CardDescription>
          Enter two blocks of text or code to see the differences. Upload files or paste directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Text Input */}
          <div className="space-y-2">
            <Label htmlFor="original-text-input" className="text-lg font-semibold">Original Text/Code</Label>
            <Textarea
              id="original-text-input"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste original text/code here or upload a file..."
              className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
            <Button type="button" variant="outline" onClick={() => originalFileInputRef.current?.click()} className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Original File
            </Button>
            <Input
              type="file"
              ref={originalFileInputRef}
              onChange={(e) => handleFileUpload(e, setOriginalText, "Original Text")}
              className="hidden"
              accept=".txt,.js,.py,.java,.cs,.cpp,.c,.html,.css,.ts,.tsx,.json,.md,.*"
            />
          </div>

          {/* Modified Text Input */}
          <div className="space-y-2">
            <Label htmlFor="modified-text-input" className="text-lg font-semibold">Modified Text/Code</Label>
            <Textarea
              id="modified-text-input"
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Paste modified text/code here or upload a file..."
              className="min-h-[250px] font-mono text-sm p-3 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
            <Button type="button" variant="outline" onClick={() => modifiedFileInputRef.current?.click()} className="w-full sm:w-auto">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Modified File
            </Button>
            <Input
              type="file"
              ref={modifiedFileInputRef}
              onChange={(e) => handleFileUpload(e, setModifiedText, "Modified Text")}
              className="hidden"
              accept=".txt,.js,.py,.java,.cs,.cpp,.c,.html,.css,.ts,.tsx,.json,.md,.*"
            />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={handleCompare} disabled={isLoading} size="lg">
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <GitCompareArrows className="mr-2 h-5 w-5" />
            )}
            Compare Texts
          </Button>
        </div>
      </CardContent>

      {diffResult && !isLoading && (
        <CardFooter className="flex-col items-start space-y-4 pt-6 border-t">
          <h3 className="text-xl font-semibold">Comparison Result:</h3>
          <DiffDisplay diff={diffResult} />
        </CardFooter>
      )}
    </Card>
  );
}
