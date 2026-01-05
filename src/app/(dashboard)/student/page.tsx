"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCodeModal from "@/components/QRCodeModal";
import RequireAuth from "@/lib/RequireAuth";
import { Search, Eye, Share2, CheckCircle, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";

// Enhanced Mock Data
const mockCredentials = [
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    issuer: "Multimedia University",
    date: "12 Aug 2024",
    status: "Valid",
    type: "degree", 
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    issuer: "Faculty of Computing",
    date: "05 Feb 2024",
    status: "Valid",
    type: "award",
  },
  {
    id: "cred-3",
    title: "Certified Ethical Hacker (Practical)",
    issuer: "EC-Council",
    date: "20 Dec 2023",
    status: "Valid",
    type: "cert",
  },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCredentials = mockCredentials.filter((cred) =>
    cred.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <RequireAuth allowedRole="student">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">My Wallet</h2>
            <p className="text-slate-400 mt-1">Manage and share your verified academic assets.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.map((cred, index) => (
            <motion.div
              key={cred.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              {/* Card Decoration (Top Gradient) */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="p-6">
                {/* Header: Icon & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-800 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
                    {cred.type === "award" ? <Award size={24} /> : <Shield size={24} />}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <CheckCircle size={12} />
                    {cred.status}
                  </div>
                </div>

                {/* Content: Title & Issuer */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors">
                    {cred.title}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    {cred.issuer}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-mono">Issued: {cred.date}</p>
                </div>

                {/* Actions: Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push(`/student/credentials/${cred.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors border border-slate-700"
                  >
                    <Eye size={16} />
                    View
                  </button>

                  <button
                    onClick={() => setQrUrl(`${window.location.origin}/verify?ref=${cred.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State (If search yields no results) */}
        {filteredCredentials.length === 0 && (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <p className="text-slate-500">No credentials found.</p>
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