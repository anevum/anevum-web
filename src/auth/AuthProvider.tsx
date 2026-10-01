import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [session, setSession] = useState<RhenSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const privateRoute = location.pathname.startsWith("/command");

    if (!privateRoute) {
      setSession(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void resolveCommandAccessSession()
      .then((next) => {
        if (!active) return;
        setSession(next);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  const signOut = useCallback(async () => {
    setSession(null);
    await signOutRequest();
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
