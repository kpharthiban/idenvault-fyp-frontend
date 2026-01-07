"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FilePlus, 
  LogOut, 
  GraduationCap, 
  Building2, 
  Settings,
  Globe,
  FileBox
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

// --- Mock Data (As you requested) ---
const studentProfile = {
  name: "John Doe",
  studentId: "STU2023001",
  institution: "Multimedia University",
};

const issuerProfile = {
  institution: "Multimedia University",
  department: "Faculty of Computing & Informatics",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { walletAddress, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-20">
        
        {/* 1. Header / Logo */}
        <div className="p-8 pb-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">IdenVault</h1>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {role} Mode
              </span>
            </div>
          </Link>
        </div>

        {/* 2. THE NEW PROFILE CARD (Your Logic + New Design) */}
        <div className="px-6 mb-2">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
            
            {/* Background Decor inside card */}
            <div className="absolute top-0 right-0 p-2 opacity-10">
              {role === "student" ? <GraduationCap size={40} /> : <Building2 size={40} />}
            </div>

            {role === "student" && (
              <div>
                 <p className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-1">Student ID</p>
                 <h3 className="text-white font-semibold">{studentProfile.name}</h3>
                 <p className="text-sm text-slate-400 font-mono mb-2">{studentProfile.studentId}</p>
                 <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Building2 size={10} />
                    {studentProfile.institution}
                 </div>
              </div>
            )}

            {role === "issuer" && (
               <div>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide mb-1">Issuer ID</p>
                  <h3 className="text-white font-semibold">{issuerProfile.institution}</h3>
                  <p className="text-xs text-slate-400">{issuerProfile.department}</p>
               </div>
            )}

            {role === "admin" && (
               <div>
                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wide mb-1">System Admin</p>
                  <h3 className="text-white font-semibold">Administrator</h3>
                  <p className="text-xs text-slate-400">Governance Panel</p>
               </div>
            )}
          </div>
        </div>

        {/* 3. Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          
          {role === "admin" && (
             <NavItem 
               href="/admin" 
               icon={<Settings size={20} />} 
               label="Admin Dashboard" 
               active={isActive("/admin")} 
             />
          )}

          {role === "student" && (
            <NavItem 
              href="/student" 
              icon={<LayoutDashboard size={20} />} 
              label="My Credentials" 
              active={isActive("/student")} 
            />
          )}

          {role === "issuer" && (
            <>
              {/* 1. Issued List */}
              <NavItem 
                href="/issuer" 
                icon={<LayoutDashboard size={20} />} 
                label="Issued Credentials" 
                active={isActive("/issuer")} 
              />

              {/* 2. TEMPLATES (NEW POSITION) */}
              <NavItem 
                href="/issuer/templates" 
                icon={<FileBox size={20} />} 
                label="Credential Templates" 
                active={isActive("/issuer/templates")} 
              />

              {/* 3. Issue Actions */}
              <NavItem 
                href="/issuer/issue" 
                icon={<FilePlus size={20} />} 
                label="Issue Credential" 
                active={isActive("/issuer/issue") || isActive("/issuer/issue/bulk")} 
              />

              {/* 4. External Systems */}
              <NavItem 
                href="/issuer/external-systems" 
                icon={<Globe size={20} />} 
                label="External Systems" 
                active={isActive("/issuer/external-systems")} 
              />
            </>
          )}
        </nav>

        {/* 4. Wallet & Logout (Bottom) */}
        <div className="p-6 border-t border-slate-800">
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">Connected Wallet</p>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-black/20 p-2 rounded border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              {walletAddress ? (
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              ) : (
                <span>Not Connected</span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-8 relative">
        {/* Gradient Glow Effect */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

// Sub-component for clean Navigation Items
function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}