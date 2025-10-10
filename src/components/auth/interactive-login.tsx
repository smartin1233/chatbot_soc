"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Brain, BarChart3, Zap, Globe, TrendingUp, Lock, AlertCircle,
    User, EyeOff, Eye, ArrowRight, Shield, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveLoginProps {
    onLogin: (username: string, password: string) => void;
}

export default function InteractiveLogin({ onLogin }: InteractiveLoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(0);
    const [isTypingDemo, setIsTypingDemo] = useState(false);

    const features = [
        {
            icon: <Brain className="h-6 w-6" />,
            title: "AI-Powered Forecasting",
            description: "Advanced machine learning models for accurate business predictions",
            color: "from-blue-500 to-purple-600"
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: "Real-time Analytics",
            description: "Interactive dashboards with live data visualization",
            color: "from-green-500 to-teal-600"
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Instant Insights",
            description: "Get actionable business insights in seconds",
            color: "from-orange-500 to-red-600"
        },
        {
            icon: <Globe className="h-6 w-6" />,
            title: "Multi-Business Support",
            description: "Manage multiple business units and lines of business",
            color: "from-purple-500 to-pink-600"
        }
    ];

    // Rotate features every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Validation
        if (!username || !password) {
            setError("Please enter both username and password");
            setIsLoading(false);
            return;
        }

        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Accept any credentials - they will be validated by the API
        onLogin(username, password);

        setIsLoading(false);
    };

    const handleDemoFill = async () => {
        setIsTypingDemo(true);
        setUsername("");
        setPassword("");

        // Enter username - use actual API credentials
        const demoUsername = "martin@demo.com";
        for (let i = 0; i <= demoUsername.length; i++) {
            setUsername(demoUsername.slice(0, i));
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Small pause
        await new Promise(resolve => setTimeout(resolve, 300));

        // Enter password
        const demoPassword = "demo";
        for (let i = 0; i <= demoPassword.length; i++) {
            setPassword(demoPassword.slice(0, i));
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsTypingDemo(false);
    };

    const currentFeatureData = features[currentFeature];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "absolute animate-float opacity-10",
                            i % 2 === 0 ? "animate-float-delay-1" : "animate-float-delay-2"
                        )}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.5}s`
                        }}
                    >
                        {i % 3 === 0 && <BarChart3 className="h-8 w-8 text-white" />}
                        {i % 3 === 1 && <TrendingUp className="h-8 w-8 text-white" />}
                        {i % 3 === 2 && <Brain className="h-8 w-8 text-white" />}
                    </div>
                ))}
            </div>

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Branding & Features */}
                <div className="text-white space-y-8">
                    {/* Logo & Title */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    AI Assistant
                                </h1>
                                <p className="text-gray-300 text-lg">
                                    Intelligent Business Analytics Platform
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Animated Feature Showcase */}
                    <div className="relative">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl bg-gradient-to-r text-white shadow-lg transition-all duration-500",
                                    currentFeatureData.color
                                )}>
                                    {currentFeatureData.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-2 text-white">
                                        {currentFeatureData.title}
                                    </h3>
                                    <p className="text-gray-300">
                                        {currentFeatureData.description}
                                    </p>
                                </div>
                            </div>

                            {/* Feature Indicators */}
                            <div className="flex gap-2 mt-4">
                                {features.map((_, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            index === currentFeature
                                                ? "w-8 bg-white"
                                                : "w-2 bg-white/30"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">99.9%</div>
                            <div className="text-sm text-gray-300">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">10K+</div>
                            <div className="text-sm text-gray-300">Forecasts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">24/7</div>
                            <div className="text-sm text-gray-300">Support</div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex justify-center">
                    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                                    <Lock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                            <p className="text-muted-foreground">
                                Sign in to access your analytics dashboard
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive" className="animate-shake">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Username
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading || isTypingDemo}
                                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading || isTypingDemo}
                                            className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading || isTypingDemo}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                                    disabled={isLoading || isTypingDemo}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Signing in...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Sign In
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </Button>
                            </form>

                            {/* Demo Credentials */}
                            {/* <div className="space-y-3" role="region" aria-label="Demo Access">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Demo Access</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                        <h4 className="text-sm font-medium text-blue-900">Demo Credentials</h4>
                                    </div>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p><strong>Username:</strong> martin@demo.com</p>
                                        <p><strong>Password:</strong> demo</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                                        onClick={handleDemoFill}
                                        disabled={isLoading || isTypingDemo}
                                    >
                                        {isTypingDemo ? (
                                            <div className="flex items-center gap-2" aria-live="polite" aria-busy="true">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                                                Auto-filling...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-3 w-3" aria-hidden="true" />
                                                Auto-fill Demo Credentials
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div> */}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white/60 text-sm">
                {/* <p>© 2025 Forecasting AI. Secure • Reliable • Intelligent</p> */}
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay-1 {
          animation: float 6s ease-in-out infinite 2s;
        }
        .animate-float-delay-2 {
          animation: float 6s ease-in-out infinite 4s;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
        </div>
    );
}
