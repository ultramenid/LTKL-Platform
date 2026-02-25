import { create } from "zustand";

export const useMapStore = create((set) => ({
  breadcrumbs: {},

  // Global year selector
  year: 2024,
  setYear: (year) => set({ year }),

  map: null,
  setMap: (map) => set({ map }),
  
  // Breadcrumbs
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  // Update specific level in breadcrumbs
  updateBreadcrumb: (level, value) =>
    set((state) => ({
      breadcrumbs:
        level === "home"
          ? {}
          : level === "kabupaten"
          ? { kab: value }
          : level === "kecamatan"
          ? { kab: state.breadcrumbs.kab, kec: value }
          : level === "desa"
          ? {
              kab: state.breadcrumbs.kab,
              kec: state.breadcrumbs.kec,
              des: value,
            }
          : state.breadcrumbs,
    })),

  // Reset all breadcrumbs
  resetBreadcrumbs: () => set({ breadcrumbs: {} }),
}));
