// src/components/diff-display.tsx
import { cn } from '@/lib/utils';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
  count?: number; // count is part of the 'diff' library's Change object
}

interface DiffDisplayProps {
  diff: DiffPart[];
}

export function DiffDisplay({ diff }: DiffDisplayProps) {
  if (!diff || diff.length === 0) {
    return <p className="text-muted-foreground">No differences to display, or texts are identical.</p>;
  }

  let originalLineNum = 1;
  let modifiedLineNum = 1;

  return (
    <div className="bg-card p-4 rounded-md shadow overflow-x-auto text-sm w-full">
      <pre className="font-mono whitespace-pre-wrap">
        {diff.map((part, index) => {
          const lines = part.value.split('\n');
          // The last element of split might be an empty string if the value ends with \n,
          // we don't want to render an extra line for it.
          const displayLines = part.value.endsWith('\n') ? lines.slice(0, -1) : lines;

          return displayLines.map((line, lineIndex) => {
            let displayOriginalLineNum = '';
            let displayModifiedLineNum = '';
            let lineClass = '';

            if (part.added) {
              lineClass = 'bg-green-500/20 dark:bg-green-900/30';
              displayModifiedLineNum = (modifiedLineNum++).toString();
            } else if (part.removed) {
              lineClass = 'bg-red-500/20 dark:bg-red-900/30';
              displayOriginalLineNum = (originalLineNum++).toString();
            } else { // Common line
              lineClass = 'bg-transparent';
              displayOriginalLineNum = (originalLineNum++).toString();
              displayModifiedLineNum = (modifiedLineNum++).toString();
            }
            
            // Ensure consistent line number column width
            const originalNumCol = displayOriginalLineNum.padStart(4, ' ');
            const modifiedNumCol = displayModifiedLineNum.padStart(4, ' ');
            
            const prefix = part.added ? '+' : part.removed ? '-' : ' ';

            return (
              <div key={`${index}-${lineIndex}`} className={cn("flex", lineClass)}>
                <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{originalNumCol}</span>
                <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{modifiedNumCol}</span>
                <span className={cn("inline-block w-4 text-center", {
                  "text-green-700 dark:text-green-400": part.added,
                  "text-red-700 dark:text-red-400": part.removed,
                })}>
                  {prefix}
                </span>
                <code className="flex-1 break-all">{line}</code>
              </div>
            );
          });
        })}
      </pre>
    </div>
  );
}
