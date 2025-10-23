export type StreamedChunk = {
    thinking?: string[];
    content?: string;
  };
  
  export function parseStreaming(chunk: string): StreamedChunk {
    const thinkingSteps: string[] = [];
    let content = '';
  
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
    let match;
    while ((match = thinkingRegex.exec(chunk)) !== null) {
      const steps = match[1].split('\n').map(s => s.trim()).filter(s => s.length > 0);
      thinkingSteps.push(...steps);
    }
  
    const contentRegex = /<content>([\s\S]*?)<\/content>/;
    const contentMatch = chunk.match(contentRegex);
    if (contentMatch) {
      content = contentMatch[1];
    }
  
    if (!thinkingSteps.length && !content) {
        // Fallback for non-structured data
        content = chunk;
    }
  
    return { thinking: thinkingSteps, content };
  }
  