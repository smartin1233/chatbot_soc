// src/components/chat/MessageBubble.tsx
"use client";

import { Message } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { VisualizationDisplay } from "./VisualizationDisplay";

interface MessageBubbleProps {
message: Message;
isUser?: boolean;
visualization?: any;
}

export function MessageBubble({ message, isUser = false, visualization }: MessageBubbleProps) {
return (
<div
className={cn(
"flex gap-3 max-w-3xl",
isUser ? "ml-auto" : "mr-auto"
)}
>
{!isUser && (
<Avatar>
<AvatarFallback>AI</AvatarFallback>
</Avatar>
)}
<div className="flex flex-col gap-2">
<div
className={cn(
"rounded-lg px-4 py-2",
isUser
? "bg-primary text-primary-foreground"
: "bg-muted"
)}
>
<p>{message.content}</p>
{message.reasoning && (
<details className="mt-2 text-xs">
<summary>Reasoning</summary>
<p className="mt-1">{message.reasoning}</p>
</details>
)}
{message.timestamp && (
<p className="text-xs text-right mt-1">
{message.timestamp.toLocaleTimeString()}
</p>
)}
</div>
</div>
{isUser && (
<Avatar>
<AvatarFallback>You</AvatarFallback>
</Avatar>
)}
{visualization && (
<div className="mt-4">
<VisualizationDisplay
visualization={visualization}
title={message.content}
/>
</div>
)}
</div>
);
}
