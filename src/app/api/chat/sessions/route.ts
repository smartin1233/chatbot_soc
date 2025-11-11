// src/app/api/chat/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/prisma/service";

export async function GET(request: NextRequest) {
try {
const { searchParams } = new URL(request.url);
const userId = searchParams.get("userId");

if (!userId) {
return NextResponse.json(
{ error: "User ID is required" },
{ status: 400 }
);
}

// Get all unique sessions for the user
const sessions = await dbService.getUserSessions(userId);

return NextResponse.json({ sessions });
} catch (error) {
console.error("Error fetching chat sessions:", error);
return NextResponse.json(
{ error: "Failed to fetch chat sessions" },
{ status: 500 }
);
}
}
