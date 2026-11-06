import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type { User, AuthResponse } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    role?: 'Admin' | 'Customer'
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restore session from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Persist token and user data after successful auth
  const handleAuthResponse = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify({ email: data.email, fullName: data.fullName, role: data.role })
    );
    setUser({ email: data.email, fullName: data.fullName, role: data.role });
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    handleAuthResponse(response.data);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role?: 'Admin' | 'Customer'
  ) => {
    const response = await authService.register(email, password, fullName, role);
    handleAuthResponse(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isCustomer: user?.role === 'Customer',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}