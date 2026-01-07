"use client";

import RequireAuth from "@/lib/RequireAuth";
import { CREDENTIAL_TEMPLATES } from "@/lib/credentialTemplates";
import { FileBox, Lock, CheckCircle, Ban, FileText, Info } from "lucide-react";

export default function TemplatesPage() {
  return (
    <RequireAuth allowedRole="issuer">
      <div className="space-y-8">
        
        {/* Header */}
        <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <FileBox className="text-emerald-500" />
                Credential Templates
            </h2>
            
            {/* New Explainer Text */}
            <p className="text-slate-400 mt-2 max-w-3xl">
                Credential templates are institution-defined configurations that determine the structure and validity rules for issuance.
            </p>

            {/* New Governance Banner */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-200">
                    <strong>Governance Note:</strong> In this prototype, credential templates are represented as pre-configured institutional definitions. Issuers may view but not modify these templates. Template creation and editing are supported in the complete system. Templates are read-only in this prototype.
                </p>
            </div>
        </div>

        {/* Technical Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Template ID</th>
                            <th className="px-6 py-4">Title & Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Issuance Mode</th>
                            <th className="px-6 py-4">Certificate File</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {CREDENTIAL_TEMPLATES.map((template) => (
                            <tr key={template.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-emerald-400 text-xs">
                                    {template.id}
                                </td>
                                <td className="px-6 py-4 max-w-md">
                                    <p className="font-bold text-white mb-1">{template.title}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
                                        {template.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {/* Single Badge */}
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                                            template.issuanceMode === 'single' || template.issuanceMode === 'both'
                                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                : "bg-slate-800 border-slate-700 text-slate-600 opacity-50"
                                        }`}>
                                            Single
                                        </span>
                                        {/* Bulk Badge */}
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                                            template.issuanceMode === 'bulk' || template.issuanceMode === 'both'
                                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                                : "bg-slate-800 border-slate-700 text-slate-600 opacity-50"
                                        }`}>
                                            Bulk
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {template.requiresCertificate ? (
                                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                            <FileText size={14} /> Required
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                                            <Ban size={14} /> None
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </RequireAuth>
  );
}