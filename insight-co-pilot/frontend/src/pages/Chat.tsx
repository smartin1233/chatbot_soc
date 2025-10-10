import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { SettingsDialog } from 'components/SettingsDialog';
import Plot from 'react-plotly.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  plotlyChart?: any;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Call streaming API
      const response = await fetch(
        'https://api.databutton.com/_projects/e6cc71ff-08c2-47d0-bd71-77c90e59f03a/dbtn/devx/app/routes/chat/message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            session_id: sessionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantMessage = '';
      let currentSessionId = sessionId;
      
      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Check if chunk contains session ID
        if (chunk.startsWith('SESSION_ID:')) {
          const newSessionId = chunk.replace('SESSION_ID:', '').trim();
          if (newSessionId) {
            currentSessionId = newSessionId;
            setSessionId(newSessionId);
          }
          continue;
        }
        
        assistantMessage += chunk;
        
        // Update the last message (assistant's response)
        setMessages(prev => {
          const newMessages = [...prev];
          
          // Extract Plotly chart if present
          let textContent = assistantMessage;
          let plotlyChart = null;
          
          const chartMatch = assistantMessage.match(/\[PLOTLY_CHART\](.*?)\[\/PLOTLY_CHART\]/s);
          if (chartMatch) {
            try {
              plotlyChart = JSON.parse(chartMatch[1]);
              textContent = assistantMessage.replace(/\[PLOTLY_CHART\].*?\[\/PLOTLY_CHART\]/s, '').trim();
            } catch (e) {
              console.error('Failed to parse Plotly chart:', e);
            }
          }
          
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: textContent,
            plotlyChart: plotlyChart
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Insight Co-Pilot</h1>
                <p className="text-sm text-slate-400">Your AI Business Analytics Assistant</p>
              </div>
            </div>
            {sessionId && (
              <SettingsDialog sessionId={sessionId} />
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full px-6 py-6">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/20">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-slate-100">Welcome to Insight Co-Pilot</h2>
                  <p className="text-slate-400 max-w-md">
                    I can help you analyze your business data, generate insights, and make data-driven decisions.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 w-full max-w-2xl">
                  <Card className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => setInput("What datasets do I have available?")}>
                    <p className="text-sm text-slate-300">What datasets do I have available?</p>
                  </Card>
                  <Card className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => setInput("Show me a summary of my business units")}>
                    <p className="text-sm text-slate-300">Show me a summary of my business units</p>
                  </Card>
                  <Card className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => setInput("What can you help me with?")}>
                    <p className="text-sm text-slate-300">What can you help me with?</p>
                  </Card>
                  <Card className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => setInput("Analyze my latest dataset")}>
                    <p className="text-sm text-slate-300">Analyze my latest dataset</p>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col gap-3 max-w-[80%]">
                      <div
                        className={`rounded-2xl px-5 py-3 ${
                          message.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.plotlyChart && (
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                          <Plot
                            data={message.plotlyChart.data}
                            layout={{
                              ...message.plotlyChart.layout,
                              autosize: true,
                              paper_bgcolor: 'rgba(30, 41, 59, 0)',
                              plot_bgcolor: 'rgba(30, 41, 59, 0)',
                              font: { color: '#e2e8f0' },
                              margin: { l: 50, r: 30, t: 40, b: 40 }
                            }}
                            config={{ responsive: true, displayModeBar: true }}
                            style={{ width: '100%', height: '400px' }}
                          />
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-4 h-4 rounded-full bg-slate-500" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your business data..."
                className="min-h-[60px] max-h-[200px] bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none pr-12"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[60px] px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
