import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users store
const defaultUsers: User[] = [
  { id: "t1", name: "Demo Teacher", email: "teacher@test.com", password: "password", role: "teacher" },
  { id: "s1", name: "Demo Student", email: "student@test.com", password: "password", role: "student" },
];

let usersStore: User[] = [...defaultUsers];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("attendance_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const login = (email: string, password: string) => {
    const found = usersStore.find((u) => u.email === email && u.password === password);
    if (!found) return { success: false, error: "Invalid email or password" };
    setUser(found);
    localStorage.setItem("attendance_user", JSON.stringify(found));
    return { success: true };
  };

  const register = (name: string, email: string, password: string, role: UserRole) => {
    if (usersStore.find((u) => u.email === email)) {
      return { success: false, error: "Email already registered" };
    }
    const newUser: User = { id: crypto.randomUUID(), name, email, password, role };
    usersStore.push(newUser);
    setUser(newUser);
    localStorage.setItem("attendance_user", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("attendance_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
