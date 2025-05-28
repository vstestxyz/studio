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

  const originalAlignedLines: JSX.Element[] = [];
  const modifiedAlignedLines: JSX.Element[] = [];
  let currentOriginalLine = 1;
  let currentModifiedLine = 1;

  // Ensure each line div has a consistent height for alignment.
  // Using text-sm line height. Tailwind's default line height for text-sm is 1.25rem (20px) if base font is 16px.
  // Or, we can use a relative unit like 'calc(1.5em)' which depends on the text-sm font-size.
  // Let's use a class that implies standard line height, or set a min-height.
  const lineBaseClasses = "flex"; 
  // The actual height will be determined by content + padding. For empty lines, we need to enforce it.
  // A common approach for text-sm is a line height of ~1.4-1.6. Let's use min-h-[1.5em] for empty placeholders.
  // text-sm in Tailwind is typically 0.875rem font-size, with a 1.25rem line-height.
  // So, min-h-[1.25rem] would be more precise for placeholder lines.
  const placeholderLineHeightClass = "min-h-[1.25rem]";


  diff.forEach((part, partIndex) => {
    const lines = part.value.split('\n');
    // The last element of split might be an empty string if the value ends with \n,
    // we don't want to render an extra line for it, unless it's the only content (e.g. part.value === "\n")
    const displayLines = (part.value.endsWith('\n') && lines.length > 1 && part.value !== '\n') ? lines.slice(0, -1) : lines;
    
    // Handle case where part.value is just "\n", displayLines becomes ["", ""] and then sliced to [""]
    // which is correct for rendering one line. If part.value is "", displayLines is [""]

    displayLines.forEach((lineContent, lineIndex) => {
      const key = `aligned-${partIndex}-${lineIndex}`;
      const lineKey = `${key}-${lineContent.substring(0,10)}`; // Add a bit more uniqueness

      if (part.removed) {
        originalAlignedLines.push(
          <div key={`orig-${lineKey}`} className={cn(lineBaseClasses, "bg-red-500/20 dark:bg-red-900/30")}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentOriginalLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-placeholder-${lineKey}`} className={cn(lineBaseClasses, placeholderLineHeightClass)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none"></span>
            <code className="flex-1 break-all whitespace-pre-wrap"></code>
          </div>
        );
      } else if (part.added) {
        originalAlignedLines.push(
          <div key={`orig-placeholder-${lineKey}`} className={cn(lineBaseClasses, placeholderLineHeightClass)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none"></span>
            <code className="flex-1 break-all whitespace-pre-wrap"></code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-${lineKey}`} className={cn(lineBaseClasses, "bg-green-500/20 dark:bg-green-900/30")}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentModifiedLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
      } else { // Common line
        originalAlignedLines.push(
          <div key={`orig-${lineKey}`} className={cn(lineBaseClasses)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentOriginalLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-${lineKey}`} className={cn(lineBaseClasses)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentModifiedLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
      }
    });
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Original Pane */}
      <div className="bg-card p-4 rounded-md shadow overflow-x-auto text-sm">
        <h4 className="text-lg font-semibold mb-3 pb-2 border-b text-card-foreground">Original</h4>
        <pre className="font-mono">
          {originalAlignedLines.length > 0 ? originalAlignedLines : <div className={cn(lineBaseClasses, placeholderLineHeightClass)}>&nbsp;</div>}
        </pre>
      </div>

      {/* Modified Pane */}
      <div className="bg-card p-4 rounded-md shadow overflow-x-auto text-sm">
         <h4 className="text-lg font-semibold mb-3 pb-2 border-b text-card-foreground">Modified</h4>
        <pre className="font-mono">
          {modifiedAlignedLines.length > 0 ? modifiedAlignedLines : <div className={cn(lineBaseClasses, placeholderLineHeightClass)}>&nbsp;</div>}
        </pre>
      </div>
    </div>
  );
}
