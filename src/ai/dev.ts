
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-fixes.ts';
import '@/ai/flows/detect-language.ts';
import '@/ai/flows/detect-errors.ts';
import '@/ai/flows/execute-code-flow.ts';
