"use client";

import React from 'react';
import { useApp } from '@/components/dashboard/app-provider';
import InteractiveLogin from '@/components/auth/interactive-login';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';

export default function App() {
  const { state, dispatch } = useApp();

  const handleLogin = (username: string, password: string) => {
    // Authentication check
    if (username === 'admin' && password === 'demo') {
      dispatch({ type: 'SET_AUTH', payload: true });
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'SET_AUTH', payload: false });
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  if (!state.isAuthenticated) {
    return <InteractiveLogin onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header onLogout={handleLogout} />
      <MainContent />
    </div>
  );
}