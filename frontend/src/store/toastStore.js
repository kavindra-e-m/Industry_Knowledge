import { create } from "zustand";

let _id = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), toast.duration ?? 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
