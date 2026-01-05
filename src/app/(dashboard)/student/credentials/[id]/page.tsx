"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import QRCodeModal from "@/components/QRCodeModal";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  User, 
  Fingerprint, 
  Share2, 
  ExternalLink, 
  Building2,
  FileCheck
} from "lucide-react";
import { motion } from "framer-motion";

// Expanded Mock Data to include 'Blockchain' details
const mockCredentials = [
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    issuer: "Multimedia University",
    status: "Verified",
    studentId: "STU2023001",
    studentName: "John Doe",
    issuedDate: "12 August 2024",
    expiryDate: "Never",
    description: "This credential certifies that the holder has successfully completed the Bachelor of Computer Science programme with Honours, demonstrating proficiency in software engineering, algorithms, and system design.",
    txHash: "0x71c...9a2b",
    network: "Ethereum Sepolia",
    certificateUrl: "/certificates/cred-1.pdf"
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    issuer: "Faculty of Computing",
    status: "Verified",
    studentId: "STU2023001",
    studentName: "John Doe",
    issuedDate: "5 February 2024",
    expiryDate: "Never",
    description: "Awarded for achieving a GPA of 3.8 and above in the Trimester 1 2023/2024 academic session, recognizing outstanding academic performance and dedication.",
    txHash: "0x3d2...1f8c",
    network: "Ethereum Sepolia",
    certificateUrl: "/certificates/cred-2.pdf"
  },
  {
    id: "cred-3",
    title: "Certified Ethical Hacker (Practical)",
    issuer: "EC-Council",
    status: "Verified",
    studentId: "STU2023001",
    studentName: "John Doe",
    issuedDate: "20 December 2023",
    expiryDate: "20 December 2026",
    description: "Validates the candidate's skills in identifying, countering, and preventing network attacks. The holder has demonstrated proficiency in system hacking, enumeration, and vulnerability analysis under live test conditions.",
    txHash: "0x8f2...b4e1",
    network: "Ethereum Sepolia",
    certificateUrl: "/certificates/cred-3.pdf"
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

  if (!credential) {
    return (
      <RequireAuth allowedRole="student">
        <div className="flex flex-col items-center justify-center h-96 text-slate-500">
          <p>Credential not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">Go Back</button>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRole="student">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation */}
        <button
          onClick={() => router.push("/student")}
          className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Wallet
        </button>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: The Visual Certificate */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 overflow-hidden shadow-2xl">
              
              {/* Background Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <ShieldCheck size={300} />
              </div>

              {/* Certificate Header */}
              <div className="relative z-10 text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                  <ShieldCheck size={12} />
                  Blockchain Verified
                </div>
                
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 tracking-wide">
                  {credential.title}
                </h1>
                
                <div className="text-slate-400 text-sm uppercase tracking-widest mb-1">Issued By</div>
                <div className="text-xl text-blue-200 font-semibold flex items-center justify-center gap-2">
                  <Building2 size={20} />
                  {credential.issuer}
                </div>
              </div>

              {/* Certificate Body */}
              <div className="relative z-10 bg-slate-950/50 rounded-xl p-6 border border-slate-800/50 backdrop-blur-sm">
                <p className="text-slate-300 leading-relaxed text-center font-serif text-lg italic">
                  &quot;{credential.description}&quot;
                </p>
              </div>

              {/* Footer / Signature Area */}
              <div className="relative z-10 mt-10 flex justify-between items-end border-t border-slate-800 pt-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Awarded To</p>
                  <p className="text-white font-medium">{credential.studentName}</p>
                  <p className="text-xs text-slate-500 font-mono">{credential.studentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date of Issue</p>
                  <p className="text-white font-medium">{credential.issuedDate}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setQrUrl(`${window.location.origin}/verify?ref=${credential.id}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Share Credential
              </button>
              <a
                href={credential.certificateUrl}
                download
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-medium border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                <FileCheck size={18} />
                Download PDF
              </a>
            </div>
          </motion.div>


          {/* RIGHT COL: Technical Metadata (The "Blockchain" part) */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="lg:col-span-1"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Fingerprint className="text-blue-500" />
                Digital Fingerprint
              </h3>

              <div className="space-y-6">
                {/* Item 1 */}
                <div className="group">
                  <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-1">
                    <User size={12} /> Credential ID
                  </div>
                  <div className="font-mono text-sm text-slate-300 break-all bg-black/20 p-2 rounded border border-slate-800/50 group-hover:border-blue-500/30 transition-colors">
                    {credential.id}
                  </div>
                </div>

                {/* Item 2 */}
                <div className="group">
                  <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-1">
                    <ShieldCheck size={12} /> Transaction Hash
                  </div>
                  <div className="font-mono text-sm text-blue-400 break-all bg-blue-900/10 p-2 rounded border border-blue-500/20 cursor-pointer hover:bg-blue-900/20 transition-colors">
                    {credential.txHash}
                  </div>
                </div>

                {/* Item 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-1">
                      <Calendar size={12} /> Issued
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      {credential.issuedDate}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-1">
                      <ShieldCheck size={12} /> Network
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      {credential.network}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-800 my-4" />

                {/* Verification Link */}
                <a 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all group"
                >
                  <span className="text-sm text-slate-400 group-hover:text-blue-400">View on Etherscan</span>
                  <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
                </a>
              </div>
            </div>
          </motion.div>
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