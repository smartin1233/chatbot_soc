"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import InteractiveLogin from "@/components/auth/interactive-login";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to main page
    if (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true") {
      router.push("/main");
    }
  }, [router]);

  // Auth handler for InteractiveLogin
  const handleLogin = (username: string, password: string) => {
    // Store credentials for API authentication
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("zentere_username", username);
    localStorage.setItem("zentere_password", password);
    router.push("/main");
  };

  // Skip rendering if already authenticated
  if (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true") {
    return null;
  }

  return (
    <InteractiveLogin onLogin={handleLogin} />
  );
}
