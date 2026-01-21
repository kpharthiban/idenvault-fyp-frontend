"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { QRCodeSVG } from "qrcode.react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  User, 
  Fingerprint, 
  ExternalLink, 
  Building2,
  FileCheck,
  Copy,
  CheckCircle,
  Clock // Imported Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Expanded Mock Data
const mockCredentials = [
  {
    id: "cred-status-1",
    title: "Student Identification Credential",
    issuer: "Multimedia University",
    status: "Active",
    studentId: "STU2023001",
    studentName: "John Doe",
    issuedDate: "01 Jan 2024",
    expiryDate: "31 Dec 2026",
    description: "Verifies active student enrollment status for the current academic session. This credential does not constitute identity authentication.",
    txHash: "0x9a2...3b1c",
    network: "Ethereum Sepolia",
    certificateUrl: "#",
    type: "status"
  },
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
    certificateUrl: "/certificates/cred-1.pdf",
    type: "degree"
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
    certificateUrl: "/certificates/cred-2.pdf",
    type: "award"
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
    certificateUrl: "/certificates/cred-3.pdf",
    type: "cert"
  },
];

export default function CredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const credentialId = params.id as string;
  
  // State for "Share & Present" Tabs
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");
  const [copied, setCopied] = useState(false);
  
  // State for QR Timer
  const [secondsLeft, setSecondsLeft] = useState(30);

  const credential = mockCredentials.find(
    (cred) => cred.id === credentialId
  );

  // Timer Logic (Refreshes periodically for "Live" feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
             return 30; // Loop back to 30 to simulate "Refresh"
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    if (!credential) return;
    const link = `${window.location.origin}/verify?ref=${credential.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Determine styles based on credential type
  const isStatusCred = credential.type === "status";
  const accentColor = isStatusCred ? "text-emerald-400" : "text-emerald-400";
  const badgeBg = isStatusCred ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-500/10 border-emerald-500/20";

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
          
          {/* LEFT COL: The Visual Credential */}
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

              {/* Credential Header */}
              <div className="relative z-10 text-center mb-10">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-6 ${badgeBg} ${accentColor}`}>
                  {isStatusCred ? <Clock size={12} /> : <ShieldCheck size={12} />}
                  {isStatusCred ? "Active Status" : "Blockchain Verified"}
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

              {/* Credential Body */}
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
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {isStatusCred ? "Valid Until" : "Date of Issue"}
                  </p>
                  <p className="text-white font-medium">
                    {isStatusCred ? credential.expiryDate : credential.issuedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Share & Present Credential Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Share & Present Credential</h3>
                        <p className="text-slate-400 text-sm">
                            Choose a method to present this credential for verification.
                        </p>
                    </div>
                    {/* Only show PDF download if it's not a status card or if URL exists */}
                    {!isStatusCred && credential.certificateUrl !== "#" && (
                        <a
                            href={credential.certificateUrl}
                            download
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
                        >
                            <FileCheck size={16} />
                            PDF
                        </a>
                    )}
                </div>

                <div className="flex gap-6 border-b border-slate-800 mb-6">
                    <button
                        onClick={() => setActiveTab("link")}
                        className={`pb-2 text-sm font-medium transition-colors relative ${
                            activeTab === "link" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        Verification Link (Shareable)
                        {activeTab === "link" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("qr")}
                        className={`pb-2 text-sm font-medium transition-colors relative ${
                            activeTab === "qr" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        Live Presentation QR
                        {activeTab === "qr" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "link" ? (
                        <motion.div
                            key="link"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                                <code className="text-sm text-slate-300 font-mono truncate flex-1">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/verify?ref=${credential.id}` : `.../verify?ref=${credential.id}`}
                                </code>
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Use this link to share your credential for online or asynchronous verification (e.g., on LinkedIn or resumes).
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="qr"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center"
                        >
                            {/* Timer Badge */}
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium mb-4 transition-colors ${
                                secondsLeft < 10 ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                            }`}>
                                <Clock size={12} />
                                QR refreshes in {secondsLeft}s
                            </div>

                            <div className="bg-white p-4 rounded-xl mb-4 relative overflow-hidden group">
                                {/* Visual scanner line effect */}
                                <motion.div 
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] pointer-events-none"
                                />
                                <QRCodeSVG 
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/verify?ref=${credential.id}` : ""} 
                                    size={200} 
                                />
                            </div>
                            <p className="text-sm text-slate-300 text-center max-w-xs mb-2">
                                Scan to verify immediately.
                            </p>
                            <p className="text-xs text-slate-500 text-center max-w-sm">
                                This QR code refreshes periodically and is intended for live, in-person verification to demonstrate active credential presentation.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Trust Note */}
                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-600">
                        Verification results depend on issuer trust status and credential validity.
                    </p>
                </div>
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
                
                {/* Expiry if exists */}
                {credential.expiryDate !== "Never" && (
                     <div className="group mt-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-1">
                            <Clock size={12} /> Expiry Date
                        </div>
                        <div className="text-sm text-slate-300 font-medium">
                            {credential.expiryDate}
                        </div>
                     </div>
                )}

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
    </RequireAuth>
  );
}