"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Badge } from '@/ui/badge';
import { useTheme, type ThemeMode, type ColorTheme, type FontFamily } from './theme-context';
import { Monitor, Moon, Sun, Palette, Type } from 'lucide-react';

const ThemeSelector: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { themeMode, colorTheme, fontFamily, setThemeMode, setColorTheme, setFontFamily } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
          <CardDescription>
            Loading theme settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const themeModes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  const colorThemes: { value: ColorTheme; label: string; color: string }[] = [
    { value: 'default', label: 'Default', color: '#2563eb' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'teal', label: 'Teal', color: '#14b8a6' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'purple', label: 'Purple', color: '#8b5cf6' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'gray', label: 'Gray', color: '#6b7280' },
  ];

  const fontFamilies: { value: FontFamily; label: string }[] = [
    { value: 'system', label: 'System Font' },
    { value: 'gotham-book', label: 'Gotham Book' },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Customize the appearance of your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Theme Mode</label>
          <div className="flex gap-2">
            {themeModes.map((mode) => (
              <Button
                key={mode.value}
                variant={themeMode === mode.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setThemeMode(mode.value)}
                className="flex items-center gap-2"
              >
                {mode.icon}
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Theme Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Color Theme</label>
          <div className="grid grid-cols-4 gap-2">
            {colorThemes.map((theme) => (
              <Button
                key={theme.value}
                variant={colorTheme === theme.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setColorTheme(theme.value)}
                className="flex items-center gap-2 justify-start"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.color }}
                />
                {theme.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Font Family Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Font Family
          </label>
          <Select value={fontFamily} onValueChange={(value: FontFamily) => setFontFamily(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Settings Display */}
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Mode: {themeModes.find(m => m.value === themeMode)?.label}
            </Badge>
            <Badge variant="secondary">
              Color: {colorThemes.find(c => c.value === colorTheme)?.label}
            </Badge>
            <Badge variant="secondary">
              Font: {fontFamilies.find(f => f.value === fontFamily)?.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;