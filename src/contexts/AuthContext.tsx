import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  github_username: string;
  avatar_url: string;
  is_paid: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Mock user for development
const MOCK_USER: User = {
  id: "mock-user-id-12345",
  github_username: "demo-user",
  avatar_url: "https://avatars.githubusercontent.com/u/1234567",
  is_paid: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    // Mock login - in production this would use GitHub OAuth
    setUser(MOCK_USER);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
