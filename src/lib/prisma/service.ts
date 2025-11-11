// src/lib/prisma/service.ts
import { prisma } from './client';
import {
Conversation,
Agent,
Workflow,
UserData,
ConversationCreate,
AgentCreate,
WorkflowCreate,
UserDataCreate
} from '@/types/database';
import { Prisma } from '@prisma/client';

export class DatabaseService {
async createConversation(data: ConversationCreate): Promise<Conversation> {
try {
return await prisma.conversation.create({ data });
} catch (error) {
console.error('Failed to create conversation:', error);
throw error;
}
}

// ... existing methods ...

// Get all unique sessions for a user
async getUserSessions(userId: string): Promise<any[]> {
try {
const sessions = await prisma.$queryRaw`
SELECT
c.session_id as id,
MIN(c.content) as title,
MAX(c.content) as lastMessage,
MAX(c.timestamp) as timestamp,
a.name as agentType
FROM conversations c
LEFT JOIN agents a ON c.agent_id = a.id
WHERE c.user_id = ${userId}
GROUP BY c.session_id, a.name
ORDER BY timestamp DESC
LIMIT 50
`;

return sessions as any[];
} catch (error) {
console.error('Failed to get user sessions:', error);
throw error;
}
}

// Delete a session and all its conversations
async deleteSession(sessionId: string): Promise<void> {
try {
await prisma.conversation.deleteMany({
where: { sessionId }
});
} catch (error) {
console.error('Failed to delete session:', error);
throw error;
}
}

// Get a session with all its conversations
async getSession(sessionId: string): Promise<any | null> {
try {
const session = await prisma.conversation.findMany({
where: { sessionId },
orderBy: { timestamp: 'asc' },
include: {
agent: {
select: {
id: true,
name: true,
category: true,
}
}
}
});

if (session.length === 0) {
return null;
}

return {
id: sessionId,
conversations: session,
agent: session[0].agent,
firstMessage: session[0].content,
lastMessage: session[session.length - 1].content,
timestamp: session[session.length - 1].timestamp
};
} catch (error) {
console.error('Failed to get session:', error);
throw error;
}
}

// ... rest of the existing methods ...
}

// Global database service instance
export const dbService = new DatabaseService();
