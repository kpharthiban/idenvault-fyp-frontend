"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import {
  ShieldCheck,
  LayoutDashboard,
  FilePlus,
  LogOut,
  GraduationCap,
  Building2,
  Settings,
  Globe,
  FileBox,
  UserCog,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const defaultIssuerProfile = {
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

  const [issuerData, setIssuerData] = useState(defaultIssuerProfile);
  const [holderData, setHolderData] = useState<{ name: string; student_id: string; institution: string }>({
    name: "",
    student_id: "",
    institution: "",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchIssuerProfile = useCallback(async () => {
    if (role !== "issuer" || !walletAddress) return;
    const res = await apiGet<{ institution: string; department: string }>("/api/profile", walletAddress);
    if (res.success && res.data) {
      setIssuerData({
        institution: res.data.institution || "",
        department: res.data.department || "",
      });
    }
  }, [role, walletAddress]);

  const fetchHolderProfile = useCallback(async () => {
    if (role !== "student" || !walletAddress) return;
    const res = await apiGet<{ name: string; student_id: string; institution: string }>("/api/holder-profile", walletAddress);
    if (res.success && res.data) {
      setHolderData({
        name: res.data.name || "",
        student_id: res.data.student_id || "",
        institution: res.data.institution || "",
      });
    }
  }, [role, walletAddress]);

  useEffect(() => {
    fetchIssuerProfile();
    fetchHolderProfile();
  }, [fetchIssuerProfile, fetchHolderProfile]);

  useEffect(() => {
    const handleIssuerUpdate = () => { fetchIssuerProfile(); };
    window.addEventListener("issuerProfileUpdated", handleIssuerUpdate);
    return () => window.removeEventListener("issuerProfileUpdated", handleIssuerUpdate);
  }, [fetchIssuerProfile]);

  useEffect(() => {
    const handleHolderUpdate = () => { fetchHolderProfile(); };
    window.addEventListener("holderProfileUpdated", handleHolderUpdate);
    return () => window.removeEventListener("holderProfileUpdated", handleHolderUpdate);
  }, [fetchHolderProfile]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const isActive = (path: string) => pathname === path;

  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  // ── Sidebar inner content (shared between desktop and mobile) ──
  const sidebarContent = (
    <>
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

      {/* 2. Profile Card */}
      <div className="px-6 mb-2">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            {role === "student" ? <GraduationCap size={40} /> : <Building2 size={40} />}
          </div>

          {role === "student" && (
            <div>
               <p className="text-xs text-blue-400 font-bold uppercase tracking-wide mb-1">Student Profile</p>
               {holderData.name ? (
                 <>
                   <h3 className="text-white font-semibold">{holderData.name}</h3>
                   <p className="text-sm text-slate-400 font-mono mb-2">{holderData.student_id || "No Student ID"}</p>
                   <div className="flex items-center gap-1 text-xs text-slate-500">
                     <Building2 size={10} />
                     {holderData.institution || "No institution set"}
                   </div>
                 </>
               ) : (
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Update your <Link href="/student/profile" className="text-blue-400 hover:underline">Holder Profile</Link> to display your identity here.
                 </p>
               )}
            </div>
          )}

          {role === "issuer" && (
             <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide mb-1">Issuer ID</p>
                {issuerData.institution ? (
                  <>
                    <h3 className="text-white font-semibold line-clamp-1">{issuerData.institution}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{issuerData.department || "No department set"}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Update your <Link href="/issuer/profile" className="text-emerald-400 hover:underline">Institution Profile</Link> to display your identity here.
                  </p>
                )}
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
          <>
            <NavItem
              href="/student"
              icon={<LayoutDashboard size={20} />}
              label="My Credentials"
              active={isActive("/student")}
            />
            <NavItem
              href="/student/profile"
              icon={<UserCog size={20} />}
              label="Holder Profile"
              active={isActive("/student/profile")}
            />
          </>
        )}

        {role === "issuer" && (
          <>
            <NavItem
              href="/issuer"
              icon={<LayoutDashboard size={20} />}
              label="Issued Credentials"
              active={isActive("/issuer")}
            />

            <NavItem
              href="/issuer/templates"
              icon={<FileBox size={20} />}
              label="Credential Templates"
              active={isActive("/issuer/templates")}
            />

            <NavItem
              href="/issuer/profile"
              icon={<UserCog size={20} />}
              label="Institution Profile"
              active={isActive("/issuer/profile")}
            />

            <NavItem
              href="/issuer/issue"
              icon={<FilePlus size={20} />}
              label="Issue Credential"
              active={isActive("/issuer/issue") || isActive("/issuer/issue/bulk")}
            />

            <NavItem
              href="/issuer/external-systems"
              icon={<Globe size={20} />}
              label="External Systems"
              active={isActive("/issuer/external-systems")}
            />
          </>
        )}
      </nav>

      {/* 4. Wallet & Logout */}
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
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">

      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-72 bg-slate-900 border-r border-slate-800 flex-col fixed h-full z-20">
        {sidebarContent}
      </aside>

      {/* ── Mobile Top Bar (<lg) ── */}
      <MobileTopBar
        walletAddress={walletAddress}
        role={role}
        drawerOpen={drawerOpen}
        onToggle={toggleDrawer}
      />

      {/* ── Mobile Drawer Overlay (<lg) ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Slide-over panel */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto lg:hidden"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-6 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
              >
                <X size={20} />
              </button>

              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-8 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 relative">
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

// ── Mobile Top Bar ────────────────────────────────────────────────

function MobileTopBar({
  walletAddress,
  role,
  drawerOpen,
  onToggle,
}: {
  walletAddress: string | null;
  role: string | null;
  drawerOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex lg:hidden items-center justify-between px-4 h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <span className="text-base font-bold text-white tracking-tight">IdenVault</span>
        </Link>
      </div>

      {/* Right: wallet pill */}
      <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {walletAddress ? (
          <span>{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
        ) : (
          <span className="text-slate-500">{role ?? "---"}</span>
        )}
      </div>
    </div>
  );
}

// ── Nav Item ──────────────────────────────────────────────────────

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
