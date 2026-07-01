import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Altech Auth + Permissions
 * -------------------------------------------------------------
 * Mock trocável. A API pública (AuthProvider, useAuth, useCan)
 * é a mesma que será implementada quando Supabase for plugado.
 * Só o corpo dos métodos muda (signIn, signOut, session bootstrap).
 */

export type Permission =
  | "workspace.view"
  | "board.view"
  | "board.manage"
  | "project.view"
  | "project.manage"
  | "workitem.view"
  | "workitem.manage"
  | "admin.access";

export type Role = "owner" | "admin" | "member" | "guest";

export interface AltechUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AltechUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (perm: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "workspace.view", "board.view", "board.manage",
    "project.view", "project.manage",
    "workitem.view", "workitem.manage", "admin.access",
  ],
  admin: [
    "workspace.view", "board.view", "board.manage",
    "project.view", "project.manage",
    "workitem.view", "workitem.manage", "admin.access",
  ],
  member: [
    "workspace.view", "board.view",
    "project.view", "workitem.view", "workitem.manage",
  ],
  guest: ["workspace.view", "board.view", "project.view", "workitem.view"],
};

const STORAGE_KEY = "altech.session";

function loadSession(): AltechUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AltechUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AltechUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const existing = loadSession();
    setUser(existing);
    setStatus(existing ? "authenticated" : "unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    signIn: async (email) => {
      // TODO(supabase): substitute for supabase.auth.signInWithPassword
      await new Promise((r) => setTimeout(r, 400));
      const role: Role = email.startsWith("admin") ? "admin" : "member";
      const next: AltechUser = {
        id: crypto.randomUUID(),
        name: email.split("@")[0] ?? "Altech User",
        email,
        role,
        permissions: ROLE_PERMISSIONS[role],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
      setStatus("authenticated");
    },
    signOut: async () => {
      // TODO(supabase): supabase.auth.signOut()
      window.localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setStatus("unauthenticated");
    },
    can: (perm) => !!user?.permissions.includes(perm),
  }), [user, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCan(perm: Permission) {
  return useAuth().can(perm);
}
