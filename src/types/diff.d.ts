// src/types/diff.d.ts
declare module 'diff' {
  export interface Change {
    value: string;
    added?: boolean;
    removed?: boolean;
    count?: number;
  }

  export function diffChars(oldStr: string, newStr: string, options?: DiffOptions): Change[];
  export function diffWords(oldStr: string, newStr: string, options?: DiffOptions): Change[];
  export function diffWordsWithSpace(oldStr: string, newStr: string, options?: DiffOptions): Change[];
  export function diffLines(oldStr: string, newStr: string, options?: DiffOptions | LinesOptions): Change[];
  export function diffTrimmedLines(oldStr: string, newStr: string, options?: DiffOptions | LinesOptions): Change[];
  export function diffSentences(oldStr: string, newStr: string, options?: DiffOptions): Change[];

  export function diffCss(oldStr: string, newStr: string, options?: DiffOptions): Change[];
  export function diffJson(oldObj: object | string, newObj: object | string, options?: DiffOptions | LinesOptions): Change[];
  
  export function diffArrays<T>(oldArr: T[], newArr: T[], options?: ArrayOptions<T, T>): Change[];

  export function createTwoFilesPatch(oldFileName: string, newFileName: string, oldStr: string, newStr: string, oldHeader?: string, newHeader?: string, options?: PatchOptions): string;
  export function createPatch(fileName: string, oldStr: string, newStr: string, oldHeader?: string, newHeader?: string, options?: PatchOptions): string;
  export function applyPatch(source: string, patch: string | PatchResult | ReadonlyArray<PatchResult>, options?: ApplyPatchOptions): string | false;
  export function applyPatches(patches: ReadonlyArray<PatchResult>, options?: ApplyPatchOptions): string | false; // This seems to be missing or misdocumented in original @types/diff for multiple patches. Check library source.
  
  export function parsePatch(diffStr: string, options?: ParsePatchOptions): PatchResult[];

  export interface DiffOptions {
    ignoreCase?: boolean;
  }

  export interface LinesOptions extends DiffOptions {
    newlineIsToken?: boolean;
    ignoreWhitespace?: boolean;
  }
  
  export interface ArrayOptions<TLeft, TRight> {
      comparator?: (left: TLeft, right: TRight) => boolean;
      ignoreCase?: boolean; // Only used by some diff methods internally
  }

  export interface PatchOptions extends LinesOptions {
    context?: number;
  }
  
  export interface ApplyPatchOptions {
    fuzzFactor?: number;
    compareLine?: (lineNumber: number, line: string, operation: '+' | '-' | ' ', patchContent: string) => boolean;
  }

  export interface ParsePatchOptions {
    strict?: boolean;
  }

  export interface Hunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
    linedelimiters?: string[]; // Present in some cases
  }

  export interface PatchResult {
    oldFileName: string;
    newFileName: string;
    oldHeader: string;
    newHeader: string;
    hunks: Hunk[];
    index?: string; // For git style patches
  }
}
