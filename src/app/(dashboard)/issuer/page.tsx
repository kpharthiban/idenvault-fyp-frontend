"use client";
import { useState } from "react";

import RequireAuth from "@/lib/RequireAuth";

const mockIssuedCredentials = [
  {
    id: "issued-1",
    studentId: "STU2023001",
    title: "Bachelor of Computer Science",
    status: "Active",
  },
  {
    id: "issued-2",
    studentId: "STU2023002",
    title: "Dean’s List Award",
    status: "Active",
  },
];


export default function IssuerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCredentials = mockIssuedCredentials.filter((cred) =>
    cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <RequireAuth allowedRole="issuer">
      <div>
        <h2 className="text-2xl text-black font-bold mb-6">Issued Credentials</h2>

        <input
            type="text"
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-gray-500 mb-4 px-3 py-2 border rounded text-sm focus:outline-none focus:ring"
        />

        <div className="space-y-4">
          {filteredCredentials.map((cred) => (
            <div
              key={cred.id}
              className="border rounded-lg p-5 bg-white shadow-sm"
            >
              <h3 className="text-lg text-black font-semibold mb-1">{cred.title}</h3>
              <p className="text-sm text-gray-600">
                Student ID: {cred.studentId}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="inline-block px-3 py-1 text-xs rounded bg-green-100 text-green-800">
                    {cred.status}
                </span>

                <button
                    disabled
                    title="Credential revocation will be supported in future versions"
                    className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                    Revoke (Future)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
