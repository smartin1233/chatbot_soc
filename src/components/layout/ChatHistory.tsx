// src/components/layout/ChatHistory.tsx
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Trash2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  agentType?: string;
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Fetch chat sessions from API
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/chat/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [toast]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        toast({
          title: "Success",
          description: "Chat session deleted",
        });
      } else {
        throw new Error("Failed to delete session");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  };

  const handleResumeSession = (sessionId: string) => {
    // Navigate to chat with session ID
    router.push(`/chat?session=${sessionId}`);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading chat history...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="mx-auto h-12 w-12" />
        <p className="mt-4">No chat history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold">{session.title}</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleResumeSession(session.id)}
                title="Resume conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteSession(session.id)}
                title="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-2">
            {session.lastMessage}
          </p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
            </span>
            {session.agentType && (
              <Badge variant="outline">{session.agentType}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
