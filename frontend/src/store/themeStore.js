import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark", // "dark" | "light"
      
      // Initialize theme from system preference or localStorage
      initTheme: () => {
        const stored = localStorage.getItem("theme");
        if (stored) {
          set({ theme: stored });
          applyTheme(stored);
        } else {
          // Detect system preference
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const systemTheme = prefersDark ? "dark" : "light";
          set({ theme: systemTheme });
          applyTheme(systemTheme);
        }
      },
      
      // Toggle between dark and light
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          applyTheme(newTheme);
          return { theme: newTheme };
        });
      },
      
      // Set specific theme
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Helper function to apply theme to DOM
function applyTheme(theme) {
  const html = document.documentElement;
  
  if (theme === "dark") {
    html.classList.add("dark");
    html.style.colorScheme = "dark";
  } else {
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }
}
