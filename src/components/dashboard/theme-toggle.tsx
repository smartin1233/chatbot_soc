"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-context';

export const ThemeToggle = () => {
    const [mounted, setMounted] = useState(false);
    const { themeMode, setThemeMode, isDarkTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        if (themeMode === 'system') {
            setThemeMode(isDarkTheme ? 'light' : 'dark');
        } else {
            setThemeMode(themeMode === 'light' ? 'dark' : 'light');
        }
    };

    const getIcon = () => {
        if (themeMode === 'system') {
            return <Monitor className="w-5 h-5" />;
        }
        return isDarkTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
    };

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Sun className="w-5 h-5" />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={`Current: ${themeMode} (${isDarkTheme ? 'dark' : 'light'})`}
        >
            {getIcon()}
        </button>
    );
};