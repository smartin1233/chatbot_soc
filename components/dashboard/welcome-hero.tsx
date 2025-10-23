"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BuLobSelector from "./bu-lob-selector";
import GuidedWorkflow from "./guided-workflow";
import { useApp } from "./app-provider";
import { Sparkles, Paperclip, Send, BarChart3, Plus } from "lucide-react";

export default function WelcomeHero() {
  const { state, dispatch } = useApp();
  const [prompt, setPrompt] = useState("");
  const [showGuidedWorkflow, setShowGuidedWorkflow] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust height on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Auto-trigger guided workflow for new users
  useEffect(() => {
    if (state.businessUnits.length === 0) {
      setShowGuidedWorkflow(true);
    }
  }, [state.businessUnits.length]);

  const canContinue = !!state.selectedBu && !!state.selectedLob;
  const start = () => {
    if (canContinue) {
      if (prompt.trim()) dispatch({ type: "QUEUE_USER_PROMPT", payload: prompt.trim() });
      dispatch({ type: "END_ONBOARDING" });
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.2),transparent_50%)]" />
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs font-medium">
            <Sparkles className="h-4 w-4" /> Plan • Chat • Visualize
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Where your data becomes decisions
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Select your Business Unit, tell the assistant what you want, and we’ll plan, analyze, and preview insights on demand.
          </p>

          {/* Top controls */}
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 text-foreground hover:bg-card/80 rounded-md"
              title="Attach data"
            >
              <Paperclip className="h-6 w-6 text-foreground" />
            </Button>
            <BuLobSelector variant="secondary" size="sm" />
            {state.businessUnits.length === 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowGuidedWorkflow(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Quick Setup
              </Button>
            )}
          </div>

          {/* Input */}
          <div className="mt-6 mx-auto max-w-3xl">
            <div className="rounded-2xl border bg-card/60 backdrop-blur-lg p-4 shadow-lg">
              <form onSubmit={(e) => { e.preventDefault(); start(); }} className="flex items-start gap-2">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you need..."
                  className="flex-1 bg-background text-foreground placeholder:text-muted-foreground rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none overflow-hidden"
                  style={{ minHeight: "128px", height: "auto" }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canContinue}
                  className="p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </form>
            </div>
          </div>

          {/* Suggested prompts */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {state.businessUnits.length === 0 ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowGuidedWorkflow(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Get Started - Create Your First Business Unit
              </Button>
            ) : (
              (state.selectedLob?.suggestions || [
                "Upload your sales data",
                "Show me a sample analysis",
                "What can I do with this app?",
                "How do I generate a forecast?",
                "Explore my data"
              ]).map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => setPrompt((p) => (p ? `${p} ${s}` : s))}>
                  {s}
                </Button>
              ))
            )}
          </div>

          {/* Highlights */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="rounded-xl border p-4 bg-card/50">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="mt-2 font-semibold">On-demand previews</h3>
              <p className="text-sm text-muted-foreground">
                Visualize charts, tables, and reports only when needed—your chat stays center stage.
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-card/50">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="mt-2 font-semibold">Plan & execute</h3>
              <p className="text-sm text-muted-foreground">
                We outline the workflow and execute steps with clear progress and results.
              </p>
            </div>
            <div className="rounded-xl border p-4 bg-card/50">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="mt-2 font-semibold">Data-aware chat</h3>
              <p className="text-sm text-muted-foreground">
                Responses are grounded in your selected BU/LOB with actionable suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GuidedWorkflow 
        open={showGuidedWorkflow} 
        onOpenChange={setShowGuidedWorkflow} 
      />
    </main>
  );
}
