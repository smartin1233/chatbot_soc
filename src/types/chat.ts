// src/types/chat.ts
export interface Message {
id: string;
role: "user" | "assistant" | "system";
content: string;
timestamp?: Date;
reasoning?: string;
source?: string;
}

export interface VisualizationData {
type: string;
data: any;
config?: any;
}
