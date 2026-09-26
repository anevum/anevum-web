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
  loadSession,
  refreshCurrentUser,
  saveSession,
  sendMagicLinkRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
  updateMetadataRequest,
  type RhenSession
} from "../lib/auth";

type AuthValue = {
  session: RhenSession | null;
  loading: boolean;
  commandAdmin: boolean;
  signIn(email: string, password: string): Promise<void>;
  sendMagicLink(email: string): Promise<void>;
  signUp(input: { displayName: string; handle: string; email: string; password: string }): Promise<boolean>;
  signOut(): Promise<void>;
  updateMetadata(patch: Record<string, unknown>): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RhenSession | null>(() => loadSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const current = loadSession();
    if (!current) {
      setLoading(false);
      return;
    }

    refreshCurrentUser(current).then((next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await signInRequest(email, password);
    saveSession(next);
    setSession(next);
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    await sendMagicLinkRequest(email);
  }, []);

  const signUp = useCallback(async (input: {
    displayName: string;
    handle: string;
    email: string;
    password: string;
  }) => {
    const next = await signUpRequest(input);
    if (!next.access_token || !next.user) return false;

    saveSession(next);
    const updated = await updateMetadataRequest(next, {
      anevum_system_updates: true,
      anevum_system_updates_at: new Date().toISOString(),
      anevum_system_updates_source: "rhenlink-create"
    });
    setSession(updated);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest(session);
    setSession(null);
  }, [session]);

  const updateMetadata = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!session) throw new Error("Sign in first.");
      const next = await updateMetadataRequest(session, patch);
      setSession(next);
    },
    [session]
  );

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      commandAdmin: isCommandAdmin(session),
      signIn,
      sendMagicLink,
      signUp,
      signOut,
      updateMetadata
    }),
    [session, loading, signIn, sendMagicLink, signUp, signOut, updateMetadata]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
