import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { account, DEV_MODE } from '../config/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  mockLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for dev mode
const MOCK_USER: Models.User<Models.Preferences> = {
  $id: 'dev-user-123',
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
  name: 'Dev User',
  email: 'dev@example.com',
  emailVerification: true,
  phone: '',
  phoneVerification: false,
  prefs: {},
  registration: new Date().toISOString(),
  status: true,
  passwordUpdate: new Date().toISOString(),
  accessedAt: new Date().toISOString(),
  labels: [],
  mfa: false,
  targets: [],
} as Models.User<Models.Preferences>;

const DEV_USER_KEY = 'dev_user_logged_in';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    if (DEV_MODE) {
      // In dev mode, check if user is logged in
      const isLoggedIn = localStorage.getItem(DEV_USER_KEY) === 'true';
      if (isLoggedIn) {
        setUser(MOCK_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    try {
      const session = await account!.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email: string) => {
    if (DEV_MODE) {
      // In dev mode, just set the mock user
      setUser(MOCK_USER);
      localStorage.setItem(DEV_USER_KEY, 'true');
      return;
    }

    try {
      // Create magic URL token - this sends an email with a magic link
      await account!.createMagicURLToken({
        userId: 'unique()',
        email,
        url: `${window.location.origin}/auth/callback`,
      });
    } catch (error) {
      console.error('Failed to send magic link:', error);
      throw error;
    }
  }, []);

  const mockLogin = useCallback(async () => {
    setUser(MOCK_USER);
    localStorage.setItem(DEV_USER_KEY, 'true');
  }, []);

  const logout = useCallback(async () => {
    if (DEV_MODE) {
      setUser(null);
      localStorage.removeItem(DEV_USER_KEY);
      return;
    }

    try {
      await account!.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

