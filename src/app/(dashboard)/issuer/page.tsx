"use client";
import { useState } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { Search, ShieldCheck, FileText, Ban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const mockIssuedCredentials = [
  {
    id: "issued-1",
    studentId: "STU2023001",
    title: "Bachelor of Computer Science",
    status: "Active",
    date: "12 Aug 2024"
  },
  {
    id: "issued-2",
    studentId: "STU2023002",
    title: "Dean’s List Award",
    status: "Active",
    date: "05 Feb 2024"
  },
  {
    id: "issued-3",
    studentId: "STU2023005",
    title: "Cybersecurity Fundamentals",
    status: "Active",
    date: "20 Dec 2023"
  },
];

export default function IssuerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredCredentials = mockIssuedCredentials.filter((cred) =>
    cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RequireAuth allowedRole="issuer">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Issued Credentials</h2>
            <p className="text-slate-400 mt-1">Manage and track certificates issued by your institution.</p>
            <p className="text-xs text-slate-500 mt-2">
                Issuer actions are subject to administrative approval.
            </p>
          </div>

          <button
            onClick={() => router.push("/issuer/issue")}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus size={18} />
            Issue New Credential
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Student ID or Credential Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        {/* Credentials List (Table Style for Admin) */}
        <div className="grid gap-4">
          {filteredCredentials.map((cred, index) => (
            <motion.div
              key={cred.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all"
            >
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-slate-800 rounded-lg text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {cred.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                    <span className="font-mono bg-black/20 px-2 py-0.5 rounded border border-slate-800">
                      {cred.studentId}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                       • Issued: {cred.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inside the map loop in src/app/(dashboard)/issuer/page.tsx */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    {cred.status}
                </div>
                
                <div className="flex-1 md:flex-none"></div>

                {/* NEW: View Details Button */}
                <button
                    onClick={() => router.push(`/issuer/credentials/${cred.id}`)}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                >
                    View Details
                </button>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}