"use client";

import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { useState } from "react";
import QRCodeModal from "@/components/QRCodeModal";


const mockCredentials = [
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    issuer: "Universiti Teknologi Malaysia",
    status: "Valid",
    studentId: "STU2023001",
    issuedDate: "12 August 2024",
    description:
      "This credential certifies that the holder has successfully completed the Bachelor of Computer Science programme.",
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    issuer: "Universiti Teknologi Malaysia",
    status: "Valid",
    studentId: "STU2023001",
    issuedDate: "5 February 2024",
    description:
      "This award recognizes outstanding academic performance during the academic semester.",
  },
];

export default function CredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const credentialId = params.id as string;
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const credential = mockCredentials.find(
    (cred) => cred.id === credentialId
  );

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-3xl">
        <button
          onClick={() => router.push("/student")}
          className="text-sm text-blue-600 hover:underline mb-6"
        >
          ← Back to Dashboard
        </button>

        {!credential ? (
          <div className="p-4 bg-red-100 text-red-800 rounded">
            Credential not found.
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-8 shadow-sm">
            <h1 className="text-3xl text-black font-bold mb-2">
              {credential.title}
            </h1>

            <p className="text-gray-600 mb-6">
              Issued by <span className="font-medium">{credential.issuer}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Credential ID</p>
                <p className="font-mono text-sm text-black">
                  {credential.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-block px-3 py-1 text-xs rounded bg-green-100 text-green-800">
                  {credential.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Student Identifier</p>
                <p className="text-black">{credential.studentId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Issued Date</p>
                <p className="text-black">{credential.issuedDate}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">
                Credential Description
              </p>
              <p className="text-gray-800 leading-relaxed">
                {credential.description}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={() =>
                    setQrUrl(
                        `${window.location.origin}/verify?ref=${credential.id}`
                    )
                    }
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                >
                    Share Credential
                </button>
            </div>
          </div>
        )}
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
