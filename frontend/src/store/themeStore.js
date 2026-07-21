import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark", // "dark" | "light"

      initTheme: () => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark" || storedTheme === "light") {
          set({ theme: storedTheme });
          applyTheme(storedTheme);
          return;
        }

        // Check prefers-color-scheme
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = prefersDark ? "dark" : "light";
        set({ theme: initialTheme });
        applyTheme(initialTheme);
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          applyTheme(newTheme);
          return { theme: newTheme };
        });
      },

      setTheme: (newTheme) => {
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

function applyTheme(theme) {
  const html = document.documentElement;
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    html.classList.add("dark");
    html.style.colorScheme = "dark";
  } else {
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }
}
