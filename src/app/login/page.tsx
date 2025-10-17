"use client";

import { useState, useEffect } from 'react';
import { AppProvider } from '@/components/dashboard/app-provider';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string, password: string) => {
    console.log('Attempting to log in with:', username, password);
    // Authentication check
    if (username === 'martin@demo.com' && password === 'demo') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
    console.log('Current authentication state:', isAuthenticated);
    console.log('Is loading:', isLoading);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg font-medium">Loading your dashboard...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to /main page if authenticated
  if (isAuthenticated) {
    return (
      <AppProvider>
        <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground font-body animate-fade-in">
          <Header onLogout={handleLogout} />
          <MainContent />
        </div>
      </AppProvider>
    );
  } else {
    // Redirect to /main page instead of showing login
    if (typeof window !== 'undefined') {
      window.location.href = '/main';
    }
    return null;
  }
}
