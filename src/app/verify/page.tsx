"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState("");
  const [verified, setVerified] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const isRevoked = false; // mock: future revocation check

  const handleVerify = () => {
    if (!credentialId) {
      alert("Please enter a credential reference");
      return;
    }

    // Mock verification
    setVerified(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-lg">
        <button
            onClick={() => router.push("/")}
            className="text-sm text-blue-600 hover:underline mb-4"
            >
            ← Back to Home
        </button>

        <h1 className="text-2xl text-black font-bold mb-4">Verify Credential</h1>

        {!verified ? (
          <>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="Enter credential reference"
              className="w-full text-gray-500 border rounded px-3 py-2 mb-4"
            />

            <button
              onClick={handleVerify}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              Verify
            </button>
            <button
                onClick={() => router.push("/scan")}
                className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                Scan QR Code Instead
            </button>

          </>
        ) : (
          <>
            {!isRevoked ? (
                <div className="p-4 mb-4 bg-green-100 text-green-800 rounded">
                    Credential is valid and issued by a trusted institution.
                </div>
                ) : (
                <div className="p-4 mb-4 bg-red-100 text-red-800 rounded">
                    This credential has been revoked by the issuing institution.
                </div>
            )}
            <p className="text-xs text-gray-500">
                Credential status is determined by the issuing institution during verification.
            </p>


            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Issuer: Universiti Teknologi Malaysia
              </p>
              <p className="text-sm text-gray-700">
                Credential: Bachelor of Computer Science
              </p>
            </div>

            {!showAI ? (
              <button
                onClick={() => setShowAI(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Are you an employer? Generate interview questions
              </button>
            ) : (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-black mb-2">
                  AI-Generated Interview Questions (Mock)
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Explain how you applied software engineering principles in
                    your final year project.
                  </li>
                  <li>
                    Describe a challenging system design decision you made and
                    how you justified it.
                  </li>
                  <li>
                    How would you improve the scalability of this system?
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
