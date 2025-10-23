"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import ThemeSelector from '@/components/theme-selector';
import { useTheme } from '@/components/theme-context';
import { ArrowLeft, Palette, Sun, Moon, Monitor } from 'lucide-react';
import Link from 'next/link';

export default function ClientThemeDemo() {
  const [mounted, setMounted] = useState(false);
  const { themeMode, colorTheme, isDarkTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Theme System Demo</h1>
                <p className="text-muted-foreground">
                  Loading theme system...
                </p>
              </div>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-60 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Theme System Demo</h1>
              <p className="text-muted-foreground">
                Experience the comprehensive theming system from Frontend
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {isDarkTheme ? <Moon className="h-3 w-3 mr-1" /> : <Sun className="h-3 w-3 mr-1" />}
              {themeMode}
            </Badge>
            <Badge variant="outline">
              <Palette className="h-3 w-3 mr-1" />
              {colorTheme}
            </Badge>
          </div>
        </div>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Demo Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buttons Demo */}
          <Card className="executive-card">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles and states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button className="w-full">Primary Button</Button>
                <Button variant="secondary" className="w-full">Secondary Button</Button>
                <Button variant="outline" className="w-full">Outline Button</Button>
                <Button variant="ghost" className="w-full">Ghost Button</Button>
                <Button variant="destructive" className="w-full">Destructive Button</Button>
              </div>
            </CardContent>
          </Card>

          {/* Cards Demo */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Glass Effect Card</CardTitle>
              <CardDescription>Card with glassmorphism styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card demonstrates the glass effect with backdrop blur and transparency.
              </p>
              <div className="mt-4 flex gap-2">
                <Badge>Glass</Badge>
                <Badge variant="secondary">Blur</Badge>
                <Badge variant="outline">Modern</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Status Indicators</CardTitle>
              <CardDescription>Various status and trend indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full status-good"></div>
                <span className="text-sm">Good Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full status-warning"></div>
                <span className="text-sm">Warning Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full status-critical"></div>
                <span className="text-sm">Critical Status</span>
              </div>
              <div className="pt-2 space-y-1">
                <div className="trend-up text-sm">↗ Trending Up</div>
                <div className="trend-down text-sm">↘ Trending Down</div>
                <div className="trend-stable text-sm">→ Stable Trend</div>
              </div>
            </CardContent>
          </Card>

          {/* Gradient Demo */}
          <Card className="gradient-bg">
            <CardHeader>
              <CardTitle>Gradient Background</CardTitle>
              <CardDescription>Enhanced gradient effects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This card showcases the gradient background utility class with smooth color transitions.
              </p>
            </CardContent>
          </Card>

          {/* Animation Demo */}
          <Card className="animate-slideInUp">
            <CardHeader>
              <CardTitle>Animations</CardTitle>
              <CardDescription>Custom animation effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="loading-shimmer h-4 rounded"></div>
              <div className="animate-pulse h-4 bg-muted rounded"></div>
              <Button className="btn-glow">Hover for Glow Effect</Button>
            </CardContent>
          </Card>

          {/* Typography Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gradient">Typography & Colors</CardTitle>
              <CardDescription>Text styles and color variations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <h1 className="text-2xl font-bold">Heading 1</h1>
              <h2 className="text-xl font-semibold">Heading 2</h2>
              <h3 className="text-lg font-medium">Heading 3</h3>
              <p className="text-foreground">Primary text color</p>
              <p className="text-muted-foreground">Muted text color</p>
              <p className="text-primary">Primary accent color</p>
              <p className="text-secondary">Secondary accent color</p>
            </CardContent>
          </Card>
        </div>

        {/* Theme Information */}
        <Card>
          <CardHeader>
            <CardTitle>Current Theme Configuration</CardTitle>
            <CardDescription>
              Active theme settings and CSS variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Theme Mode</h4>
                <p className="text-muted-foreground">
                  Current: <span className="text-primary font-medium">{themeMode}</span>
                </p>
                <p className="text-muted-foreground">
                  Resolved: <span className="text-primary font-medium">{isDarkTheme ? 'dark' : 'light'}</span>
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Color Theme</h4>
                <p className="text-muted-foreground">
                  Active: <span className="text-primary font-medium">{colorTheme}</span>
                </p>
                <p className="text-muted-foreground">
                  Class: <span className="text-primary font-medium">{isDarkTheme ? 'dark' : 'light'}-{colorTheme}</span>
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <div className="space-y-1">
                  <Badge variant="secondary" className="mr-1">8 Color Themes</Badge>
                  <Badge variant="secondary" className="mr-1">Dark/Light Mode</Badge>
                  <Badge variant="secondary" className="mr-1">System Detection</Badge>
                  <Badge variant="secondary" className="mr-1">Font Switching</Badge>
                  <Badge variant="secondary" className="mr-1">CSS Variables</Badge>
                  <Badge variant="secondary" className="mr-1">Animations</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}