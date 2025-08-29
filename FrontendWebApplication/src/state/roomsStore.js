import { create } from "zustand";
import { RoomsAPI } from "../api";

// PUBLIC_INTERFACE
export const useRoomsStore = create((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  // PUBLIC_INTERFACE
  async fetchRooms(apiBase) {
    set({ loading: true, error: null });
    try {
      const data = await RoomsAPI.list(apiBase);
      set({ rooms: Array.isArray(data) ? data : [], loading: false });
    } catch (e) {
      set({ error: e.message || "Failed to load rooms", loading: false });
    }
  },
  // PUBLIC_INTERFACE
  async createRoom(payload, apiBase) {
    const room = await RoomsAPI.create(payload, apiBase);
    set({ rooms: [room, ...get().rooms] });
    return room;
  },
}));
