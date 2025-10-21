import { create } from "zustand";

export type Level = "home" | "kabupaten" | "kecamatan" | "desa";

export interface Breadcrumbs {
  kab?: string;
  kec?: string;
  des?: string;
}

interface MapStore {
  breadcrumbs: Breadcrumbs;
  year: number;                    // Added global year
  setYear: (year: number) => void; // Setter for year
  setBreadcrumbs: (breadcrumbs: Breadcrumbs) => void;
  updateBreadcrumb: (level: Level, value?: string) => void;
  resetBreadcrumbs: () => void;
  map: maplibregl.Map | null;
  setMap: (map: maplibregl.Map | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  breadcrumbs: {},

  //  Global year selector
  year: 2024,
  setYear: (year) => set({ year }),

  map: null,
  setMap: (map) => set({ map }),
  
  //  Breadcrumbs
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
