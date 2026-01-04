"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { walletAddress, role, logout } = useAuth();

  {role === "admin" && (
    <button
        onClick={() => router.push("/admin")}
        className="block w-full text-left hover:underline"
    >
        Admin Dashboard
    </button>
  )}

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-xl font-bold mb-6">IdenVault</h1>

        <div className="mb-6 text-sm">
          <p className="opacity-70">Role</p>
          <p className="font-medium capitalize">{role}</p>
        </div>

        <div className="mb-6 text-sm">
          <p className="opacity-70">Wallet</p>
          <p className="font-mono text-xs break-all">
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </p>
        </div>

        <nav className="space-y-3">
          {role === "student" && (
            <button
              onClick={() => router.push("/student")}
              className="block w-full text-left hover:underline"
            >
              Dashboard
            </button>
          )}

          {role === "issuer" && (
            <>
              <button
                onClick={() => router.push("/issuer")}
                className="block w-full text-left hover:underline"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push("/issuer/issue")}
                className="block w-full text-left hover:underline"
              >
                Issue Credential
              </button>
            </>
          )}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 text-red-400 hover:underline text-sm"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
