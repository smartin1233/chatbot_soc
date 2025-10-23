"use client";

import React from "react";
import { useApp } from "./app-provider";
import EnhancedDataPanel from "./enhanced-data-panel";
import EnhancedChatPanel from "./enhanced-chat-panel";
import EnhancedWorkflowTree from "./enhanced-workflow-tree";
import WelcomeHero from "./welcome-hero";

export default function MainContent() {
  const { state, dispatch } = useApp();

  const handleDateRangeChange = (range: any) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  };

  if (state.isOnboarding) {
    return <WelcomeHero />;
  }

  // Three-panel layout: Chat + Data + Insights
  if (state.dataPanelOpen && state.insightsPanelOpen) {
    const chatPanelPct = 40;
    const dataPanelPct = 30;
    const insightsPanelPct = 30;

    return (
      <main className="flex flex-1 overflow-hidden relative">
        {/* Three Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Panel */}
          <div style={{ width: `${chatPanelPct}%` }} className="min-w-[30%]">
            <EnhancedChatPanel className="flex-1" />
          </div>
          
          {/* Resize Handle 1 */}
          <div className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors" />
          
          {/* Data Panel */}
          <div style={{ width: `${dataPanelPct}%` }} className="min-w-[25%]">
            <EnhancedDataPanel className="w-full h-full" />
          </div>
          
          {/* Resize Handle 2 */}
          <div className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors" />
          
          {/* Enhanced Insights Panel */}
          <div style={{ width: `${insightsPanelPct}%` }} className="min-w-[25%]">
            <EnhancedDataPanel className="w-full h-full" />
          </div>
        </div>
        
        {/* Workflow Drawer */}
        <EnhancedWorkflowTree />
      </main>
    );
  }

  // Two-panel layout: Chat + Data
  if (state.dataPanelOpen) {
    const leftPanelPct = state.dataPanelWidthPct;
    const rightPanelPct = 100 - leftPanelPct;

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startLeft = leftPanelPct;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const w = document.body.clientWidth || window.innerWidth;
        const deltaPct = (dx / w) * 100;
        dispatch({ type: 'SET_DATA_PANEL_WIDTH', payload: startLeft + deltaPct });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    return (
      <main className="flex flex-1 overflow-hidden relative">
        {/* Two Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: `${leftPanelPct}%` }} className="min-w-[30%] max-w-[70%]" >
            <EnhancedChatPanel className="flex-1" />
          </div>
          <div
            onMouseDown={onMouseDown}
            className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
            title="Drag to resize"
          />
          <div style={{ width: `${rightPanelPct}%` }} className="flex flex-col overflow-hidden">
            <EnhancedDataPanel className="w-full h-full" />
          </div>
        </div>
        
        {/* Workflow Drawer */}
        <EnhancedWorkflowTree />
      </main>
    );
  }

  // Two-panel layout: Chat + Insights
  if (state.insightsPanelOpen) {
    return (
      <main className="flex flex-1 overflow-hidden relative">
        {/* Chat + Insights Layout */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 min-w-[50%]">
            <EnhancedChatPanel className="flex-1" />
          </div>
          <div className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors" />
          <div className="flex-1 min-w-[50%]">
            <EnhancedDataPanel className="w-full h-full" />
          </div>
        </div>
        
        {/* Workflow Drawer */}
        <EnhancedWorkflowTree />
      </main>
    );
  }

  // Single panel layout: Chat only
  return (
    <main className="flex flex-1 overflow-hidden relative">
      {/* Single Panel Layout */}
      <div className="w-full flex flex-col overflow-hidden">
        <EnhancedChatPanel className="flex-1" />
      </div>
      
      {/* Workflow Drawer */}
      <EnhancedWorkflowTree />
    </main>
  );
}
