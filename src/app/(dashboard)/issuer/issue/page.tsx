"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";

export default function IssueCredentialPage() {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [issued, setIssued] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !title) {
      alert("Please fill in all fields");
      return;
    }

    // Mock issuance
    setIssued(true);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-lg">
        <h2 className="text-2xl text-black font-bold mb-6">Issue New Credential</h2>

        {issued ? (
            <div className="p-6 bg-green-100 text-green-800 rounded">
            <h3 className="text-lg font-semibold mb-2">
            Credential Issued Successfully
            </h3>

            <p className="text-sm mb-4">
            The credential has been issued to the specified participant (mock).
            </p>

            <div className="flex gap-3">
            <button
                onClick={() => router.push("/issuer")}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
                Back to Dashboard
            </button>

            <button
                onClick={() => {
                setIssued(false);
                setStudentId("");
                setTitle("");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
                Issue Another Credential
            </button>
            </div>
            </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-black font-medium">
                Student Identifier
              </label>
              <p className="text-xs text-gray-500 mb-2">
                In a full system, this identifier would be linked to a registered student wallet.
              </p>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU2023001"
                className="w-full text-gray-500 border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-black font-medium mb-1">
                Credential Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bachelor of Computer Science"
                className="w-full text-gray-500 border rounded px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Issue Credential
            </button>
          </form>
        )}
      </div>
    </RequireAuth>
  );
}
