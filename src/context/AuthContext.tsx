import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const login = useCallback((email: string, password: string) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  }, [users]);

  const signup = useCallback((name: string, email: string, password: string, role: UserRole) => {
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      role,
    };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        user,
        users,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isManager: user?.role === 'manager',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
