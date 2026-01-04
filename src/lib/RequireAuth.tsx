"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

/**
 * Guards a route based on wallet connection and role
 */
export default function RequireAuth({
  children,
  allowedRole,
}: RequireAuthProps) {
  const router = useRouter();
  const { isConnected, role, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;

    if (!isConnected || role !== allowedRole) {
        router.replace("/");
    }
  }, [isInitializing, isConnected, role, allowedRole, router]);

  if (isInitializing) {
    return null;
  }

  if (!isConnected || role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
