"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { indexedDBService, UserPreferences } from "@/lib/indexedDB";

const defaultPreferences: UserPreferences = {
  theme: "light",
  viewMode: "split",
  fontSize: 14,
  fontFamily: "var(--font-mono)",
  autoSave: true,
  autoSaveInterval: 2000,
  recentFiles: [],
  sidebarCollapsed: false,
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from IndexedDB on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        await indexedDBService.init();
        const savedPreferences = await indexedDBService.getPreferences();
        if (savedPreferences) {
          setPreferences({ ...defaultPreferences, ...savedPreferences });
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
        // Fallback to localStorage if IndexedDB fails
        const fallbackPrefs = localStorage.getItem(
          "markdown-editor-preferences"
        );
        if (fallbackPrefs) {
          try {
            const parsed = JSON.parse(fallbackPrefs);
            setPreferences({ ...defaultPreferences, ...parsed });
          } catch (e) {
            console.error("Failed to parse fallback preferences:", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading) {
      const savePreferences = async () => {
        try {
          await indexedDBService.savePreferences(preferences);
        } catch (error) {
          console.error("Failed to save preferences to IndexedDB:", error);
          // Fallback to localStorage
          localStorage.setItem(
            "markdown-editor-preferences",
            JSON.stringify(preferences)
          );
        }
      };

      savePreferences();
    }
  }, [preferences, isLoading]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <PreferencesContext.Provider
      value={{ preferences, updatePreferences, resetPreferences, isLoading }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
