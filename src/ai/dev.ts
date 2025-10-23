import { config } from 'dotenv';
config();

import '@/ai/flows/chatbot-contextual-help.ts';
import '@/ai/flows/chatbot-suggest-tasks.ts';
import '@/ai/flows/chatbot-summarize-data.ts';
import '@/ai/flows/chatbot-generate-report.ts';
import '@/ai/flows/schemas/chatbot-generate-report-schema.ts';
import '@/ai/flows/zentere-auth.ts';
