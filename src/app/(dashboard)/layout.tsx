"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api";
import { useIssuerTrust } from "@/hooks/useIssuerTrust";
import TrustBadge from "@/components/TrustBadge";
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

  // On-chain trust status for the signed-in issuer (authoritative registry read)
  const issuerTrust = useIssuerTrust(role === "issuer" ? walletAddress : null);

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

  const getRoleColor = () => {
    if (role === "issuer") return "emerald";
    if (role === "student") return "blue";
    if (role === "admin") return "purple";
    return "teal";
  };
  const roleColor = getRoleColor();

  const logoColorClass = 
    role === "issuer" ? "text-emerald-600 bg-emerald-50" : 
    role === "student" ? "text-blue-600 bg-blue-50" : 
    role === "admin" ? "text-purple-600 bg-purple-50" : 
    "text-teal-600 bg-teal-50";

  // ── Sidebar inner content (shared between desktop and mobile) ──
  const sidebarContent = (
    <>
      {/* 1. Header / Logo */}
      <div className="p-8 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className={clsx("p-2 rounded-xl transition-colors", logoColorClass)}>
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-900">IdenVault</h1>
            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium" data-testid="role-badge">
              {role} Mode
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Profile Card */}
      <div className="px-6 mb-2">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden transition-all duration-200 hover:border-slate-300">
          <div className="absolute top-0 right-0 p-2 opacity-5 text-slate-900">
            {role === "student" ? <GraduationCap size={40} /> : <Building2 size={40} />}
          </div>

          {role === "student" && (
            <div>
               <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wide mb-1">Student Profile</p>
               {holderData.name ? (
                 <>
                   <h3 className="text-slate-900 font-semibold">{holderData.name}</h3>
                   <p className="text-xs text-slate-500 font-mono mb-2">{holderData.student_id || "No Student ID"}</p>
                   <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                     <Building2 size={12} className="text-slate-400" />
                     {holderData.institution || "No institution set"}
                   </div>
                 </>
               ) : (
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Update your <Link href="/student/profile" className="text-blue-600 hover:underline font-medium">Holder Profile</Link> to display your identity here.
                 </p>
               )}
            </div>
          )}

          {role === "issuer" && (
             <div>
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wide mb-1">Issuer ID</p>
                {issuerData.institution ? (
                  <>
                    <h3 className="text-slate-900 font-semibold line-clamp-1">{issuerData.institution}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{issuerData.department || "No department set"}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Update your <Link href="/issuer/profile" className="text-emerald-600 hover:underline font-medium">Institution Profile</Link> to display your identity here.
                  </p>
                )}
                <div className="mt-3">
                  <TrustBadge status={issuerTrust} size="sm" />
                </div>
             </div>
          )}

          {role === "admin" && (
             <div>
                <p className="text-[11px] text-purple-600 font-bold uppercase tracking-wide mb-1">System Admin</p>
                <h3 className="text-slate-900 font-semibold">Administrator</h3>
                <p className="text-xs text-slate-500">Governance Panel</p>
             </div>
          )}
        </div>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">

        {role === "admin" && (
           <NavItem
             href="/admin"
             icon={<Settings size={18} />}
             label="Admin Dashboard"
             active={isActive("/admin")}
             role={role}
           />
        )}

        {role === "student" && (
          <>
            <NavItem
              href="/student"
              icon={<LayoutDashboard size={18} />}
              label="My Credentials"
              active={isActive("/student")}
              role={role}
            />
            <NavItem
              href="/student/profile"
              icon={<UserCog size={18} />}
              label="Holder Profile"
              active={isActive("/student/profile")}
              role={role}
            />
          </>
        )}

        {role === "issuer" && (
          <>
            <NavItem
              href="/issuer"
              icon={<LayoutDashboard size={18} />}
              label="Issued Credentials"
              active={isActive("/issuer")}
              role={role}
            />

            <NavItem
              href="/issuer/templates"
              icon={<FileBox size={18} />}
              label="Credential Templates"
              active={isActive("/issuer/templates")}
              role={role}
            />

            <NavItem
              href="/issuer/profile"
              icon={<UserCog size={18} />}
              label="Institution Profile"
              active={isActive("/issuer/profile")}
              role={role}
            />

            <NavItem
              href="/issuer/issue"
              icon={<FilePlus size={18} />}
              label="Issue Credential"
              active={isActive("/issuer/issue") || isActive("/issuer/issue/bulk")}
              role={role}
            />

            <NavItem
              href="/issuer/external-systems"
              icon={<Globe size={18} />}
              label="External Systems"
              active={isActive("/issuer/external-systems")}
              role={role}
            />
          </>
        )}
      </nav>

      {/* 4. Wallet & Logout */}
      <div className="p-6 border-t border-slate-200">
        <div className="mb-4">
          <p className="text-xs text-slate-500 font-medium mb-2">Connected Wallet</p>
          <div className="flex items-center gap-2 font-mono text-[13px] text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            <div className={`w-2 h-2 rounded-full animate-pulse ${role === 'issuer' ? 'bg-emerald-500' : role === 'student' ? 'bg-blue-500' : role === 'admin' ? 'bg-purple-500' : 'bg-teal-500'}`}></div>
            {walletAddress ? (
              <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            ) : (
              <span>Not Connected</span>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-600 font-medium hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
        >
          <LogOut size={16} />
          Disconnect
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F8F8] bg-dotgrid text-slate-900 font-sans">

      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col fixed h-full z-20">
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
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Slide-over panel */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col overflow-y-auto lg:hidden shadow-2xl"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-6 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors z-10"
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
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
  const logoColorClass = 
    role === "issuer" ? "text-emerald-600" : 
    role === "student" ? "text-blue-600" : 
    role === "admin" ? "text-purple-600" : 
    "text-teal-600";

  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex lg:hidden items-center justify-between px-4 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className={clsx("w-6 h-6", logoColorClass)} />
          <span className="font-heading text-base font-semibold text-slate-900 tracking-tight">IdenVault</span>
        </Link>
      </div>

      {/* Right: wallet pill */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${role === 'issuer' ? 'bg-emerald-500' : role === 'student' ? 'bg-blue-500' : role === 'admin' ? 'bg-purple-500' : 'bg-teal-500'}`} />
        {walletAddress ? (
          <span>{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
        ) : (
          <span className="text-slate-400 capitalize">{role ?? "---"}</span>
        )}
      </div>
    </div>
  );
}

// ── Nav Item ──────────────────────────────────────────────────────

function NavItem({ href, icon, label, active, role }: { href: string; icon: React.ReactNode; label: string; active: boolean; role?: string | null }) {
  let activeStyles = "bg-teal-50 text-teal-700 font-semibold border-l-2 border-l-teal-600";
  if (role === "issuer") activeStyles = "bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-l-emerald-600";
  if (role === "student") activeStyles = "bg-blue-50 text-blue-700 font-semibold border-l-2 border-l-blue-600";
  if (role === "admin") activeStyles = "bg-purple-50 text-purple-700 font-semibold border-l-2 border-l-purple-600";

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
        active
          ? activeStyles
          : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
