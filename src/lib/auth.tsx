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

/**
 * DEV_MODE
 * -------------------------------------------------------------
 * Quando true, ignora a obrigatoriedade de login e injeta uma
 * sessão mock (User/Tenant/Workspace/Permission Contexts).
 * A tela /login continua existindo, mas não bloqueia o acesso.
 */
export const DEV_MODE = true;

const DEV_USER: AltechUser = {
  id: "dev-user",
  name: "Dev Altech",
  email: "dev@altech.io",
  role: "admin",
  permissions: ROLE_PERMISSIONS.admin,
};

function loadSession(): AltechUser | null {
  if (DEV_MODE) return DEV_USER;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AltechUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Em DEV_MODE resolvemos síncrono para nunca ficar preso em "Carregando…".
  const [user, setUser] = useState<AltechUser | null>(() => (DEV_MODE ? DEV_USER : null));
  const [status, setStatus] = useState<AuthContextValue["status"]>(
    DEV_MODE ? "authenticated" : "loading",
  );

  useEffect(() => {
    if (DEV_MODE) return;
    const session = loadSession();
    setUser(session);
    setStatus(session ? "authenticated" : "unauthenticated");
  }, []);


  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    signIn: async (email) => {
      // TODO(supabase): substitute for supabase.auth.signInWithPassword
      // Protótipo visual: aceita qualquer senha.
      await new Promise((r) => setTimeout(r, 300));
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
