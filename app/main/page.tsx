"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider } from '@/components/dashboard/app-provider';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication on mount
    if (typeof window !== "undefined") {
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      if (!isAuthenticated) {
        router.push("/login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push("/login");
  };

  // Don't render anything until we've checked authentication
  if (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") !== "true") {
    return null;
  }

  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header onLogout={handleLogout} />
        <MainContent />
      </div>
    </AppProvider>
  );
}