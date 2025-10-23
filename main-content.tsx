"use client";

import React from "react";
import { useApp } from "./app-provider";
import DataPanel from "./data-panel";
import ChatPanel from "./chat-panel";
import WelcomeHero from "./welcome-hero";

export default function MainContent() {
  const { state, dispatch } = useApp();

  if (state.isOnboarding) {
    return <WelcomeHero />;
  }

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
      <main className="flex flex-1 overflow-hidden">
        <div style={{ width: `${leftPanelPct}%` }} className="min-w-[20%] max-w-[70%]" >
          <ChatPanel className="flex-1" />
        </div>
        <div
          onMouseDown={onMouseDown}
          className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
          title="Drag to resize"
        />
        <div style={{ width: `${rightPanelPct}%` }} className="flex flex-col overflow-hidden">
          <DataPanel className="w-full h-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 overflow-hidden">
      <div className="w-full flex flex-col overflow-hidden">
        <ChatPanel className="flex-1" />
      </div>
    </main>
  );
}
