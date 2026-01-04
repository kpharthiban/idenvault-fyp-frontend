"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const { connectWallet, isConnected, role } = useAuth();

  const selectedRole = roleParam as UserRole;

  // Validate role from query
  useEffect(() => {
    if (selectedRole !== "student" && selectedRole !== "issuer") {
      router.replace("/");
    }
  }, [selectedRole, router]);

  // If already connected, redirect immediately
  useEffect(() => {
    if (isConnected && role) {
      router.replace(`/${role}`);
    }
  }, [isConnected, role, router]);

  const handleConnect = async () => {
    try {
        await connectWallet(selectedRole);
        router.replace(`/${selectedRole}`);
    } catch (error: any) {
        alert(error.message || "Failed to connect wallet");
    }
  };


  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-md text-center">
        <button
            onClick={() => router.push("/")}
            className="text-sm text-blue-600 hover:underline mb-4"
            >
            ← Back to Role Selection
        </button>

        <h1 className="text-2xl text-black font-bold mb-2">Connect Wallet</h1>

        <p className="text-gray-600 mb-6">
          You are signing in as{" "}
          <span className="font-medium capitalize">{selectedRole}</span>
        </p>

        <button
          onClick={handleConnect}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect MetaMask
        </button>

        <p className="text-xs text-gray-500 mt-6">
          Your wallet will be used as your digital identity.
        </p>
      </div>
    </main>
  );
}
