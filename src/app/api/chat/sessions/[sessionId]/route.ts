// src/app/api/chat/sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/prisma/service";

export async function DELETE(
request: NextRequest,
{ params }: { params: { sessionId: string } }
) {
try {
const { sessionId } = params;

// Delete all conversations for the session
await dbService.deleteSession(sessionId);

return NextResponse.json({ success: true });
} catch (error) {
console.error("Error deleting chat session:", error);
return NextResponse.json(
{ error: "Failed to delete chat session" },
{ status: 500 }
);
}
}
