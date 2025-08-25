import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { AuthAPI } from "../api";

function safeDecode(token) {
  try {
    const decoded = jwtDecode(token);
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      displayName: decoded.name || decoded.displayName || decoded.email,
      avatarUrl: decoded.avatarUrl || null,
    };
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      // PUBLIC_INTERFACE
      async login(credentials, apiBase) {
        const data = await AuthAPI.login(credentials, apiBase);
        const token = data?.token;
        const user = data?.user || (token ? safeDecode(token) : null);
        set({ token, user });
        return { token, user };
      },
      // PUBLIC_INTERFACE
      async register(payload, apiBase) {
        const data = await AuthAPI.register(payload, apiBase);
        const token = data?.token;
        const user = data?.user || (token ? safeDecode(token) : null);
        set({ token, user });
        return { token, user };
      },
      // PUBLIC_INTERFACE
      async refreshMe(apiBase) {
        const me = await AuthAPI.me(apiBase);
        set({ user: me });
        return me;
      },
      // PUBLIC_INTERFACE
      logout() {
        set({ token: null, user: null });
      },
      // PUBLIC_INTERFACE
      restore() {
        const { token, user } = get();
        if (token && !user) {
          try {
            const u = safeDecode(token);
            set({ user: u });
          } catch {
            set({ token: null, user: null });
          }
        }
      },
    }),
    { name: "ludomaster_auth" }
  )
);
