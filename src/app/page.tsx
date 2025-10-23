"use client";

import { useState, useEffect } from 'react';
import { AppProvider } from '@/components/dashboard/app-provider';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';
import InteractiveLogin from '@/components/auth/interactive-login';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    // First, check for auth data from Frontend (passed via URL)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authData = urlParams.get('auth');
      
      if (authData) {
        try {
          // Decode and parse auth data
          const decoded = JSON.parse(atob(decodeURIComponent(authData)));
          
          // Store credentials in new_app's localStorage
          if (decoded.username && decoded.password) {
            localStorage.setItem('zentere_username', decoded.username);
            localStorage.setItem('zentere_password', decoded.password);
            localStorage.setItem('isAuthenticated', 'true');
          }
          
          // Store agent context if provided
          if (decoded.agentContext) {
            localStorage.setItem('agentLaunchContext', JSON.stringify(decoded.agentContext));
          }
          
          // Store skipOnboarding flag
          if (decoded.skipOnboarding) {
            localStorage.setItem('skipOnboarding', 'true');
          }
          
          // Clean URL (remove auth parameter)
          window.history.replaceState({}, '', '/');
          
          // Set authenticated and stop loading
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Failed to parse auth data:', error);
        }
      }
    }
    
    // Normal authentication check (no auth param in URL)
    const savedAuth = localStorage.getItem('isAuthenticated');
    const agentLaunchContext = localStorage.getItem('agentLaunchContext');
    
    // If coming from Frontend agent launcher, authenticate automatically
    if (agentLaunchContext || savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Authentication check
    if (username === 'admin' && password === 'demo') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('agentLaunchContext');
    localStorage.removeItem('skipOnboarding');
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

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <InteractiveLogin onLogin={handleLogin} />;
  }

  // Show main dashboard if authenticated
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground font-body animate-fade-in">
        <Header onLogout={handleLogout} />
        <MainContent />
      </div>
    </AppProvider>
  );
}
