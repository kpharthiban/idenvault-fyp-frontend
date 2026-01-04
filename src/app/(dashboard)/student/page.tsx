"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCodeModal from "@/components/QRCodeModal";
import RequireAuth from "@/lib/RequireAuth";

const mockCredentials = [
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    issuer: "Universiti Teknologi Malaysia",
    status: "Valid",
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    issuer: "Universiti Teknologi Malaysia",
    status: "Valid",
  },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  
  return (
    <RequireAuth allowedRole="student">
      <div>
        <h2 className="text-2xl text-black font-bold mb-6">My Credentials</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {mockCredentials.map((cred) => (
            <div
              key={cred.id}
              className="border rounded-lg p-5 bg-white shadow-sm"
            >
              <h3 className="text-lg text-black font-semibold mb-1">{cred.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                Issued by: {cred.issuer}
              </p>

              <span className="inline-block px-3 py-1 text-xs rounded bg-green-100 text-green-800">
                {cred.status}
              </span>

              <div className="mt-4 flex gap-3">
                <button
                    onClick={() => router.push(`/student/credentials/${cred.id}`)}
                    className="text-sm text-blue-600 hover:underline"
                    >
                    View
                </button>

                <button
                    onClick={() =>
                        setQrUrl(
                        `${window.location.origin}/verify?ref=${cred.id}`
                        )
                    }
                    className="text-sm text-blue-600 hover:underline"
                    >
                        Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {qrUrl && (
        <QRCodeModal
            url={qrUrl}
            onClose={() => setQrUrl(null)}
        />
      )}
    </RequireAuth>
  );
}