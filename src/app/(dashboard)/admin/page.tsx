"use client";

import { useState } from "react";
import RequireAuth from "@/lib/RequireAuth";

const mockIssuers = [
  {
    id: "ISSUER-UTM",
    name: "Universiti Teknologi Malaysia",
    wallet: "0xABC123...789",
    allowed: true,
  },
  {
    id: "ISSUER-UM",
    name: "Universiti Malaya",
    wallet: "0xDEF456...012",
    allowed: false,
  },
];

export default function AdminDashboard() {
  const [issuers, setIssuers] = useState(mockIssuers);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredIssuers = issuers.filter((issuer) =>
    issuer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issuer.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const toggleAllowlist = (id: string) => {
    setIssuers((prev) =>
      prev.map((issuer) =>
        issuer.id === id
          ? { ...issuer, allowed: !issuer.allowed }
          : issuer
      )
    );
  };

  return (
    <RequireAuth allowedRole="admin">
      <div>
        <h2 className="text-2xl text-black font-bold mb-6">Admin – Issuer Allowlist</h2>

        <input
          type="text"
          placeholder="Search issuers by name or wallet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-gray-500 mb-4 px-3 py-2 border rounded text-sm focus:outline-none focus:ring"
        />

        <div className="space-y-4">
          {filteredIssuers.map((issuer) => (
            <div
              key={issuer.id}
              className="flex items-center justify-between border p-4 rounded bg-white"
            >
              <div>
                <p className="text-black font-medium">{issuer.name}</p>
                <p className="text-xs text-gray-500">{issuer.id}</p>
              </div>

              <button
                onClick={() => toggleAllowlist(issuer.id)}
                className={`px-3 py-1 text-sm rounded ${
                  issuer.allowed
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {issuer.allowed ? "Allowed" : "Blocked"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
