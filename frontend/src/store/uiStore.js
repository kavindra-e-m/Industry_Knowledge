import { create } from "zustand";

export const useUiStore = create((set) => ({
  drawerOpen: false,
  drawerTab: "alerts", // "alerts" | "telemetry" | "copilot"

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setDrawerTab: (tab) => set({ drawerTab: tab }),
  openTab: (tab) => set({ drawerOpen: true, drawerTab: tab }),
}));
