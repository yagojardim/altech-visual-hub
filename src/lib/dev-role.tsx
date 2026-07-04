import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const DEV_ROLES = [
  "SUPER_ADMIN",
  "Admin Empresa",
  "PMO",
  "PM",
  "PO",
  "Tech Lead",
  "Dev",
  "QA",
  "Cliente",
  "Solicitante",
] as const;

export type DevRole = (typeof DEV_ROLES)[number];

const STORAGE_KEY = "altech.devRole";
const DEFAULT_ROLE: DevRole = "SUPER_ADMIN";

interface DevRoleContextValue {
  role: DevRole;
  setRole: (r: DevRole) => void;
  roles: readonly DevRole[];
}

const DevRoleContext = createContext<DevRoleContextValue | null>(null);

function isDevRole(v: string | null): v is DevRole {
  return !!v && (DEV_ROLES as readonly string[]).includes(v);
}

export function DevRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DevRole>(DEFAULT_ROLE);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (isDevRole(raw)) setRoleState(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<DevRoleContextValue>(
    () => ({
      role,
      roles: DEV_ROLES,
      setRole: (r) => {
        setRoleState(r);
        try {
          window.localStorage.setItem(STORAGE_KEY, r);
        } catch {
          /* ignore */
        }
      },
    }),
    [role],
  );

  return <DevRoleContext.Provider value={value}>{children}</DevRoleContext.Provider>;
}

export function useDevRole() {
  const ctx = useContext(DevRoleContext);
  if (!ctx) throw new Error("useDevRole must be used within DevRoleProvider");
  return ctx;
}
