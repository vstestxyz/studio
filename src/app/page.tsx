
import { TestClassGeneratorForm } from '@/components/test-class-generator-form'; // Updated import
import { CodeCompareForm } from '@/components/code-compare-form';
import { CodeRunnerForm } from '@/components/code-runner-form';
import { CodeTranslatorForm } from '@/components/code-translator-form';
import { CodeFixForm } from '@/components/code-fix-form'; // Corrected: was CodeFixForm
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, GitCompareArrows, TerminalSquare, Languages, TestTubeDiagonal } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><path d="M11 3H8.5L7 2.5S4.5 4 5 8s5 6 5 6l1.5-1L11 3z"/></svg>
              Code Utility Suite
            </CardTitle>
            <CardDescription>
              Your intelligent assistant for code correction, comparison, execution, translation, and test class generation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="code-fix" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="code-fix" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> CodeFix AI
            </TabsTrigger>
            <TabsTrigger value="code-compare" className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4" /> Text/Code Compare
            </TabsTrigger>
            <TabsTrigger value="code-runner" className="flex items-center gap-2">
              <TerminalSquare className="h-4 w-4" /> Code Runner
            </TabsTrigger>
            <TabsTrigger value="code-translator" className="flex items-center gap-2">
              <Languages className="h-4 w-4" /> AI Translator
            </TabsTrigger>
            <TabsTrigger value="test-class-generator" className="flex items-center gap-2"> {/* Updated value and text */}
              <TestTubeDiagonal className="h-4 w-4" /> Test Class Gen
            </TabsTrigger>
          </TabsList>
          <TabsContent value="code-fix">
            <CodeFixForm />
          </TabsContent>
          <TabsContent value="code-compare">
            <CodeCompareForm />
          </TabsContent>
          <TabsContent value="code-runner">
            <CodeRunnerForm />
          </TabsContent>
          <TabsContent value="code-translator">
            <CodeTranslatorForm />
          </TabsContent>
          <TabsContent value="test-class-generator"> {/* Updated value */}
            <TestClassGeneratorForm /> {/* Updated component */}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
