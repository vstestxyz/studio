// src/components/diff-display.tsx
import { cn } from '@/lib/utils';
import { type Change as DiffChange, diffChars } from 'diff';

// Note: DiffPart is now DiffChange from the 'diff' library directly
// export interface DiffPart {
//   value: string;
//   added?: boolean;
//   removed?: boolean;
//   count?: number; 
// }

interface DiffDisplayProps {
  diff: DiffChange[];
}

// Helper function to robustly split lines
function getDisplayLines(value: string): string[] {
  if (value === "") return [""]; // Treat an empty diff part value as a single empty line for consistent processing
  const lines = value.split('\n');
  // If value ends with \n (e.g., "a\n", "a\nb\n", "\n"), split produces an extra empty string.
  // For "a\n", we want ["a"]. For "\n", we want [""] (representing one empty line).
  if (value.endsWith('\n')) {
    return lines.slice(0, -1);
  }
  // If value doesn't end with \n (e.g., "a"), split is correct.
  return lines;
}


export function DiffDisplay({ diff }: DiffDisplayProps) {
  if (!diff || diff.length === 0) {
    return <p className="text-muted-foreground">No differences to display, or texts are identical.</p>;
  }

  const originalAlignedLines: JSX.Element[] = [];
  const modifiedAlignedLines: JSX.Element[] = [];
  let currentOriginalLine = 1;
  let currentModifiedLine = 1;

  const lineBaseClasses = "flex";
  const placeholderLineHeightClass = "min-h-[1.25rem]"; // Corresponds to text-sm line height

  let i = 0;
  while (i < diff.length) {
    const part = diff[i];
    const nextPart = (i + 1 < diff.length) ? diff[i + 1] : null;

    // Check for a modified block: current part is removed, next part is added,
    // and they both represent the same number of lines (part.count).
    if (part.removed && nextPart && nextPart.added && part.count === nextPart.count && part.count && part.count > 0) {
      const originalChangeLines = getDisplayLines(part.value);
      const modifiedChangeLines = getDisplayLines(nextPart.value);

      // This condition should ideally always be true if part.count matches,
      // but as a safeguard for getDisplayLines behavior:
      if (originalChangeLines.length === modifiedChangeLines.length) {
        for (let j = 0; j < originalChangeLines.length; j++) {
          const originalLineText = originalChangeLines[j];
          const modifiedLineText = modifiedChangeLines[j];
          const charDiffs = diffChars(originalLineText, modifiedLineText);

          const originalLineKey = `orig-mod-${currentOriginalLine}`;
          const modifiedLineKey = `mod-mod-${currentModifiedLine}`;
          
          originalAlignedLines.push(
            <div key={originalLineKey} className={cn(lineBaseClasses, "bg-yellow-100 dark:bg-yellow-900/30")}>
              <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentOriginalLine++}</span>
              <code className="flex-1 break-all whitespace-pre-wrap">
                {charDiffs.map((charPart, charIdx) => (
                  !charPart.added && ( // Only show original and removed parts on the original side
                    <span key={`${originalLineKey}-char-${charIdx}`} className={cn({
                      'bg-red-500/50 dark:bg-red-700/60 text-red-950 dark:text-red-200': charPart.removed,
                    })}>
                      {charPart.value}
                    </span>
                  )
                ))}
              </code>
            </div>
          );

          modifiedAlignedLines.push(
            <div key={modifiedLineKey} className={cn(lineBaseClasses, "bg-yellow-100 dark:bg-yellow-900/30")}>
              <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentModifiedLine++}</span>
              <code className="flex-1 break-all whitespace-pre-wrap">
                {charDiffs.map((charPart, charIdx) => (
                  !charPart.removed && ( // Only show original and added parts on the modified side
                    <span key={`${modifiedLineKey}-char-${charIdx}`} className={cn({
                      'bg-green-500/50 dark:bg-green-700/60 text-green-950 dark:text-green-200': charPart.added,
                    })}>
                      {charPart.value}
                    </span>
                  )
                ))}
              </code>
            </div>
          );
        }
        i += 2; // Consumed two parts (current and next)
        continue; // Continue to next iteration of the while loop
      }
    }

    // Handle purely added, removed, or common lines if not treated as modified block
    const displayLines = getDisplayLines(part.value);

    displayLines.forEach((lineContent, lineIndex) => {
      const keySuffix = `${i}-${lineIndex}`;
      if (part.removed) {
        originalAlignedLines.push(
          <div key={`orig-rem-${keySuffix}-${currentOriginalLine}`} className={cn(lineBaseClasses, "bg-red-500/20 dark:bg-red-900/30")}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentOriginalLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-placeholder-rem-${keySuffix}-${currentOriginalLine -1 }`} className={cn(lineBaseClasses, placeholderLineHeightClass)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none"></span>
            <code className="flex-1 break-all whitespace-pre-wrap"></code>
          </div>
        );
      } else if (part.added) {
        originalAlignedLines.push(
          <div key={`orig-placeholder-add-${keySuffix}-${currentModifiedLine}`} className={cn(lineBaseClasses, placeholderLineHeightClass)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none"></span>
            <code className="flex-1 break-all whitespace-pre-wrap"></code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-add-${keySuffix}-${currentModifiedLine}`} className={cn(lineBaseClasses, "bg-green-500/20 dark:bg-green-900/30")}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentModifiedLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
      } else { // Common line
        originalAlignedLines.push(
          <div key={`orig-com-${keySuffix}-${currentOriginalLine}`} className={cn(lineBaseClasses)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentOriginalLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
        modifiedAlignedLines.push(
          <div key={`mod-com-${keySuffix}-${currentModifiedLine}`} className={cn(lineBaseClasses)}>
            <span className="inline-block w-10 pr-2 text-right text-muted-foreground select-none">{currentModifiedLine++}</span>
            <code className="flex-1 break-all whitespace-pre-wrap">{lineContent}</code>
          </div>
        );
      }
    });
    i++; // Consumed one part
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <div className="bg-card p-4 rounded-md shadow overflow-x-auto text-sm">
        <h4 className="text-lg font-semibold mb-3 pb-2 border-b text-card-foreground">Original</h4>
        <pre className="font-mono">
          {originalAlignedLines.length > 0 ? originalAlignedLines : <div className={cn(lineBaseClasses, placeholderLineHeightClass)}>&nbsp;</div>}
        </pre>
      </div>
      <div className="bg-card p-4 rounded-md shadow overflow-x-auto text-sm">
         <h4 className="text-lg font-semibold mb-3 pb-2 border-b text-card-foreground">Modified</h4>
        <pre className="font-mono">
          {modifiedAlignedLines.length > 0 ? modifiedAlignedLines : <div className={cn(lineBaseClasses, placeholderLineHeightClass)}>&nbsp;</div>}
        </pre>
      </div>
    </div>
  );
}
