import { useCallback, useEffect, useState } from "react";

/**
 * Persist small UI preferences (filter/sort/group/search) per-route in localStorage.
 * Falls back to the provided defaults if nothing is stored or parsing fails.
 */
export function useOrgPrefs<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const storageKey = `altech:orgprefs:${key}`;
  const [value, setValue] = useState<T>(defaults);

  // hydrate once on mount / when key changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setValue({ ...defaults, ...parsed });
        return;
      }
    } catch {
      // ignore
    }
    setValue(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setValue(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return [value, update, reset];
}
