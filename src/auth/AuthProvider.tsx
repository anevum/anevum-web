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
  consumeAuthRedirect,
  isCommandAdmin,
  loadSession,
  refreshCurrentUser,
  saveSession,
  sendMagicLinkRequest,
  sendPasswordResetRequest,
  signInRequest,
  signOutRequest,
  signUpRequest,
  updateMetadataRequest,
  updatePasswordRequest,
  type RhenSession
} from "../lib/auth";

type AuthValue = {
  session: RhenSession | null;
  loading: boolean;
  commandAdmin: boolean;
  signIn(email: string, password: string): Promise<void>;
  sendMagicLink(email: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  signUp(input: { displayName: string; handle: string; email: string; password: string }): Promise<boolean>;
  signOut(): Promise<void>;
  updateMetadata(patch: Record<string, unknown>): Promise<void>;
  updatePassword(password: string): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RhenSession | null>(() => loadSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      try {
        const redirected = await consumeAuthRedirect();
        if (!active) return;
        if (redirected) {
          setSession(redirected);
          setLoading(false);
          return;
        }

        const current = loadSession();
        if (!current) {
          setLoading(false);
          return;
        }

        const next = await refreshCurrentUser(current);
        if (!active) return;
        setSession(next);
        setLoading(false);
      } catch {
        if (!active) return;
        saveSession(null);
        setSession(null);
        setLoading(false);
      }
    }

    void resolveSession();

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

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetRequest(email);
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

  const updatePassword = useCallback(
    async (password: string) => {
      if (!session) throw new Error("Open the password recovery link first.");
      const next = await updatePasswordRequest(session, password);
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
      sendPasswordReset,
      signUp,
      signOut,
      updateMetadata,
      updatePassword
    }),
    [
      session,
      loading,
      signIn,
      sendMagicLink,
      sendPasswordReset,
      signUp,
      signOut,
      updateMetadata,
      updatePassword
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
