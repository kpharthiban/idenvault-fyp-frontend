"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/lib/RequireAuth";
import { 
  ArrowLeft, 
  Send, 
  User, 
  Award, 
  Loader2, 
  CheckCircle, 
  Shield,
  Calendar,
  FileText,
  GraduationCap,
  Star,
  Upload,
  X,
  Paperclip,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CREDENTIAL_TEMPLATES } from "@/lib/credentialTemplates";

export default function IssueCredentialPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Consolidated Form State
  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    type: "degree", 
    grade: "",
    expiryDate: "",
    description: "",
    templateId: "", // Replaces 'title' and 'type' manual entry
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    const template = CREDENTIAL_TEMPLATES.find(t => t.id === tId);
    
    if (template) {
        setFormData(prev => ({
            ...prev,
            templateId: tId,
            title: template ? template.title : "", 
            type: template ? template.type : "degree"
        }));
    }
  };
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔍 DEBUGGING: Check what is actually in the state
    console.log("Form Submission State:", formData);

    // Specific checks to see which one fails
    if (!formData.studentId) console.error("Missing Student ID");
    if (!formData.title) console.error("Missing Title");
    if (!formData.description) console.error("Missing Description");

    if (!formData.studentId || !formData.title || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setStatus("submitting");

    // Simulate Blockchain Transaction + IPFS Upload Delay
    setTimeout(() => {
        setStatus("success");
    }, 2500);
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-3xl mx-auto">        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
            <button
            onClick={() => router.push("/issuer")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {/* NEW: Bulk Issuance Button */}
            <button
                onClick={() => router.push("/issuer/issue/bulk")}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 transition-all text-sm font-medium"
            >
                <Users size={16} />
                Switch to Bulk Mode
            </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
           {/* Top Accent */}
           <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />

           {status === "success" ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center py-10"
             >
                <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-6">
                    <CheckCircle className="w-16 h-16 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Credential Issued Successfully</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    The credential <strong>{formData.title}</strong> has been cryptographically signed and the document <strong>{selectedFile ? selectedFile.name : "Metadata"}</strong> has been pinned to IPFS.
                </p>
                
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => router.push("/issuer")}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => {
                            setStatus("idle");
                            setFormData({
                                studentId: "",
                                title: "",
                                type: "degree",
                                grade: "",
                                expiryDate: "",
                                description: "",
                                templateId: "",
                            });
                            setSelectedFile(null);
                        }}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        Issue Another
                    </button>
                </div>
             </motion.div>
           ) : (
             <>
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-emerald-500" />
                        Issue New Credential
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Fill in the academic details below. This data will be immutable once minted.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Credential Template *
                        </label>
                        <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <select
                                name="templateId"
                                value={formData.templateId}
                                onChange={handleTemplateChange}
                                disabled={status === "submitting"}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                            >
                                <option value="">-- Select a Template --</option>
                                {CREDENTIAL_TEMPLATES.map(t => {
                                    // LOGIC: Disable if mode is 'bulk' only
                                    const isDisabled = t.issuanceMode === 'bulk'; 
                                    return (
                                        <option 
                                            key={t.id} 
                                            value={t.id} 
                                            disabled={isDisabled}
                                            className={isDisabled ? "text-slate-600 bg-slate-900" : ""}
                                        >
                                            {t.title} {isDisabled ? "(Bulk Mode Only)" : ""}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {/* Student ID & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                Student Identifier *
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="e.g. STU2023001"
                                    disabled={status === "submitting"}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                             <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 ml-1">
                                Template Type (Locked)
                            </label>
                            <input disabled value={formData.type} className="w-full bg-slate-900/50 border border-slate-800 text-slate-500 rounded-xl py-3 px-4" />
                        </div>
                    </div>

                    {/* Row 2: Title */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Credential Title *
                        </label>
                        <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Bachelor of Computer Science (Honours)"
                                disabled={status === "submitting"}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 3: Grade & Expiry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                Grade / CGPA (Optional)
                            </label>
                            <div className="relative">
                                <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    placeholder="e.g. First Class / 3.89"
                                    disabled={status === "submitting"}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                Expiry Date (Optional)
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    disabled={status === "submitting"}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Description */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Credential Description *
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe the achievement, skills validated, or course scope..."
                                disabled={status === "submitting"}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* NEW: File Upload Section */}
                    <div className="pt-2 border-t border-slate-800 mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                                Supporting Documents
                            </label>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                                Single Issuance Feature
                            </span>
                        </div>
                        
                        {!selectedFile ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/50 hover:bg-slate-900 group"
                            >
                                <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors text-slate-400">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm text-slate-300 font-medium">Click to upload transcript or evidence</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formData.type === "Degree" ? "Required for Degree issuance" : "Optional for this credential type"}
                                </p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept=".pdf,.jpg,.png"
                                />
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                        <Paperclip size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                                        <p className="text-xs text-emerald-500/60">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === "submitting"}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {status === "submitting" ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Minting & Uploading to IPFS...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Sign & Issue Credential
                                </>
                            )}
                        </button>
                    </div>
                </form>
             </>
           )}
        </div>
      </div>
    </RequireAuth>
  );
}