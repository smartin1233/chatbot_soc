// src/components/chat/UserInputPrompt.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface UserInputPromptProps {
prompt: string;
onSubmit: (input: string) => void;
onCancel: () => void;
}

export function UserInputPrompt({ prompt, onSubmit, onCancel }: UserInputPromptProps) {
const [input, setInput] = useState("");

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (input.trim()) {
onSubmit(input);
}
};

return (
<Card className="max-w-2xl mx-auto">
<CardHeader className="flex flex-row items-center justify-between">
<CardTitle>Input Required</CardTitle>
<Button variant="ghost" size="icon" onClick={onCancel}>
<X className="h-4 w-4" />
</Button>
</CardHeader>
<CardContent>
<p className="mb-4">{prompt}</p>
<form onSubmit={handleSubmit}>
<Textarea
value={input}
onChange={(e) => setInput(e.target.value)}
placeholder="Provide your input here..."
className="mb-4"
/>
<div className="flex justify-end gap-2">
<Button type="button" variant="outline" onClick={onCancel}>
Cancel
</Button>
<Button type="submit">Submit</Button>
</div>
</form>
</CardContent>
</Card>
);
}
