// src/components/code-block.tsx
import type { DetectErrorsOutput } from '@/ai/flows/detect-errors';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  errors?: DetectErrorsOutput['errors'];
  className?: string;
}

export function CodeBlock({ code, language, errors = [], className }: CodeBlockProps) {
  const lines = code.split('\n');
  const errorLines = new Set(errors.map(err => err.line));

  return (
    <div className={cn("bg-card p-4 rounded-md shadow overflow-x-auto text-sm", className)}>
      {language && (
        <div className="mb-2 text-xs text-muted-foreground">
          Language: {language}
        </div>
      )}
      <pre className="font-mono">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isErrorLine = errorLines.has(lineNumber);
          return (
            <div
              key={lineNumber}
              className={cn(
                "flex",
                isErrorLine ? "bg-red-500/20 dark:bg-red-900/30" : ""
              )}
            >
              <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">
                {lineNumber}
              </span>
              <code className="flex-1 whitespace-pre-wrap break-all">{line}</code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
