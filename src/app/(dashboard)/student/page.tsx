"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// REMOVED: import QRCodeModal (Sharing is now handled in Detail Page for security context)
import RequireAuth from "@/lib/RequireAuth";
import { Search, Eye, CheckCircle, Shield, Award, User, Clock } from "lucide-react";
import { motion } from "framer-motion";

// Enhanced Mock Data including the new "Status" Credential
const mockCredentials = [
  {
    id: "cred-status-1",
    title: "Student Identification Credential",
    issuer: "Multimedia University",
    date: "Expires: 31 Dec 2026", // Showing expiry is crucial for status
    status: "Active",
    type: "status", // New Type
  },
  {
    id: "cred-1",
    title: "Bachelor of Computer Science",
    issuer: "Multimedia University",
    date: "Issued: 12 Aug 2024",
    status: "Active",
    type: "degree", 
  },
  {
    id: "cred-2",
    title: "Dean’s List Award",
    issuer: "Faculty of Computing",
    date: "Issued: 05 Feb 2024",
    status: "Active",
    type: "award",
  },
  {
    id: "cred-3",
    title: "Certified Ethical Hacker (Practical)",
    issuer: "EC-Council",
    date: "Issued: 20 Dec 2023",
    status: "Active",
    type: "cert",
  },
];

export default function StudentDashboard() {
  const router = useRouter();
  // REMOVED: qrUrl state (Moved to detail page)
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
            <p className="text-slate-400 mt-1">Manage your verified academic assets and identity claims.</p>
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
              {/* Card Decoration (Dynamic Gradient based on Type) */}
              <div className={`absolute top-0 left-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${
                  cred.type === 'status' ? 'from-emerald-500 to-teal-500' : 
                  cred.type === 'award' ? 'from-purple-500 to-pink-500' :
                  'from-blue-500 to-cyan-500'
              }`} />

              <div className="p-6">
                {/* Header: Icon & Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg transition-colors ${
                      cred.type === 'status' ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' :
                      cred.type === 'award' ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20' :
                      'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20'
                  }`}>
                    {cred.type === "award" ? <Award size={24} /> : 
                     cred.type === "status" ? <User size={24} /> :
                     <Shield size={24} />}
                  </div>
                  
                  {/* Type Badge */}
                  <div className="px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                    {<CheckCircle size={12} />}
                    {'Active'}
                  </div>
                </div>

                {/* Content: Title & Issuer */}
                <div className="mb-6 min-h-[5rem]">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors line-clamp-2">
                    {cred.title}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    {cred.issuer}
                  </p>
                  
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 font-mono">
                    {cred.type === 'status' ? <Clock size={12} /> : null}
                    {cred.date}
                  </div>
                </div>

                {/* Actions: Single 'View' Button */}
                <div>
                  <button
                    onClick={() => router.push(`/student/credentials/${cred.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
                  >
                    <Eye size={16} />
                    View Details & Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCredentials.length === 0 && (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <p className="text-slate-500">No credentials found.</p>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}