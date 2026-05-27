"use client";

import { useState, useCallback, useEffect } from "react";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  CREDENTIAL_TEMPLATES,
  CredentialTemplate,
  TemplateField,
} from "@/lib/credentialTemplates";
import {
  fetchTemplates,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileBox,
  Plus,
  Pencil,
  Trash2,
  Lock,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Minus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  WifiOff,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<CredentialTemplate["type"], string> = {
  Degree: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  Award: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Certificate: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Status: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const FIELD_TYPE_COLORS: Record<TemplateField["type"], string> = {
  text: "bg-slate-700 text-slate-300",
  date: "bg-blue-500/15 text-blue-400",
  select: "bg-purple-500/15 text-purple-400",
  file: "bg-amber-500/15 text-amber-400",
  textarea: "bg-emerald-500/15 text-emerald-400",
};

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

function generateId(): string {
  return `TEMP-${Date.now().toString(36).toUpperCase()}`;
}

/* ------------------------------------------------------------------ */
/*  Blank template for the create form                                 */
/* ------------------------------------------------------------------ */

const BLANK_TEMPLATE: Omit<CredentialTemplate, "id"> = {
  title: "",
  type: "Degree",
  description: "",
  issuanceMode: "single",
  requiresCertificate: false,
  fields: [],
  isSystemDefault: false,
};

const BLANK_FIELD: TemplateField = {
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
};

// Stable key counter for field builder rows — never changes once assigned
let _fieldKeyCounter = 0;
function nextFieldKey(): number {
  return ++_fieldKeyCounter;
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function TableSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800 text-xs">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Issuance Mode</th>
              <th className="px-6 py-4">Certificate</th>
              <th className="px-6 py-4">Fields</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {[...Array(4)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-800 rounded" /></td>
                <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-800 rounded-full" /></td>
                <td className="px-6 py-4"><div className="flex gap-1.5"><div className="h-4 w-12 bg-slate-800 rounded" /><div className="h-4 w-10 bg-slate-800 rounded" /></div></td>
                <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-800 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-14 bg-slate-800 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-800 rounded ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast component                                                    */
/* ------------------------------------------------------------------ */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/40"
    >
      <Check size={18} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:text-emerald-200 transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete confirmation dialog                                         */
/* ------------------------------------------------------------------ */

function DeleteDialog({
  templateName,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  templateName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertTriangle className="text-red-400" size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Delete Template</h3>
            <p className="text-sm text-slate-400 mt-2">
              Are you sure you want to delete <strong className="text-white">{templateName}</strong>?
              This won&apos;t affect already-issued credentials.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit modal                                                */
/* ------------------------------------------------------------------ */

function TemplateModal({
  initial,
  isSaving,
  onSave,
  onClose,
}: {
  initial: CredentialTemplate | null; // null = create mode
  isSaving: boolean;
  onSave: (t: CredentialTemplate) => void;
  onClose: () => void;
}) {
  const isEdit = initial !== null;
  const [title, setTitle] = useState(initial?.title ?? BLANK_TEMPLATE.title);
  const [type, setType] = useState<CredentialTemplate["type"]>(initial?.type ?? BLANK_TEMPLATE.type);
  const [description, setDescription] = useState(initial?.description ?? BLANK_TEMPLATE.description);
  const [issuanceMode, setIssuanceMode] = useState<CredentialTemplate["issuanceMode"]>(
    initial?.issuanceMode ?? BLANK_TEMPLATE.issuanceMode
  );
  const [requiresCert, setRequiresCert] = useState(initial?.requiresCertificate ?? false);
  const [fields, setFields] = useState<TemplateField[]>(initial?.fields ?? []);

  // Stable keys so React doesn't remount rows when field.name changes
  const [fieldKeys, setFieldKeys] = useState<number[]>(() =>
    (initial?.fields ?? []).map(() => nextFieldKey())
  );

  /* ---- field builder helpers ---- */
  const addField = () => {
    setFields((f) => [...f, { ...BLANK_FIELD }]);
    setFieldKeys((k) => [...k, nextFieldKey()]);
  };

  const removeField = (idx: number) => {
    setFields((f) => f.filter((_, i) => i !== idx));
    setFieldKeys((k) => k.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, patch: Partial<TemplateField>) =>
    setFields((f) => f.map((fld, i) => (i === idx ? { ...fld, ...patch } : fld)));

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setFieldKeys((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleLabelChange = (idx: number, label: string) => {
    updateField(idx, { label, name: toCamelCase(label) });
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const template: CredentialTemplate = {
      id: initial?.id ?? generateId(),
      title: title.trim(),
      type,
      description: description.trim(),
      issuanceMode,
      requiresCertificate: requiresCert,
      fields,
      isSystemDefault: false,
    };
    onSave(template);
  };

  const isValid = title.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Template" : "Create Template"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bachelor of Information Technology"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
            />
          </div>

          {/* Type + Issuance Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CredentialTemplate["type"])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              >
                <option value="Degree">Degree</option>
                <option value="Award">Award</option>
                <option value="Certificate">Certificate</option>
                <option value="Status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Issuance Mode
              </label>
              <select
                value={issuanceMode}
                onChange={(e) =>
                  setIssuanceMode(e.target.value as CredentialTemplate["issuanceMode"])
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              >
                <option value="single">Single</option>
                <option value="bulk">Bulk</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this credential represents..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all resize-none"
            />
          </div>

          {/* Requires Certificate */}
          <button
            type="button"
            onClick={() => setRequiresCert(!requiresCert)}
            className="flex items-center gap-3 cursor-pointer group w-full text-left"
          >
            <div
              className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 shrink-0 ${
                requiresCert ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <motion.div
                layout
                className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"
                animate={{ x: requiresCert ? 14 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              Requires certificate file upload
            </span>
          </button>

          {/* ---- Fields builder ---- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-300">Template Fields</label>
              <span className="text-xs text-slate-500">{fields.length} field{fields.length !== 1 && "s"}</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {fields.map((field, idx) => (
                  <motion.div
                    key={fieldKeys[idx]}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3"
                  >
                    {/* Row 1: label, type, required, actions */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleLabelChange(idx, e.target.value)}
                          placeholder="Field label"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          name: <code className="text-slate-400">{field.name || "—"}</code>
                        </span>
                      </div>

                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(idx, {
                            type: e.target.value as TemplateField["type"],
                            ...(e.target.value !== "select" ? { options: undefined } : {}),
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all w-28 shrink-0"
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="file">File</option>
                        <option value="textarea">Textarea</option>
                      </select>

                      <label className="flex items-center gap-1.5 shrink-0 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(idx, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0"
                        />
                        <span className="text-xs text-slate-400">Required</span>
                      </label>
                    </div>

                    {/* Row 2: placeholder */}
                    <input
                      type="text"
                      value={field.placeholder ?? ""}
                      onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                      placeholder="Placeholder text (optional)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    />

                    {/* Row 3: options (only for select type) */}
                    {field.type === "select" && (
                      <input
                        type="text"
                        value={(field.options ?? []).join(", ")}
                        onChange={(e) =>
                          updateField(idx, {
                            options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Comma-separated options, e.g. Option A, Option B"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                      />
                    )}

                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => moveField(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveField(idx, 1)}
                        disabled={idx === fields.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removeField(idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Remove field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              onClick={addField}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-700 text-sm text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              <Plus size={16} />
              Add Field
            </button>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TemplatesPage() {
  const { walletAddress } = useAuth();

  const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CredentialTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CredentialTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- Fetch templates from API ---- */
  const loadTemplates = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setFetchError(null);
    setUsingFallback(false);

    const res = await fetchTemplates(walletAddress);
    if (res.success && Array.isArray(res.data)) {
      setTemplates(res.data);
    } else {
      // Fallback to local defaults
      setTemplates(
        CREDENTIAL_TEMPLATES.map((t) => ({ ...t, isSystemDefault: true }))
      );
      setUsingFallback(true);
      setFetchError(res.error || "Could not connect to server.");
    }
    setIsLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /* ---- handlers ---- */
  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const openEdit = (t: CredentialTemplate) => {
    setEditTarget(t);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (t: CredentialTemplate) => {
    if (!walletAddress) return;
    setIsSaving(true);

    // Strip frontend-only fields the backend doesn't expect
    const { id: _id, isSystemDefault: _sys, ...payload } = t;

    let apiOk = false;

    if (editTarget) {
      const res = await apiUpdateTemplate(walletAddress, t.id, payload);
      apiOk = !!res.success;
      showToast(apiOk ? "Template updated successfully" : "Failed to update — changes saved locally");
    } else {
      const res = await apiCreateTemplate(walletAddress, payload);
      apiOk = !!res.success;
      showToast(apiOk ? "Template created successfully" : "Failed to save to server — saved locally");
    }

    setIsSaving(false);
    closeModal();

    if (apiOk) {
      // Refresh from server to get the canonical state
      await loadTemplates();
    } else {
      // API failed — persist optimistically in local state so the user
      // doesn't lose their work when loadTemplates overwrites
      if (editTarget) {
        setTemplates((prev) => prev.map((p) => (p.id === t.id ? t : p)));
      } else {
        setTemplates((prev) => [...prev, t]);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !walletAddress) return;
    setIsDeleting(true);

    const res = await apiDeleteTemplate(walletAddress, deleteTarget.id);
    const apiOk = !!res.success;
    showToast(apiOk ? "Template deleted" : "Failed to delete from server — removed locally");

    setIsDeleting(false);
    setDeleteTarget(null);

    if (apiOk) {
      await loadTemplates();
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    }
  };

  return (
    <RequireAuth allowedRole="issuer">
      <div className="space-y-8">
        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileBox className="text-emerald-500" />
              Credential Templates
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Templates define the structure and field schema for each credential type your
              institution issues. System defaults are locked — create your own to customise.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>

        {/* ---- Fallback warning banner ---- */}
        {usingFallback && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <WifiOff size={18} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200 flex-1">
              Could not connect to server. Showing local defaults.
            </p>
            <button
              onClick={loadTemplates}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ---- Fetch error (non-fallback, e.g. no wallet) ---- */}
        {fetchError && !usingFallback && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{fetchError}</p>
            <button
              onClick={loadTemplates}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {isLoading && <TableSkeleton />}

        {/* ---- Table ---- */}
        {!isLoading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800 text-xs">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Issuance Mode</th>
                    <th className="px-6 py-4">Certificate</th>
                    <th className="px-6 py-4">Fields</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {templates.map((template) => {
                    const isDefault = !!template.isSystemDefault;
                    return (
                      <tr
                        key={template.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Title */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{template.title}</span>
                            {isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500 uppercase font-semibold shrink-0">
                                Default
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TYPE_COLORS[template.type]}`}
                          >
                            {template.type}
                          </span>
                        </td>

                        {/* Issuance Mode */}
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                                template.issuanceMode === "single" ||
                                template.issuanceMode === "both"
                                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                  : "bg-slate-800 border-slate-700 text-slate-600 opacity-50"
                              }`}
                            >
                              Single
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                                template.issuanceMode === "bulk" ||
                                template.issuanceMode === "both"
                                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                  : "bg-slate-800 border-slate-700 text-slate-600 opacity-50"
                              }`}
                            >
                              Bulk
                            </span>
                          </div>
                        </td>

                        {/* Certificate Required */}
                        <td className="px-6 py-4">
                          {template.requiresCertificate ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : (
                            <Minus size={16} className="text-slate-600" />
                          )}
                        </td>

                        {/* Fields count */}
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {template.fields.length} field{template.fields.length !== 1 && "s"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isDefault ? (
                              <span
                                className="flex items-center gap-1.5 text-xs text-slate-500"
                                title="System default — cannot be modified"
                              >
                                <Lock size={14} />
                                System default
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEdit(template)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                  title="Edit template"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(template)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Delete template"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                        No templates yet. Click &quot;Create Template&quot; to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- Modals & overlays ---- */}
        <AnimatePresence>
          {modalOpen && (
            <TemplateModal
              key="template-modal"
              initial={editTarget}
              isSaving={isSaving}
              onSave={handleSave}
              onClose={closeModal}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteTarget && (
            <DeleteDialog
              key="delete-dialog"
              templateName={deleteTarget.title}
              isDeleting={isDeleting}
              onConfirm={handleDelete}
              onCancel={() => setDeleteTarget(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && <Toast key="toast" message={toast} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </div>
    </RequireAuth>
  );
}
