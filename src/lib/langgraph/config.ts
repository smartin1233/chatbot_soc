// src/lib/langgraph/config.ts
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

// Define the state schema for our agents
export const AgentStateSchema = z.object({
messages: z.array(z.object({
role: z.string(),
content: z.string(),
timestamp: z.date().optional(),
})),
context: z.record(z.any()).optional(),
visualizations: z.array(z.object({
type: z.string(),
data: z.any(),
config: z.record(z.any()).optional(),
})).optional(),
awaitingUserInput: z.boolean().default(false),
userInputPrompt: z.string().optional(),
modelParameters: z.record(z.any()).optional(),
dataFrequency: z.string().optional(),
});

// Create a memory saver for conversation history
export const memory = new MemorySaver();

// Initialize OpenAI models
export const gpt4o = new ChatOpenAI({
modelName: "gpt-4o",
temperature: 0.7,
streaming: true,
});

export const gpt4oMini = new ChatOpenAI({
modelName: "gpt-4o-mini",
temperature: 0.7,
streaming: true,
});
