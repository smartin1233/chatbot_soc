"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('🔍 AuthHandler: Checking for auth data...');
    
    // Check for auth data from Frontend (passed via URL)
    const authData = searchParams.get('auth');
    
    if (authData) {
      console.log('✅ AuthHandler: Found auth data in URL');
      try {
        // Decode and parse auth data
        const decoded = JSON.parse(atob(decodeURIComponent(authData)));
        console.log('✅ AuthHandler: Decoded auth data:', { 
          hasUsername: !!decoded.username, 
          hasPassword: !!decoded.password,
          hasAgentContext: !!decoded.agentContext 
        });
        
        // Store credentials in new_app's localStorage
        if (decoded.username && decoded.password) {
          localStorage.setItem('zentere_username', decoded.username);
          localStorage.setItem('zentere_password', decoded.password);
          localStorage.setItem('isAuthenticated', 'true');
          console.log('✅ AuthHandler: Stored credentials in localStorage');
        }
        
        // Store agent context if provided
        if (decoded.agentContext) {
          localStorage.setItem('agentLaunchContext', JSON.stringify(decoded.agentContext));
          console.log('✅ AuthHandler: Stored agent context');
        }
        
        // Store skipOnboarding flag
        if (decoded.skipOnboarding) {
          localStorage.setItem('skipOnboarding', 'true');
          console.log('✅ AuthHandler: Set skipOnboarding flag');
        }
        
        // Clean URL and redirect to main
        console.log('🚀 AuthHandler: Redirecting to /main');
        window.history.replaceState({}, '', '/');
        router.push('/main');
        return;
      } catch (error) {
        console.error('❌ AuthHandler: Failed to parse auth data:', error);
      }
    } else {
      console.log('ℹ️ AuthHandler: No auth data in URL, checking localStorage...');
    }
    
    // Normal authentication check
    if (typeof window !== "undefined") {
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      console.log('ℹ️ AuthHandler: isAuthenticated =', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('🚀 AuthHandler: Already authenticated, redirecting to /main');
        router.push("/main");
      } else {
        console.log('🔐 AuthHandler: Not authenticated, redirecting to /login');
        router.push("/login");
      }
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}
