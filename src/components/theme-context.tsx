"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define and export the types for theme mode and color theme
export type ThemeMode = "light" | "dark" | "system";
export type ColorTheme = "default" | "blue" | "teal" | "green" | "purple" | "orange" | "gray" | "red";
export type FontFamily = "system" | "gotham-book";

// Define the context type
interface ThemeContextType {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  fontFamily: FontFamily;
  isDarkTheme: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (color: ColorTheme) => void;
  setFontFamily: (font: FontFamily) => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  colorTheme: "default",
  fontFamily: "gotham-book",
  isDarkTheme: false,
  setThemeMode: () => {},
  setColorTheme: () => {},
  setFontFamily: () => {},
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");
  const [fontFamily, setFontFamily] = useState<FontFamily>("gotham-book");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  // Initialize state after mounting
  useEffect(() => {
    setMounted(true);
    const savedThemeMode = (localStorage.getItem("themeMode") as ThemeMode | null) || "system";
    const savedColorTheme = (localStorage.getItem("colorTheme") as ColorTheme | null) || "default";
    const savedFontFamily = (localStorage.getItem("fontFamily") as FontFamily | null) || "gotham-book";
    
    setThemeMode(savedThemeMode);
    setColorTheme(savedColorTheme);
    setFontFamily(savedFontFamily);
    
    // Determine if dark theme should be active
    let isDark = false;
    if (savedThemeMode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = savedThemeMode === "dark";
    }
    setIsDarkTheme(isDark);
  }, []);

  // Apply theme and listen for system changes
  useEffect(() => {
    if (!mounted) return;

    // Encapsulated applyTheme logic
    const currentMode = themeMode;
    const currentColor = colorTheme;
    const currentFont = fontFamily;

    document.documentElement.classList.remove(
      "light-default", "light-blue", "light-teal", "light-green", "light-purple", "light-orange", "light-gray", "light-red",
      "dark-default", "dark-blue", "dark-teal", "dark-green", "dark-purple", "dark-orange", "dark-gray", "dark-red"
    );

    let isDark = false;
    if (currentMode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = currentMode === "dark";
    }

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    const themeClass = `${isDark ? "dark" : "light"}-${currentColor}`;
    document.documentElement.classList.add(themeClass);
    
    // Apply font family
    document.documentElement.style.setProperty('--font-family', 
      fontFamily === 'gotham-book' ? '"Gotham Book", sans-serif' :
      'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    );

    localStorage.setItem("themeMode", currentMode);
    localStorage.setItem("colorTheme", currentColor);
    localStorage.setItem("fontFamily", fontFamily);
    setIsDarkTheme(isDark);

    // Listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (themeMode === "system") {
        document.documentElement.classList.remove(
          "light-default", "light-blue", "light-teal", "light-green", "light-purple", "light-orange", "light-red",
          "dark-default", "dark-blue", "dark-teal", "dark-green", "dark-purple", "dark-orange", "dark-red"
        );
        document.documentElement.classList.toggle("dark", e.matches);
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        const newSystemThemeClass = `${e.matches ? "dark" : "light"}-${colorTheme}`;
        document.documentElement.classList.add(newSystemThemeClass);
        setIsDarkTheme(e.matches);
        localStorage.setItem("themeMode", "system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted, themeMode, colorTheme, fontFamily]);

  const handleModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleColorThemeChange = (color: ColorTheme) => {
    setColorTheme(color);
  };

  const handleFontFamilyChange = (font: FontFamily) => {
    setFontFamily(font);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      colorTheme, 
      fontFamily,
      isDarkTheme, 
      setThemeMode: handleModeChange, 
      setColorTheme: handleColorThemeChange,
      setFontFamily: handleFontFamilyChange
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};
