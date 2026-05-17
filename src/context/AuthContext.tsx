"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { ethers } from "ethers";

export type UserRole = "student" | "issuer" | "admin";

interface AuthState {
  walletAddress: string | null;
  role: UserRole | null;
  isConnected: boolean;
  loginTimestamp: number | null;
  isInitializing: boolean;
}

interface AuthContextType extends AuthState {
  connectWallet: (roleHint?: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "idenvault_session";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore session on mount (single useEffect, no duplicate)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWalletAddress(parsed.walletAddress);
        setRole(parsed.role);
        setLoginTimestamp(parsed.loginTimestamp);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const connectingRef = useRef(false);

  const connectWallet = async (_roleHint?: UserRole) => {
    if (connectingRef.current) return;  // ← block double invocation
    connectingRef.current = true;

    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = (await signer.getAddress()).toLowerCase();

      const nonceRes = await fetch(`${API_URL}/api/auth/nonce?wallet=${address}`);
      if (!nonceRes.ok) throw new Error("Failed to fetch nonce from server");
      const { nonce } = await nonceRes.json();

      const signature = await signer.signMessage(nonce);

      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, signature }),
      });
      if (!verifyRes.ok) throw new Error("Wallet verification failed");
      const { wallet, role: backendRole } = await verifyRes.json();

      const timestamp = Date.now();
      setWalletAddress(wallet);
      setRole(backendRole);
      setLoginTimestamp(timestamp);
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ walletAddress: wallet, role: backendRole, loginTimestamp: timestamp })
      );
    } finally {
      connectingRef.current = false;  // ← always release the lock
    }
  };

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};