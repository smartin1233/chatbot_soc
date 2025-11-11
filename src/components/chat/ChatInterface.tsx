// src/components/chat/ChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, VisualizationData } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { VisualizationDisplay } from "./VisualizationDisplay";
import { InputArea } from "./InputArea";
import { UserInputPrompt } from "./UserInputPrompt";
import { useToast } from "@/hooks/use-toast";

export function ChatInterface({ agentId }: { agentId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Check if session ID is in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("session") || uuidv4();
    }
    return uuidv4();
  });
  const [visualizations, setVisualizations] = useState<VisualizationData[]>([]);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, visualizations]);

  const processStream = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let assistantMessage: Message | null = null;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "content") {
              // Streaming content
              if (!assistantMessage) {
                assistantMessage = {
                  id: uuidv4(),
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage!]);
              }

              assistantMessage.content += data.content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage!.id
                    ? { ...msg, content: assistantMessage!.content }
                    : msg
                )
              );
            } else if (data.type === "message") {
              // Complete message
              if (!assistantMessage) {
                assistantMessage = {
                  id: uuidv4(),
                  role: "assistant",
                  content: data.content,
                  timestamp: new Date(),
                  reasoning: data.reasoning,
                };
                setMessages(prev => [...prev, assistantMessage!]);
              } else {
                assistantMessage.content = data.content;
                assistantMessage.reasoning = data.reasoning;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage!.id
                      ? {
                        ...msg,
                        content: assistantMessage!.content,
                        reasoning: assistantMessage!.reasoning
                      }
                      : msg
                  )
                );
              }
            } else if (data.type === "visualization") {
              // Add visualization
              setVisualizations(prev => [...prev, data.visualization]);
            } else if (data.type === "await_input") {
              // Show input prompt
              setAwaitingInput(true);
              setInputPrompt(data.prompt);
            } else if (data.type === "error") {
              toast({
                title: "Error",
                description: data.error,
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error);
          }
        }
      }
    }
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setVisualizations([]);
    setAwaitingInput(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
          sessionId,
          agentId,
          workflowType: agentId === "forecasting" ? "forecasting" : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (response.body) {
        await processStream(response.body);
      } else {
        throw new Error("No response body");
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, an error occurred while processing your request.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleUserInput = async (userInput: string) => {
    await sendMessage(userInput);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === "user"}
          />
        ))}
        {visualizations.length > 0 && (
          <div className="space-y-4">
            {visualizations.map((viz, index) => (
              <VisualizationDisplay
                key={index}
                visualization={viz}
              />
            ))}
          </div>
        )}
        {awaitingInput && (
          <UserInputPrompt
            prompt={inputPrompt}
            onSubmit={handleUserInput}
            onCancel={() => setAwaitingInput(false)}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        {!awaitingInput && (
          <InputArea
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
