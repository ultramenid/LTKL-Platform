import { create } from "zustand";

export type Level = "home" | "kabupaten" | "kecamatan" | "desa";

export interface Breadcrumbs {
  kab?: string;
  kec?: string;
  des?: string;
}

interface MapStore {
  breadcrumbs: Breadcrumbs;
  setBreadcrumbs: (breadcrumbs: Breadcrumbs) => void;
  updateBreadcrumb: (level: Level, value?: string) => void;
  resetBreadcrumbs: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  breadcrumbs: {},
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
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
          ? { kab: state.breadcrumbs.kab, kec: state.breadcrumbs.kec, des: value }
          : state.breadcrumbs,
    })),
  resetBreadcrumbs: () => set({ breadcrumbs: {} }),
}));
