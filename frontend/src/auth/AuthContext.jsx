import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const setAuthToken = (nextToken) => {
    setToken(nextToken);

    if (nextToken) {
      localStorage.setItem('token', nextToken);
      return;
    }

    localStorage.removeItem('token');
  };

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      setAuthToken,
      logout: () => setAuthToken(null)
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
