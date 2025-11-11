// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ContextualChatAgent } from "@/lib/langgraph/agents/contextualChat";
import { ForecastingPipeline } from "@/lib/langgraph/pipelines/forecasting";
import { dbService } from "@/lib/prisma/service";
import { z } from "zod";

const ChatRequestSchema = z.object({
message: z.string(),
sessionId: z.string(),
userId: z.string().optional(),
agentId: z.string().optional(),
workflowType: z.string().optional(),
modelParameters: z.record(z.any()).optional(),
dataFrequency: z.string().optional(),
});

export async function POST(request: NextRequest) {
try {
const body = await request.json();
const {
message,
sessionId,
userId,
agentId,
workflowType,
modelParameters,
dataFrequency
} = ChatRequestSchema.parse(body);

// Save user message to database
await dbService.createConversation({
sessionId,
userId,
agentId,
messageType: "user",
content: message,
});

// Create a readable stream for the response
const encoder = new TextEncoder();
const stream = new ReadableStream({
async start(controller) {
try {
// Determine if this is a forecasting request
const isForecastingRequest = workflowType === "forecasting" ||
message.toLowerCase().includes("forecast") ||
message.toLowerCase().includes("predict");

let agent;
if (isForecastingRequest) {
// Use the forecasting pipeline
agent = new ForecastingPipeline();
} else {
// Use the contextual chat agent
agent = new ContextualChatAgent();
}

// Compile the agent
const app = agent.compile();

// Initialize state
const state = {
messages: [
{
role: "user",
content: message,
timestamp: new Date(),
}
],
context: {
modelParameters,
dataFrequency,
},
visualizations: [],
awaitingUserInput: false,
userInputPrompt: "",
};

// Run the agent with streaming
const eventStream = await app.streamEvents(state, {
version: "v1",
});

let fullResponse = "";
let reasoning = "";
let visualizations = [];
let awaitingInput = false;
let inputPrompt = "";

for await (const event of eventStream) {
if (event.event === "on_chat_model_stream") {
const chunk = event.data;
if (chunk.content) {
fullResponse += chunk.content;

// Send the chunk to the client
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({
type: "content",
content: chunk.content,
})}\n\n`
)
);
}
} else if (event.event === "on_chat_model_end") {
const { output } = event.data;
if (output) {
fullResponse = output.messages?.[output.messages.length - 1]?.content || "";

// Send the complete message to the client
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({
type: "message",
content: fullResponse,
reasoning: output.context?.reasoning,
})}\n\n`
)
);
}
} else if (event.name === "visualization") {
const vizData = event.data;
visualizations.push(vizData);

// Send the visualization to the client
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({
type: "visualization",
visualization: vizData,
})}\n\n`
)
);
} else if (event.name === "await_user_input") {
awaitingInput = true;
inputPrompt = event.data.userInputPrompt || "";

// Send the input prompt to the client
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({
type: "await_input",
prompt: inputPrompt,
})}\n\n`
)
);
}
}

// Save agent response to database
await dbService.createConversation({
sessionId,
userId,
agentId,
messageType: "agent",
content: fullResponse,
reasoning,
});

// Signal the end of the stream
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({ type: "done" })}\n\n`
)
);
} catch (error) {
console.error("Error in chat stream:", error);
controller.enqueue(
encoder.encode(
`data: ${JSON.stringify({
type: "error",
error: "An error occurred while processing your request.",
})}\n\n`
)
);
} finally {
controller.close();
}
},
});

return new NextResponse(stream, {
headers: {
"Content-Type": "text/event-stream",
"Cache-Control": "no-cache",
"Connection": "keep-alive",
},
});
} catch (error) {
console.error("Error in chat API:", error);
return NextResponse.json(
{ error: "Invalid request format" },
{ status: 400 }
);
}
}
