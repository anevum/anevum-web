import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  isCommandAdmin,
  resolveCommandAccessSession,
  signOutRequest,
  type RhenSession
} from "../lib/auth";

type AuthValue = {
  session: RhenSession | null;
  loading: boolean;
  commandAdmin: boolean;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RhenSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      try {
        const privatePath = typeof window !== "undefined"
          && (
            window.location.pathname.startsWith("/command")
            || window.location.pathname === "/iren"
          );
        const next = privatePath ? await resolveCommandAccessSession() : null;
        if (!active) return;
        setSession(next);
      } finally {
        if (active) setLoading(false);
      }
    }

    void resolveSession();
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      commandAdmin: isCommandAdmin(session),
      signOut
    }),
    [session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
