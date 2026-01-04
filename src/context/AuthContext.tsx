"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ADMIN_WALLET_ADDRESS = "0x761bAa235206EE9107f09777608A021824bc10fD";

/**
 * Allowed user roles in the system
 */
export type UserRole = "student" | "issuer" | "admin";

/**
 * Shape of authentication state
 */
interface AuthState {
  walletAddress: string | null;
  role: UserRole | null;
  isConnected: boolean;
  loginTimestamp: number | null;
  isInitializing: boolean;
}

/**
 * Context contract (what the rest of the app can use)
 */
interface AuthContextType extends AuthState {
  connectWallet: (role: UserRole) => Promise<void>;
  logout: () => void;
}

/**
 * Initial empty context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Key used for sessionStorage persistence
 */
const STORAGE_KEY = "idenvault_session";

/**
 * AuthProvider wraps the entire application
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (stored) {
        const parsed = JSON.parse(stored);

        setWalletAddress(parsed.walletAddress);
        setRole(parsed.role);
        setLoginTimestamp(parsed.loginTimestamp);
    }

    setIsInitializing(false);
  }, []);

  /**
   * Restore session from sessionStorage on app load
   */
  useEffect(() => {
    const storedSession = sessionStorage.getItem(STORAGE_KEY);
    if (!storedSession) return;

    try {
      const parsed = JSON.parse(storedSession);
      setWalletAddress(parsed.walletAddress);
      setRole(parsed.role);
      setLoginTimestamp(parsed.loginTimestamp);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Connect MetaMask wallet and start session
   */
  const connectWallet = async (selectedRole: UserRole) => {
    if (!window.ethereum) {
        throw new Error("MetaMask not installed");
    }

    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
        throw new Error("No wallet accounts found");
    }

    const address = accounts[0];
    const timestamp = Date.now();

    const normalizedAddress = address.toLowerCase();

    let finalRole = selectedRole;

    if (normalizedAddress === ADMIN_WALLET_ADDRESS.toLowerCase()) {
    finalRole = "admin";
    }

    setWalletAddress(address);
    setRole(finalRole);
    setLoginTimestamp(timestamp);

    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
        walletAddress: address,
        role: finalRole,
        loginTimestamp: timestamp,
        })
    );
  };


  /**
   * Logout: clear session and reset state
   */
  const logout = () => {
    setWalletAddress(null);
    setRole(null);
    setLoginTimestamp(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    walletAddress,
    role,
    isConnected: Boolean(walletAddress),
    loginTimestamp,
    connectWallet,
    logout,
    isInitializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook for consuming AuthContext safely
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
