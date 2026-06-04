"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import RequireAuth from "@/lib/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  ChevronRight,
  Award,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Database,
  FileText,
  Asterisk,
  Upload,
  Download,
  WifiOff,
  RefreshCw,
  Server,
  AlertCircle,
  ExternalLink,
  XCircle,
  Paperclip,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import { CREDENTIAL_TEMPLATES, CredentialTemplate } from "@/lib/credentialTemplates";
import { fetchTemplates } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ANCHOR_ADDRESS = process.env.NEXT_PUBLIC_CREDENTIAL_ANCHOR_ADDRESS!;
const ANCHOR_ABI = [
  "function batchAnchorCredentials(string[] memory refIds, bytes32[] memory dataHashes) external",
];

interface Connection {
  id: string;
  system_name: string;
  endpoint_url: string;
  status: string;
  connected_at: string;
}

interface ExternalStudent {
  id: string;
  name: string;
  student_id: string;
  programme: string;
  faculty: string;
  gpa: string;
  status: string;
  enrollment_year: number;
  expected_graduation: string;
  has_certificate: boolean;
  certificate_filename: string | null;
  wallet_address: string;
}

interface BuiltCredential {
  refId: string;
  student: ExternalStudent;
  credentialData: Record<string, any>;
  dataHash: string;
  ipfsCid: string | null;
  metadataCid: string;
}

interface IssuedCredential {
  refId: string;
  studentName: string;
  studentId: string;
  studentWallet: string;
  txHash: string;
  ipfsCid: string | null;
  metadataCid: string;
}

type Step = "source" | "template" | "participants" | "upload" | "csvParticipants" | "review" | "processing" | "success" | "error";

const TYPE_BADGE: Record<CredentialTemplate["type"], string> = {
  Degree: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  Award: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Certificate: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Status: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "text",
  date: "date",
  select: "select",
  file: "file",
  textarea: "textarea",
};

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateId(id: string): string {
  if (!id || id.length < 12) return id || "—";
  return `${id.slice(0, 8)}...`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BulkIssuePage() {
  const router = useRouter();
  const { walletAddress } = useAuth();

  // ── External system connections ─────────────────────────────────
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  // ── External students ───────────────────────────────────────────
  const [externalStudents, setExternalStudents] = useState<ExternalStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // ── Wizard state ────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("source");
  const [dataSource, setDataSource] = useState<"external" | "csv" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CredentialTemplate | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [participantError, setParticipantError] = useState<string | null>(null);

  // ── CSV state ───────────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvColumnMap, setCsvColumnMap] = useState<Record<string, string>>({});
  const [csvErrors, setCsvErrors] = useState<{ row: number; field: string; message: string }[]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvErrorsExpanded, setCsvErrorsExpanded] = useState(false);

  // ── Certificate files for CSV bulk ─────────────────────────────
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [certFileMap, setCertFileMap] = useState<Record<string, File>>({});

  // ── Processing state ────────────────────────────────────────────
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [processingPhase, setProcessingPhase] = useState(0); // 0-5

  // ── Results ─────────────────────────────────────────────────────
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [batchTxHash, setBatchTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorPhase, setErrorPhase] = useState("");

  // ── Template list ───────────────────────────────────────────────
  const [allTemplates, setAllTemplates] = useState<CredentialTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const apiHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-wallet-address": walletAddress || "",
  }), [walletAddress]);

  // ── Load connections ────────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    if (!walletAddress) return;
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await fetch(`${API_URL}/api/external-system/connections`, { headers: apiHeaders() });
      if (!res.ok) throw new Error("Failed to load connections");
      const data = await res.json();
      const conns: Connection[] = data.connections || [];
      setConnections(conns);
    } catch (err) {
      console.error("Failed to load connections:", err);
      setConnectionsError("Could not load external system connections.");
    } finally {
      setConnectionsLoading(false);
    }
  }, [walletAddress, apiHeaders]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // ── Load templates ──────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    if (!walletAddress) return;
    setTemplatesLoading(true);
    setUsingFallback(false);
    const res = await fetchTemplates(walletAddress);
    if (res.success && Array.isArray(res.data)) {
      setAllTemplates(res.data);
    } else {
      setAllTemplates(CREDENTIAL_TEMPLATES.map((t) => ({ ...t, isSystemDefault: true })));
      setUsingFallback(true);
    }
    setTemplatesLoading(false);
  }, [walletAddress]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const bulkTemplates = allTemplates.filter(
    (t) => t.issuanceMode === "bulk" || t.issuanceMode === "both"
  );

  // ── Fetch students ──────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!selectedConnection) return;
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/external-system/connections/${selectedConnection.id}/students`,
        { headers: apiHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setExternalStudents(data.students || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudentsError("Could not load student data from this system.");
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedConnection, apiHeaders]);

  // ── CSV helpers ─────────────────────────────────────────────────
  const downloadCsvTemplate = async () => {
    if (!selectedTemplate || !walletAddress) return;
    try {
      const res = await fetch(`${API_URL}/api/templates/${selectedTemplate.id}/csv-template`, {
        headers: { "x-wallet-address": walletAddress },
      });
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate.title.replace(/[^a-zA-Z0-9]/g, "_")}_bulk_template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV template download failed:", err);
    }
  };

  const validateCsvData = (data: Record<string, string>[], columnMap: Record<string, string>) => {
    if (!selectedTemplate) return [];
    const errors: { row: number; field: string; message: string }[] = [];
    const walletHeader = columnMap["wallet_address"];

    data.forEach((row, idx) => {
      const rowNum = idx + 2;
      const walletVal = walletHeader ? row[walletHeader]?.trim() : "";
      if (!walletVal) {
        errors.push({ row: rowNum, field: "wallet_address", message: "Missing wallet address" });
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(walletVal)) {
        errors.push({ row: rowNum, field: "wallet_address", message: "Invalid Ethereum address" });
      }

      for (const field of selectedTemplate.fields) {
        if (field.type === "file" || !field.required) continue;
        const csvHeader = columnMap[field.name];
        if (!csvHeader) continue;
        const val = row[csvHeader]?.trim();
        if (!val) {
          errors.push({ row: rowNum, field: field.label, message: "Missing required field" });
        }
      }
    });

    const wallets = data.map((r) => walletHeader ? r[walletHeader]?.trim().toLowerCase() : "").filter(Boolean);
    const seen = new Set<string>();
    wallets.forEach((w, i) => {
      if (seen.has(w)) {
        errors.push({ row: i + 2, field: "wallet_address", message: "Duplicate wallet address" });
      }
      seen.add(w);
    });

    return errors;
  };

  const parseCsvFile = (file: File) => {
    setCsvFile(file);
    setCsvParsing(true);
    setCsvErrors([]);
    setCsvData([]);
    setCsvErrorsExpanded(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);

        const autoMap: Record<string, string> = {};
        if (!selectedTemplate) { setCsvParsing(false); return; }

        const walletHeader = headers.find(
          (h) => h.toLowerCase().replace(/[\s_-]/g, "") === "walletaddress"
        );
        if (walletHeader) autoMap["wallet_address"] = walletHeader;

        // Auto-map certificate column if template requires it
        if (selectedTemplate.requiresCertificate) {
          const certHeader = headers.find(
            (h) => h.toLowerCase().replace(/[\s_-]/g, "") === "certificate"
          );
          if (certHeader) autoMap["certificate"] = certHeader;
        }

        for (const field of selectedTemplate.fields) {
          if (field.type === "file") continue;
          const match = headers.find(
            (h) => h.toLowerCase().replace(/[\s_-]/g, "") === field.name.toLowerCase()
          ) || headers.find(
            (h) => h.toLowerCase().replace(/[\s_-]/g, "") === field.label.toLowerCase().replace(/[\s_-]/g, "")
          );
          if (match) autoMap[field.name] = match;
        }

        setCsvColumnMap(autoMap);

        const data = results.data as Record<string, string>[];
        const errors = validateCsvData(data, autoMap);

        setCsvData(data);
        setCsvErrors(errors);
        setCsvParsing(false);
      },
      error: (err) => {
        setCsvErrors([{ row: 0, field: "file", message: `Parse error: ${err.message}` }]);
        setCsvParsing(false);
      },
    });
  };

  // ── Certificate file matching ───────────────────────────────────
  const matchCertificateFiles = useCallback(() => {
    if (!selectedTemplate?.requiresCertificate || certFiles.length === 0 || csvData.length === 0) {
      setCertFileMap({});
      return;
    }
    const certHeader = csvColumnMap["certificate"];
    if (!certHeader) { setCertFileMap({}); return; }

    const newMap: Record<string, File> = {};
    csvData.forEach((row, idx) => {
      const expectedFilename = row[certHeader]?.trim();
      if (!expectedFilename) return;
      const matchedFile = certFiles.find(f =>
        f.name === expectedFilename ||
        f.name.toLowerCase() === expectedFilename.toLowerCase() ||
        f.name.replace(/\.pdf$/i, "").toLowerCase() === expectedFilename.replace(/\.pdf$/i, "").toLowerCase()
      );
      if (matchedFile) newMap[String(idx)] = matchedFile;
    });
    setCertFileMap(newMap);
  }, [certFiles, csvData, csvColumnMap, selectedTemplate]);

  useEffect(() => { matchCertificateFiles(); }, [matchCertificateFiles]);

  const goToParticipants = () => {
    setStep("participants");
    setSelectedStudentIds([]);
    setParticipantError(null);
    fetchStudents();
  };

  // ── Selection logic ─────────────────────────────────────────────
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setParticipantError(null);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === externalStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(externalStudents.map((s) => s.id));
    }
    setParticipantError(null);
  };

  // ── CSV participants (derived) ───────────────────────────────────
  const csvParticipants = useMemo((): (ExternalStudent & { _csvRow: Record<string, string>; _csvRowIndex: number })[] => {
    if (dataSource !== "csv" || csvData.length === 0 || !selectedTemplate) return [];
    const certHeader = csvColumnMap["certificate"];
    return csvData.map((row, idx) => {
      const walletHeader = csvColumnMap["wallet_address"];
      const wallet = walletHeader ? row[walletHeader]?.trim() : "";

      const studentIdField = selectedTemplate.fields.find(f => f.name === "studentId");
      const studentIdHeader = studentIdField ? csvColumnMap[studentIdField.name] : null;
      const studentId = studentIdHeader ? row[studentIdHeader]?.trim() : `CSV-${String(idx + 1).padStart(3, "0")}`;

      const nameField = selectedTemplate.fields.find(f => f.name === "recipientName" || f.name === "holderName" || f.name === "name" || f.name === "studentName");
      const nameHeader = nameField ? csvColumnMap[nameField.name] : null;
      const name = nameHeader ? row[nameHeader]?.trim() : `Recipient ${idx + 1}`;

      const progField = selectedTemplate.fields.find(f => f.name === "programme" || f.name === "program");
      const progHeader = progField ? csvColumnMap[progField.name] : null;
      const programme = progHeader ? row[progHeader]?.trim() : "";

      const hasCert = certFileMap[String(idx)] !== undefined;

      return {
        id: `csv-${idx}`,
        name,
        student_id: studentId,
        programme,
        faculty: "",
        gpa: "",
        status: "active",
        enrollment_year: new Date().getFullYear(),
        expected_graduation: "",
        has_certificate: hasCert,
        certificate_filename: hasCert ? certFileMap[String(idx)].name : (certHeader ? row[certHeader]?.trim() || null : null),
        wallet_address: wallet,
        _csvRow: row,
        _csvRowIndex: idx,
      };
    });
  }, [csvData, csvColumnMap, selectedTemplate, dataSource, certFileMap]);

  const csvErrorRowIndices = useMemo(() => {
    return new Set(csvErrors.filter(e => e.row > 0).map(e => e.row - 2));
  }, [csvErrors]);

  const activeParticipants = dataSource === "csv" ? csvParticipants : externalStudents;
  const selectedStudentObjects = activeParticipants.filter((s) => selectedStudentIds.includes(s.id));
  const studentsWithoutWallet = selectedStudentObjects.filter((s) => !s.wallet_address);
  const studentsWithCert = selectedStudentObjects.filter((s) => s.has_certificate);
  const studentsWithoutCert = selectedStudentObjects.filter((s) => !s.has_certificate);

  // Validate before proceeding to review
  const goToReview = () => {
    if (studentsWithoutWallet.length > 0) {
      setParticipantError(
        `${studentsWithoutWallet.length} student${studentsWithoutWallet.length !== 1 ? "s are" : " is"} missing wallet addresses and cannot receive credentials.`
      );
      return;
    }
    setParticipantError(null);
    setStep("review");
  };

  // ── PROCESSING PIPELINE ─────────────────────────────────────────
  const handleConfirmAndIssue = async () => {
    if (!selectedTemplate || !walletAddress) return;
    if (dataSource === "external" && !selectedConnection) return;

    setStep("processing");
    setError(null);
    setErrorPhase("");

    const students = selectedStudentObjects;
    const certCids: Record<string, string> = {};
    const built: BuiltCredential[] = [];

    try {
      // ── Phase 1: Upload certificates to IPFS ──────────────────────
      if (dataSource === "csv" && selectedTemplate.requiresCertificate) {
        const studentsWithCerts = students.filter((s) => {
          const csvIdx = (s as any)._csvRowIndex;
          return certFileMap[String(csvIdx)] !== undefined;
        });

        if (studentsWithCerts.length > 0) {
          setProcessingPhase(1);
          setProcessingStatus("Uploading certificates to IPFS...");
          setProcessingProgress({ current: 0, total: studentsWithCerts.length });

          for (let i = 0; i < studentsWithCerts.length; i++) {
            const student = studentsWithCerts[i];
            const csvIdx = (student as any)._csvRowIndex;
            const certFile = certFileMap[String(csvIdx)];

            setProcessingProgress({ current: i + 1, total: studentsWithCerts.length });

            try {
              const formData = new FormData();
              formData.append("file", certFile);
              const uploadRes = await fetch(`${API_URL}/api/ipfs/upload`, {
                method: "POST",
                headers: { "x-wallet-address": walletAddress },
                body: formData,
              });
              if (!uploadRes.ok) throw new Error("IPFS upload failed");
              const { cid } = await uploadRes.json();
              certCids[student.id] = cid;
            } catch (err) {
              console.error(`Failed to upload certificate for CSV row ${csvIdx}:`, err);
            }
          }
        }
      }

      if (dataSource === "external" && selectedTemplate.requiresCertificate && selectedConnection) {
        const studentsNeedingCert = students.filter((s) => s.has_certificate);
        setProcessingPhase(1);
        setProcessingStatus("Uploading certificates to IPFS...");
        setProcessingProgress({ current: 0, total: studentsNeedingCert.length });

        for (let i = 0; i < studentsNeedingCert.length; i++) {
          const student = studentsNeedingCert[i];
          setProcessingProgress({ current: i + 1, total: studentsNeedingCert.length });

          try {
            const certRes = await fetch(
              `${API_URL}/api/external-system/connections/${selectedConnection.id}/students/${student.id}/certificate`,
              { headers: { "x-wallet-address": walletAddress } }
            );
            if (!certRes.ok) throw new Error("Cert fetch failed");

            const blob = await certRes.blob();
            const file = new File(
              [blob],
              student.certificate_filename || `certificate-${student.student_id}.pdf`,
              { type: "application/pdf" }
            );

            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch(`${API_URL}/api/ipfs/upload`, {
              method: "POST",
              headers: { "x-wallet-address": walletAddress },
              body: formData,
            });
            if (!uploadRes.ok) throw new Error("IPFS upload failed");
            const { cid } = await uploadRes.json();
            certCids[student.id] = cid;
          } catch (err) {
            console.error(`Failed to upload certificate for ${student.student_id}:`, err);
          }
        }
      }

      // ── Phase 2: Build credential data + compute hashes ─────────
      setProcessingPhase(2);
      setProcessingStatus("Building credential data and computing hashes...");
      setProcessingProgress({ current: 0, total: students.length });

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const refId = crypto.randomUUID();

        let fields: Record<string, any>;
        if (dataSource === "csv") {
          fields = {};
          const csvRow = (student as any)._csvRow as Record<string, string> | undefined;
          for (const field of selectedTemplate.fields) {
            if (field.type === "file") continue;
            const csvHeader = csvColumnMap[field.name];
            fields[field.name] = csvHeader && csvRow ? csvRow[csvHeader]?.trim() || "" : "";
          }
        } else {
          fields = {
            studentId: student.student_id,
            studentName: student.name,
            programme: student.programme,
            gpa: student.gpa,
          };
        }

        const credentialData = {
          refId,
          templateId: selectedTemplate.id,
          issuerWallet: walletAddress.toLowerCase(),
          studentWallet: student.wallet_address.toLowerCase(),
          title: selectedTemplate.title,
          type: selectedTemplate.type,
          fields,
          ipfsCid: certCids[student.id] || null,
          issuedAt: new Date().toISOString(),
        };

        const dataHash = ethers.keccak256(
          ethers.toUtf8Bytes(JSON.stringify(credentialData))
        );

        built.push({
          refId,
          student,
          credentialData,
          dataHash,
          ipfsCid: certCids[student.id] || null,
          metadataCid: "",
        });

        setProcessingProgress({ current: i + 1, total: students.length });
      }

      // ── Phase 3: Upload metadata to IPFS ────────────────────────
      setProcessingPhase(3);
      setProcessingStatus("Uploading metadata to IPFS...");
      setProcessingProgress({ current: 0, total: built.length });

      for (let i = 0; i < built.length; i++) {
        const metadataRes = await fetch(`${API_URL}/api/ipfs/upload-metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": walletAddress,
          },
          body: JSON.stringify(built[i].credentialData),
        });
        if (!metadataRes.ok) throw new Error(`Failed to upload metadata for credential ${i + 1}`);
        const { cid } = await metadataRes.json();
        built[i].metadataCid = cid;

        setProcessingProgress({ current: i + 1, total: built.length });
      }

      // ── Phase 4: Batch anchor on-chain ──────────────────────────
      setProcessingPhase(4);
      setProcessingStatus("Awaiting MetaMask — sign ONE transaction for all credentials...");
      setProcessingProgress({ current: 0, total: 1 });

      if (!window.ethereum) {
        throw Object.assign(new Error("MetaMask not detected. Please install MetaMask to continue."), { phase: "blockchain" });
      }

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ANCHOR_ADDRESS, ANCHOR_ABI, signer);

      const refIds = built.map((b) => b.refId);
      const dataHashes = built.map((b) => b.dataHash);

      const tx = await contract.batchAnchorCredentials(refIds, dataHashes);
      const receipt = await tx.wait();
      const txHash = receipt.hash;
      setBatchTxHash(txHash);

      setProcessingProgress({ current: 1, total: 1 });

      // ── Phase 5: Save to Supabase ───────────────────────────────
      setProcessingPhase(5);
      setProcessingStatus("Saving credentials to database...");
      setProcessingProgress({ current: 0, total: 1 });

      const credentials = built.map((b) => ({
        ref_id: b.refId,
        template_id: selectedTemplate.id,
        title: selectedTemplate.title,
        type: selectedTemplate.type,
        holder_wallet: b.student.wallet_address.toLowerCase(),
        ipfs_cid: b.ipfsCid || null,
        metadata_cid: b.metadataCid,
        tx_hash: txHash,
        data_hash: b.dataHash,
      }));

      const saveRes = await fetch(`${API_URL}/api/credentials/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({ credentials }),
      });

      if (!saveRes.ok) {
        throw Object.assign(
          new Error(
            `Credentials were anchored on-chain but failed to save to database. Transaction hash: ${txHash}. Please contact admin.`
          ),
          { phase: "database", critical: true }
        );
      }

      setProcessingProgress({ current: 1, total: 1 });

      // ── Done — build result list ────────────────────────────────
      setIssuedCredentials(
        built.map((b) => ({
          refId: b.refId,
          studentName: b.student.name,
          studentId: b.student.student_id,
          studentWallet: b.student.wallet_address,
          txHash,
          ipfsCid: b.ipfsCid,
          metadataCid: b.metadataCid,
        }))
      );
      setStep("success");

    } catch (err: any) {
      console.error("Bulk issuance failed:", err);
      const phase = err?.phase || (
        processingPhase === 1 ? "certificate upload" :
        processingPhase === 2 ? "data preparation" :
        processingPhase === 3 ? "metadata upload" :
        processingPhase === 4 ? "blockchain" :
        processingPhase === 5 ? "database" : "unknown"
      );

      const msg = err?.code === "ACTION_REJECTED"
        ? "MetaMask transaction was rejected."
        : err.message || "An unexpected error occurred during batch issuance.";

      setErrorPhase(phase);
      setError(msg);
      setStep("error");
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const stepList: Step[] =
    dataSource === "external"
      ? ["source", "template", "participants", "review"]
      : dataSource === "csv"
        ? ["source", "template", "upload", "csvParticipants", "review"]
        : ["source", "template", "review"];
  const stepLabels: Record<string, string> = {
    source: "Source",
    template: "Template",
    participants: "Participants",
    upload: "Upload CSV",
    csvParticipants: "Participants",
    review: "Review",
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  const progressPercent = processingProgress.total > 0
    ? Math.round((processingProgress.current / processingProgress.total) * 100)
    : 0;

  const totalPhases = 5;
  const overallProgress = Math.round(((processingPhase - 1) / totalPhases) * 100 + (progressPercent / totalPhases));

  return (
    <RequireAuth allowedRole="issuer">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/issuer/issue")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            Back to Single Issue
          </button>
          <div className="flex items-center gap-2 text-green-600 font-heading font-extrabold text-lg">
            <Users size={20} strokeWidth={2.5} /> Bulk Issuance Wizard
          </div>
        </div>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3 font-medium">
            <Loader2 size={20} className="animate-spin" strokeWidth={2.5} /> Loading connections...
          </div>
        ) : connectionsError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle size={36} className="mx-auto mb-3 text-red-600 opacity-60" strokeWidth={2.5} />
            <p className="text-red-600 mb-4 font-medium">{connectionsError}</p>
            <button onClick={loadConnections} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 shadow-sm transition-colors text-sm inline-flex items-center gap-2">
              <RefreshCw size={14} strokeWidth={2.5} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bar (wizard steps — not during processing/success/error) */}
            {!["processing", "success", "error"].includes(step) && (
              <div className="flex items-start justify-between mb-8 px-4 relative">
                <div className="absolute top-4 left-8 right-8 h-1 bg-slate-200 -z-10 -translate-y-1/2" />
                {stepList.map((s, idx) => {
                  const currentIdx = stepList.indexOf(step as any);
                  const isActive = step === s;
                  const isPast = currentIdx > idx;
                  return (
                    <div key={s} className={`flex flex-col items-center gap-2 ${isActive || isPast ? "text-green-700" : "text-slate-400"}`}>
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isActive || isPast ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-slate-300 text-slate-500"
                      }`}>
                        {isPast ? <CheckCircle size={14} strokeWidth={2.5} /> : idx + 1}
                      </div>
                      <span className="text-xs uppercase font-bold bg-[#F8F8F8] px-1">{stepLabels[s]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MAIN CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative min-h-[400px]">

              {/* ────── SOURCE STEP ────── */}
              {step === "source" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2">Choose Source</h2>
                  <p className="text-slate-600 text-sm mb-6 font-medium">How would you like to provide recipient data?</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* External System card */}
                    <div
                      onClick={() => {
                        if (connections.length === 0) return;
                        if (dataSource !== "external") {
                          setCsvFile(null); setCsvData([]); setCsvHeaders([]); setCsvColumnMap({}); setCsvErrors([]);
                          setCertFiles([]); setCertFileMap({});
                          setSelectedStudentIds([]);
                        }
                        setDataSource("external");
                        if (connections.length === 1) setSelectedConnection(connections[0]);
                      }}
                      className={`bg-white border rounded-2xl p-6 transition-all shadow-sm ${
                        connections.length === 0
                          ? "border-slate-200 opacity-50 cursor-not-allowed"
                          : dataSource === "external"
                            ? "border-green-500 bg-green-50 cursor-pointer"
                            : "border-slate-200 cursor-pointer hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${dataSource === "external" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          <Server size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-900 font-bold text-lg">External System</h3>
                          <p className="text-slate-500 text-sm mt-1 font-medium">Pull recipients from a connected institutional system (SIS)</p>
                          {connections.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                              <CheckCircle size={12} strokeWidth={2.5} /> Connected ({connections.length})
                            </span>
                          ) : (
                            <div className="mt-3">
                              <span className="text-slate-400 text-xs font-bold">No systems connected</span>
                              <a href="/issuer/external-systems" className="ml-2 text-xs text-blue-600 hover:underline font-bold">Connect one →</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CSV Upload card */}
                    <div
                      onClick={() => {
                        if (dataSource !== "csv") {
                          setExternalStudents([]); setSelectedConnection(null);
                          setSelectedStudentIds([]);
                        }
                        setDataSource("csv");
                      }}
                      className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all shadow-sm ${
                        dataSource === "csv"
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${dataSource === "csv" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          <Upload size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-900 font-bold text-lg">CSV / Spreadsheet Upload</h3>
                          <p className="text-slate-500 text-sm mt-1 font-medium">Upload a CSV file with recipient details and wallet addresses</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection picker (shown when external selected and multiple connections) */}
                  {dataSource === "external" && connections.length > 1 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                      <h3 className="text-sm font-bold text-slate-700 mb-3">Select Connection</h3>
                      <div className="grid gap-3">
                        {connections.map((conn) => {
                          const isSelected = selectedConnection?.id === conn.id;
                          return (
                            <div key={conn.id} onClick={() => setSelectedConnection(conn)} className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${isSelected ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-green-500" : "border-slate-300"}`}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-slate-900 font-bold">{conn.system_name}</h3>
                                  <p className="text-slate-500 text-xs font-mono mt-0.5 break-all font-medium">{conn.endpoint_url}</p>
                                  <p className="text-slate-400 text-xs mt-0.5 font-bold">Connected {formatDate(conn.connected_at)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => {
                        if (dataSource === "external" && connections.length > 1 && !selectedConnection) return;
                        setStep("template");
                      }}
                      disabled={!dataSource || (dataSource === "external" && connections.length > 1 && !selectedConnection)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
                    >
                      Next <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── TEMPLATE STEP ────── */}
              {step === "template" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2">Select Credential Template</h2>

                  {selectedConnection && (
                    <div className="flex items-center gap-2 mb-6 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit font-medium">
                      <Database size={13} className="text-blue-600" />
                      Source: <span className="text-slate-900 font-bold">{selectedConnection.system_name}</span>
                    </div>
                  )}

                  {usingFallback && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 shadow-sm">
                      <WifiOff size={16} className="text-yellow-600 shrink-0" strokeWidth={2.5} />
                      <p className="text-xs text-yellow-700 flex-1 font-bold">Could not connect to server. Showing local defaults.</p>
                      <button onClick={loadTemplates} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-yellow-700 bg-white hover:bg-yellow-50 rounded-lg border border-yellow-200 transition-colors shadow-sm">
                        <RefreshCw size={12} strokeWidth={2.5} /> Retry
                      </button>
                    </div>
                  )}

                  {templatesLoading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-slate-500 font-medium">
                      <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                      <span className="text-sm">Loading templates...</span>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bulkTemplates.map((t) => {
                        const isSelected = selectedTemplate?.id === t.id;
                        return (
                          <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer shadow-sm ${isSelected ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${isSelected ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                                <Award size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-slate-900 font-bold text-lg">{t.title}</h3>
                                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${TYPE_BADGE[t.type]}`}>{t.type}</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5 font-medium">{t.description}</p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="text-green-600 shrink-0" size={24} strokeWidth={2.5} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedTemplate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-500" strokeWidth={2.5} />
                        <h4 className="text-sm font-bold text-slate-900">Template Field Schema</h4>
                        <span className="ml-auto text-xs text-slate-500 font-medium">{selectedTemplate.fields.length} field{selectedTemplate.fields.length !== 1 && "s"}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3 font-medium">Each recipient record from the external system must supply values for these fields:</p>
                      <div className="space-y-2">
                        {selectedTemplate.fields.map((f) => (
                          <div key={f.name} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                            <span className="text-slate-900 font-bold flex-1 min-w-0 truncate">{f.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 uppercase font-bold shrink-0">{FIELD_TYPE_LABEL[f.type]}</span>
                            {f.required && <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-bold shrink-0"><Asterisk size={10} /> required</span>}
                          </div>
                        ))}
                      </div>
                      {selectedTemplate.requiresCertificate && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-yellow-700 font-bold bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                          <Upload size={14} className="shrink-0" strokeWidth={2.5} />
                          This template requires a certificate file upload per recipient.
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("source")} className="text-slate-500 hover:text-slate-900 transition-colors font-bold">Back</button>
                    <button
                      onClick={() => {
                        if (dataSource === "external") goToParticipants();
                        else if (dataSource === "csv") setStep("upload");
                      }}
                      disabled={!selectedTemplate}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
                    >
                      Next Step <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── PARTICIPANTS STEP ────── */}
              {step === "participants" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-heading font-extrabold text-slate-900">Select Recipients</h2>
                    {!studentsLoading && !studentsError && externalStudents.length > 0 && (
                      <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline font-bold">
                        {selectedStudentIds.length === externalStudents.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-center gap-2 mb-4 shadow-sm">
                    <ShieldCheck size={16} className="text-purple-600 shrink-0" strokeWidth={2.5} />
                    <p className="text-xs text-purple-700 font-medium">
                      <strong>Data Governance:</strong> Recipients are retrieved from connected institutional systems. This data is authoritative.
                    </p>
                  </div>

                  {participantError && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-bold shadow-sm">
                      <AlertCircle size={14} className="shrink-0" strokeWidth={2.5} /> {participantError}
                    </div>
                  )}

                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500 gap-3 font-medium">
                      <Loader2 size={18} className="animate-spin" strokeWidth={2.5} /> <span className="text-sm">Fetching student records...</span>
                    </div>
                  ) : studentsError ? (
                    <div className="p-6 text-center">
                      <AlertCircle size={32} className="mx-auto mb-3 text-red-600 opacity-60" strokeWidth={2.5} />
                      <p className="text-red-600 text-sm mb-4 font-bold">{studentsError}</p>
                      <button onClick={fetchStudents} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 shadow-sm transition-colors text-sm inline-flex items-center gap-2">
                        <RefreshCw size={14} strokeWidth={2.5} /> Retry
                      </button>
                    </div>
                  ) : externalStudents.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 font-medium">
                      <Users size={36} className="mx-auto mb-3 opacity-30" strokeWidth={2.5} />
                      <p>No student records found in this system.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                              <th className="px-3 py-3 w-10"></th>
                              <th className="px-3 py-3">Student ID</th>
                              <th className="px-3 py-3">Name</th>
                              <th className="px-3 py-3">Programme</th>
                              <th className="px-3 py-3">CGPA</th>
                              <th className="px-3 py-3">Wallet</th>
                              <th className="px-3 py-3">Certificate</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-600 divide-y divide-slate-200">
                            {externalStudents.map((s) => (
                              <tr key={s.id} onClick={() => toggleStudent(s.id)} className={`cursor-pointer transition-colors ${selectedStudentIds.includes(s.id) ? "bg-green-50" : "hover:bg-slate-50"}`}>
                                <td className="px-3 py-3">
                                  <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded border-slate-300 bg-white text-green-600 focus:ring-green-600" />
                                </td>
                                <td className="px-3 py-3 font-mono text-xs text-blue-600 font-bold">{s.student_id}</td>
                                <td className="px-3 py-3 font-bold text-slate-900 text-sm">{s.name}</td>
                                <td className="px-3 py-3 text-xs font-medium">{s.programme}</td>
                                <td className="px-3 py-3 text-xs font-medium">{s.gpa || "—"}</td>
                                <td className="px-3 py-3 font-mono text-xs">
                                  {s.wallet_address ? (
                                    <span className="text-slate-600">{truncateAddress(s.wallet_address)}</span>
                                  ) : (
                                    <span className="text-red-600 font-bold">Missing</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  {s.has_certificate ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">Available</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-bold">
                        {externalStudents.length} records from {selectedConnection?.system_name} · {selectedStudentIds.length} selected
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("template")} className="text-slate-500 hover:text-slate-900 transition-colors font-bold">Back</button>
                    <button onClick={goToReview} disabled={selectedStudentIds.length === 0} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      Review Batch ({selectedStudentIds.length}) <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── UPLOAD STEP ────── */}
              {step === "upload" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-heading font-extrabold text-slate-900">Upload CSV</h2>
                      <p className="text-slate-600 text-sm mt-1 font-medium">Upload a spreadsheet containing recipient details for bulk issuance</p>
                    </div>
                    <button
                      onClick={downloadCsvTemplate}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
                    >
                      <Download size={16} strokeWidth={2.5} /> Download CSV Template
                    </button>
                  </div>

                  {csvParsing ? (
                    <div className="flex items-center justify-center py-16 text-slate-500 gap-3 font-medium">
                      <Loader2 size={18} className="animate-spin" strokeWidth={2.5} /> <span className="text-sm">Parsing CSV file...</span>
                    </div>
                  ) : csvData.length === 0 ? (
                    /* Drop zone */
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        if (!file.name.endsWith(".csv")) {
                          setCsvErrors([{ row: 0, field: "file", message: "Only .csv files are supported. Please save your spreadsheet as .csv first." }]);
                          return;
                        }
                        parseCsvFile(file);
                      }}
                      onClick={() => document.getElementById("csv-file-input")?.click()}
                      className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-12 text-center hover:border-slate-400 transition-colors cursor-pointer"
                    >
                      <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.name.endsWith(".csv")) {
                            setCsvErrors([{ row: 0, field: "file", message: "Only .csv files are supported. Please save your spreadsheet as .csv first." }]);
                            return;
                          }
                          parseCsvFile(file);
                          e.target.value = "";
                        }}
                      />
                      <Upload size={40} className="mx-auto mb-4 text-slate-400" />
                      <p className="text-slate-900 font-bold text-lg mb-1">Drop your CSV file here</p>
                      <p className="text-slate-500 text-sm font-medium">or click to browse</p>
                    </div>
                  ) : (
                    /* Parsed file view */
                    <div className="space-y-6">
                      {/* File info bar */}
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-blue-600" strokeWidth={2.5} />
                          <div>
                            <p className="text-slate-900 font-bold text-sm">{csvFile?.name}</p>
                            <p className="text-slate-500 text-xs font-medium">{csvData.length} row{csvData.length !== 1 && "s"} · {csvHeaders.length} column{csvHeaders.length !== 1 && "s"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setCsvFile(null); setCsvData([]); setCsvHeaders([]); setCsvColumnMap({}); setCsvErrors([]); setCsvErrorsExpanded(false); }}
                          className="text-xs text-red-600 hover:text-red-700 font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Column mapping */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Column Mapping</h3>
                        <p className="text-xs text-slate-600 font-medium mb-4">Map CSV columns to credential template fields. Auto-mapped where possible.</p>
                        <div className="space-y-3">
                          {/* Wallet address mapping */}
                          <div className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm ${csvColumnMap["wallet_address"] ? "border-slate-200 bg-white" : "border-yellow-300 bg-yellow-50"}`}>
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-900 font-bold text-sm">Wallet Address</span>
                              <span className="text-red-600 ml-1 font-bold">*</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!csvColumnMap["wallet_address"] && <AlertTriangle size={14} className="text-yellow-600 shrink-0" strokeWidth={2.5} />}
                              <select
                                value={csvColumnMap["wallet_address"] || ""}
                                onChange={(e) => {
                                  const newMap = { ...csvColumnMap, wallet_address: e.target.value };
                                  if (!e.target.value) delete (newMap as Partial<typeof newMap>)["wallet_address"];
                                  setCsvColumnMap(newMap);
                                  setCsvErrors(validateCsvData(csvData, newMap));
                                }}
                                className="bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg px-3 py-1.5 min-w-[180px] shadow-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="">— Select column —</option>
                                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Certificate column mapping (when template requires cert) */}
                          {selectedTemplate?.requiresCertificate && (
                            <div className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm ${csvColumnMap["certificate"] ? "border-slate-200 bg-white" : "border-yellow-300 bg-yellow-50"}`}>
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-900 font-bold text-sm">Certificate Filename</span>
                                <span className="text-red-600 ml-1 font-bold">*</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!csvColumnMap["certificate"] && <AlertTriangle size={14} className="text-yellow-600 shrink-0" strokeWidth={2.5} />}
                                <select
                                  value={csvColumnMap["certificate"] || ""}
                                  onChange={(e) => {
                                    const newMap = { ...csvColumnMap, certificate: e.target.value };
                                    if (!e.target.value) delete (newMap as Partial<typeof newMap>)["certificate"];
                                    setCsvColumnMap(newMap);
                                  }}
                                  className="bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg px-3 py-1.5 min-w-[180px] shadow-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="">— Select column —</option>
                                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Template field mappings */}
                          {selectedTemplate?.fields.filter((f) => f.type !== "file").map((field) => (
                            <div key={field.name} className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm ${
                              !csvColumnMap[field.name] && field.required
                                ? "border-yellow-300 bg-yellow-50"
                                : "border-slate-200 bg-white"
                            }`}>
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-900 font-bold text-sm">{field.label}</span>
                                {field.required && <span className="text-red-600 ml-1 font-bold">*</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {!csvColumnMap[field.name] && field.required && <AlertTriangle size={14} className="text-yellow-600 shrink-0" strokeWidth={2.5} />}
                                <select
                                  value={csvColumnMap[field.name] || ""}
                                  onChange={(e) => {
                                    const newMap = { ...csvColumnMap, [field.name]: e.target.value };
                                    if (!e.target.value) delete newMap[field.name];
                                    setCsvColumnMap(newMap);
                                    setCsvErrors(validateCsvData(csvData, newMap));
                                  }}
                                  className="bg-white border border-slate-300 text-slate-900 text-sm font-medium rounded-lg px-3 py-1.5 min-w-[180px] shadow-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="">— Select column —</option>
                                  {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Validation summary */}
                      {csvErrors.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                          <CheckCircle size={16} className="shrink-0" />
                          All {csvData.length} rows passed validation
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setCsvErrorsExpanded(!csvErrorsExpanded)}
                            className="w-full flex items-center justify-between p-3 text-left"
                          >
                            <div className="flex items-center gap-2 text-amber-400 text-sm">
                              <AlertTriangle size={16} className="shrink-0" />
                              <span>{new Set(csvErrors.map((e) => e.row)).size} row{new Set(csvErrors.map((e) => e.row)).size !== 1 ? "s have" : " has"} issues and will not be selectable in the next step. You can proceed with the valid rows.</span>
                            </div>
                            <ChevronRight size={16} className={`text-amber-400 transition-transform ${csvErrorsExpanded ? "rotate-90" : ""}`} />
                          </button>
                          {csvErrorsExpanded && (
                            <div className="border-t border-amber-500/20 max-h-48 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-amber-500/5 text-amber-300 uppercase sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left w-16">Row</th>
                                    <th className="px-3 py-2 text-left">Field</th>
                                    <th className="px-3 py-2 text-left">Issue</th>
                                  </tr>
                                </thead>
                                <tbody className="text-amber-200 divide-y divide-amber-500/10">
                                  {csvErrors.map((err, i) => (
                                    <tr key={i}>
                                      <td className="px-3 py-1.5 font-mono">{err.row}</td>
                                      <td className="px-3 py-1.5">{err.field}</td>
                                      <td className="px-3 py-1.5">{err.message}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Certificate file upload (when template requires it and CSV is loaded) ── */}
                  {csvData.length > 0 && selectedTemplate?.requiresCertificate && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mt-8 mb-4">
                        <Paperclip size={16} className="text-slate-400" />
                        <h3 className="text-lg font-extrabold text-slate-900">Certificate Files</h3>
                        <span className="text-xs text-yellow-700 font-bold bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full shadow-sm">Required by template</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-4">
                        Upload the PDF certificate files for each recipient. The system will match files to CSV rows using the filename in the &apos;certificate&apos; column.
                      </p>

                      {/* Cert drop zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
                          if (files.length > 0) setCertFiles(prev => [...prev, ...files]);
                        }}
                        onClick={() => document.getElementById("cert-file-input")?.click()}
                        className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-6 text-center hover:border-slate-400 transition-colors cursor-pointer"
                      >
                        <input
                          id="cert-file-input"
                          type="file"
                          accept=".pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).filter(f => f.name.toLowerCase().endsWith(".pdf"));
                            if (files.length > 0) setCertFiles(prev => [...prev, ...files]);
                            e.target.value = "";
                          }}
                        />
                        <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-900 font-bold text-sm">Drop PDF files here or click to browse</p>
                        <p className="text-slate-500 text-xs font-medium mt-1">Multiple files allowed — drop additional files anytime</p>
                      </div>

                      {/* Uploaded files list */}
                      {certFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {certFiles.map((file, i) => {
                            const isMatched = Object.values(certFileMap).some(f => f === file);
                            return (
                              <div key={`${file.name}-${i}`} className="flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText size={14} className="text-slate-400 shrink-0" />
                                  <span className="text-sm text-slate-900 font-bold truncate">{file.name}</span>
                                  <span className="text-xs text-slate-500 font-medium shrink-0">{formatFileSize(file.size)}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isMatched ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                                      <CheckCircle size={10} /> Matched
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                      Unmatched
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCertFiles(prev => prev.filter((_, j) => j !== i));
                                    }}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Match summary */}
                      {csvColumnMap["certificate"] && csvData.length > 0 && (() => {
                        const rowsWithCertFilename = csvData.filter((row) => {
                          const certHeader = csvColumnMap["certificate"];
                          return certHeader && row[certHeader]?.trim();
                        }).length;
                        const matchedCount = Object.keys(certFileMap).length;
                        const missingCount = rowsWithCertFilename - matchedCount;

                        if (rowsWithCertFilename === 0) return null;

                        return missingCount <= 0 ? (
                          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                            <CheckCircle size={16} className="shrink-0" />
                            All {matchedCount} certificates matched
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
                            <AlertTriangle size={16} className="shrink-0" />
                            {matchedCount} of {rowsWithCertFilename} certificates matched · {missingCount} row{missingCount !== 1 && "s"} missing certificates
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* File-level errors (before parsing) */}
                  {csvData.length === 0 && csvErrors.length > 0 && !csvParsing && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      {csvErrors[0].message}
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("source")} className="text-slate-500 hover:text-slate-900 font-bold transition-colors">Back</button>
                    <button
                      onClick={() => {
                        const freshErrors = validateCsvData(csvData, csvColumnMap);
                        setCsvErrors(freshErrors);
                        setStep("csvParticipants");
                      }}
                      disabled={
                        csvData.length === 0 ||
                        !csvColumnMap["wallet_address"] ||
                        (selectedTemplate?.requiresCertificate && !csvColumnMap["certificate"]) ||
                        (selectedTemplate?.fields.filter((f) => f.type !== "file" && f.required).some((f) => !csvColumnMap[f.name]) ?? false)
                      }
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-2"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── CSV PARTICIPANTS STEP ────── */}
              {step === "csvParticipants" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-heading font-extrabold text-slate-900">Select Recipients</h2>
                    {csvParticipants.length > 0 && (() => {
                      const validIds = csvParticipants.filter(p => !csvErrorRowIndices.has(p._csvRowIndex) && !(selectedTemplate?.requiresCertificate && !p.has_certificate)).map(p => p.id);
                      const allValidSelected = validIds.length > 0 && validIds.every(id => selectedStudentIds.includes(id));
                      return (
                        <button
                          onClick={() => {
                            if (allValidSelected) {
                              setSelectedStudentIds([]);
                            } else {
                              setSelectedStudentIds(validIds);
                            }
                          }}
                          className="text-sm text-blue-400 hover:underline"
                        >
                          {allValidSelected ? "Deselect All" : "Select All Valid"}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-2 mb-4 shadow-sm">
                    <Upload size={16} className="text-blue-600 shrink-0" strokeWidth={2.5} />
                    <p className="text-xs text-blue-700 font-medium">
                      <strong>CSV Source:</strong> {csvFile?.name} · {csvParticipants.length} row{csvParticipants.length !== 1 && "s"} parsed
                    </p>
                  </div>

                  {(() => {
                    const disabledCount = csvParticipants.filter(p => csvErrorRowIndices.has(p._csvRowIndex) || (selectedTemplate?.requiresCertificate && !p.has_certificate)).length;
                    return disabledCount > 0 ? (
                      <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm font-bold shadow-sm">
                        <AlertTriangle size={14} className="shrink-0" strokeWidth={2.5} />
                        {disabledCount} row{disabledCount !== 1 ? "s have" : " has"} validation errors or missing certificates and cannot be selected.
                      </div>
                    ) : null;
                  })()}

                  {csvParticipants.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <Users size={36} className="mx-auto mb-3 opacity-30" />
                      <p>No participants found in CSV data.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                              <th className="px-3 py-3 w-10"></th>
                              <th className="px-3 py-3">ID</th>
                              <th className="px-3 py-3">Name</th>
                              <th className="px-3 py-3">Programme</th>
                              <th className="px-3 py-3">Wallet</th>
                              {selectedTemplate?.requiresCertificate && <th className="px-3 py-3">Certificate</th>}
                              <th className="px-3 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-600 divide-y divide-slate-200">
                            {csvParticipants.map((p) => {
                              const hasError = csvErrorRowIndices.has(p._csvRowIndex);
                              const missingCert = !!(selectedTemplate?.requiresCertificate && !p.has_certificate);
                              const isDisabled = hasError || missingCert;
                              const isSelected = selectedStudentIds.includes(p.id);
                              const rowErrors = csvErrors.filter(e => e.row - 2 === p._csvRowIndex);
                              return (
                                <tr
                                  key={p.id}
                                  onClick={() => { if (!isDisabled) toggleStudent(p.id); }}
                                  style={isDisabled ? { boxShadow: "inset 3px 0 0 0 rgb(239 68 68)" } : undefined}
                                  className={`transition-colors ${
                                    isDisabled
                                      ? "bg-red-50 cursor-not-allowed opacity-60"
                                      : isSelected
                                        ? "bg-green-50 cursor-pointer"
                                        : "hover:bg-slate-50 cursor-pointer"
                                  }`}
                                >
                                  <td className="px-3 py-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onChange={() => { if (!isDisabled) toggleStudent(p.id); }}
                                      className="w-4 h-4 rounded border-slate-300 bg-white text-green-600 focus:ring-green-600 disabled:opacity-30"
                                    />
                                  </td>
                                  <td className="px-3 py-3 font-mono text-xs text-blue-600 font-bold">{p.student_id}</td>
                                  <td className="px-3 py-3 font-bold text-slate-900 text-sm">{p.name}</td>
                                  <td className="px-3 py-3 text-xs font-medium">{p.programme || "—"}</td>
                                  <td className="px-3 py-3 font-mono text-xs">
                                    {p.wallet_address ? (
                                      <span className="text-slate-600 font-medium">{truncateAddress(p.wallet_address)}</span>
                                    ) : (
                                      <span className="text-red-600 font-bold">Missing</span>
                                    )}
                                  </td>
                                  {selectedTemplate?.requiresCertificate && (
                                    <td className="px-3 py-3">
                                      {p.has_certificate ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                                          <CheckCircle size={10} strokeWidth={2.5} /> Matched
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                                          <AlertTriangle size={10} strokeWidth={2.5} /> Missing
                                        </span>
                                      )}
                                    </td>
                                  )}
                                  <td className="px-3 py-3">
                                    {hasError ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200" title={rowErrors.map(e => `${e.field}: ${e.message}`).join("; ")}>
                                        <AlertCircle size={10} strokeWidth={2.5} /> {rowErrors.length} error{rowErrors.length !== 1 && "s"}
                                      </span>
                                    ) : missingCert ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                                        <AlertCircle size={10} strokeWidth={2.5} /> Missing cert
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">Valid</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-500">
                        {(() => {
                          const disabledCount = csvParticipants.filter(p => csvErrorRowIndices.has(p._csvRowIndex) || (selectedTemplate?.requiresCertificate && !p.has_certificate)).length;
                          return `${csvParticipants.length} rows from CSV · ${csvParticipants.length - disabledCount} valid · ${disabledCount} invalid · ${selectedStudentIds.length} selected`;
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep("upload")} className="text-slate-500 hover:text-slate-900 font-bold transition-colors">Back</button>
                    <button
                      onClick={() => setStep("review")}
                      disabled={selectedStudentIds.length === 0}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Batch ({selectedStudentIds.length}) <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── REVIEW STEP ────── */}
              {step === "review" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-6">Confirm Issuance</h2>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                    <p className="text-sm text-yellow-700 font-medium">
                      This action will permanently anchor <strong>{selectedStudentIds.length} credential{selectedStudentIds.length !== 1 && "s"}</strong> on the Ethereum blockchain. Each credential will be issued to the student&apos;s wallet address. This cannot be undone.
                    </p>
                  </div>

                  {selectedTemplate?.requiresCertificate && dataSource === "external" && studentsWithoutCert.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl mb-4 flex items-start gap-3 shadow-sm">
                      <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={16} strokeWidth={2.5} />
                      <p className="text-xs text-yellow-700 font-medium">
                        <strong>{studentsWithoutCert.length} of {selectedStudentIds.length}</strong> selected students have no certificate file. These will be issued without a certificate attachment.
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-3 text-slate-600 font-medium mb-6 text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Template:</span>
                      <span className="text-slate-900 font-bold">{selectedTemplate?.title} <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ml-1 ${selectedTemplate ? TYPE_BADGE[selectedTemplate.type] : ""}`}>{selectedTemplate?.type}</span></span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Data Source:</span>
                      {dataSource === "csv" ? (
                        <span className="text-slate-900 font-bold flex items-center gap-1.5"><Upload size={13} className="text-blue-600" strokeWidth={2.5} /> CSV Upload ({csvFile?.name})</span>
                      ) : (
                        <span className="text-slate-900 font-bold flex items-center gap-1.5"><Database size={13} className="text-blue-600" strokeWidth={2.5} /> {selectedConnection?.system_name}</span>
                      )}
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Total Recipients:</span>
                      <span className="text-slate-900 font-bold">{selectedStudentIds.length}</span>
                    </div>
                    {selectedTemplate?.requiresCertificate && dataSource === "external" && (
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span>Certificate Attachment:</span>
                        <span className="text-green-700 font-bold">
                          Yes — {studentsWithCert.length} available, {studentsWithoutCert.length} missing
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span>Issuer Authority:</span>
                      <span className="text-green-700 font-bold flex items-center gap-1"><ShieldCheck size={14} strokeWidth={2.5} /> Verified</span>
                    </div>
                  </div>

                  {/* Certificate info banners */}
                  {!selectedTemplate?.requiresCertificate && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-6">
                      <FileText size={14} className="shrink-0 text-slate-500" />
                      <span>Certificate file attachment is not required for this credential type.</span>
                    </div>
                  )}
                  {selectedTemplate?.requiresCertificate && dataSource === "csv" && (() => {
                    const csvCertMatched = selectedStudentObjects.filter(s => s.has_certificate).length;
                    const csvCertMissing = selectedStudentObjects.length - csvCertMatched;
                    return (
                      <>
                        {csvCertMatched > 0 && (
                          <div className="flex items-center gap-2 text-xs text-green-700 font-bold bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 shadow-sm">
                            <Paperclip size={14} className="shrink-0" />
                            <span>{csvCertMatched} of {selectedStudentObjects.length} credentials have certificate files attached</span>
                          </div>
                        )}
                        {csvCertMissing > 0 && (
                          <div className="flex items-center gap-2 text-xs text-yellow-700 font-bold bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-6 shadow-sm">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{csvCertMissing} credential{csvCertMissing !== 1 ? "s" : ""} will be issued without a certificate file.</span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Recipient table */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-8 max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-8">#</th>
                          <th className="px-3 py-2.5">Student ID</th>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Wallet Address</th>
                          {(dataSource === "external" || (dataSource === "csv" && selectedTemplate?.requiresCertificate)) && <th className="px-3 py-2.5">Certificate</th>}
                          <th className="px-3 py-2.5">Credential Title</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 divide-y divide-slate-200">
                        {selectedStudentObjects.map((s, i) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-blue-600 font-bold">{s.student_id}</td>
                            <td className="px-3 py-2 text-slate-900 font-bold">{s.name}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{truncateAddress(s.wallet_address)}</td>
                            {(dataSource === "external" || (dataSource === "csv" && selectedTemplate?.requiresCertificate)) && (
                              <td className="px-3 py-2">
                                {s.has_certificate
                                  ? <span className="text-green-600 font-bold">{dataSource === "csv" ? "Attached" : "Available"}</span>
                                  : <span className="text-slate-500">None</span>}
                              </td>
                            )}
                            <td className="px-3 py-2 text-slate-500 font-bold">{selectedTemplate?.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(dataSource === "csv" ? "csvParticipants" : "participants")} className="text-slate-500 hover:text-slate-900 font-bold transition-colors">Back</button>
                    <button
                      onClick={handleConfirmAndIssue}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20"
                    >
                      <ShieldCheck size={18} strokeWidth={2.5} />
                      Sign & Issue {selectedStudentIds.length} Credential{selectedStudentIds.length !== 1 && "s"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── PROCESSING STEP ────── */}
              {step === "processing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-green-100 rounded-full text-green-600 mb-4">
                      <Loader2 size={48} className="animate-spin" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-1">Issuing Credentials</h2>
                    <p className="text-slate-500 font-medium text-sm">Do not close this page or switch tabs.</p>
                  </div>

                  {/* Overall progress bar */}
                  <div className="max-w-md mx-auto mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Overall Progress</span>
                      <span className="text-xs text-green-600 font-bold">{overallProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Phase indicators */}
                  <div className="max-w-md mx-auto space-y-3">
                    {[
                      { phase: 1, label: "Uploading certificates to IPFS" },
                      { phase: 2, label: "Building credential data" },
                      { phase: 3, label: "Uploading metadata to IPFS" },
                      { phase: 4, label: "Awaiting MetaMask signature" },
                      { phase: 5, label: "Saving to database" },
                    ].map(({ phase, label }) => {
                      const isActive = processingPhase === phase;
                      const isDone = processingPhase > phase;
                      return (
                        <div key={phase} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? "bg-green-50 border border-green-200 shadow-sm" : isDone ? "bg-slate-50" : "opacity-50"}`}>
                          {isDone ? (
                            <CheckCircle size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
                          ) : isActive ? (
                            <Loader2 size={16} className="text-green-600 animate-spin shrink-0" strokeWidth={2.5} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className={`text-sm ${isActive ? "text-slate-900 font-bold" : isDone ? "text-slate-500" : "text-slate-400 font-medium"}`}>
                            {label}
                          </span>
                          {isActive && processingProgress.total > 0 && (
                            <span className="ml-auto text-xs text-green-600 font-bold font-mono">
                              {processingProgress.current}/{processingProgress.total}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-slate-500 font-medium mt-6">{processingStatus}</p>
                </motion.div>
              )}

              {/* ────── ERROR STEP ────── */}
              {step === "error" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                  <div className="inline-flex p-4 bg-red-50 rounded-full text-red-600 mb-4 shadow-sm">
                    <XCircle size={56} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2">Issuance Failed</h2>
                  <p className="text-slate-500 text-sm mb-4 font-medium">
                    Failed during: <span className="text-red-600 font-bold">{errorPhase}</span>
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-lg mx-auto mb-8 text-left shadow-sm">
                    <p className="text-sm text-red-700 font-bold break-words">{error}</p>
                  </div>

                  {batchTxHash && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-lg mx-auto mb-6 text-left shadow-sm">
                      <p className="text-xs text-yellow-700 mb-1 font-bold"><strong>Important:</strong> Credentials may have been anchored on-chain.</p>
                      <p className="text-xs text-yellow-700 font-mono break-all font-medium">
                        TX: <a href={`https://sepolia.etherscan.io/tx/${batchTxHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800 font-bold">{batchTxHash}</a>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setStep("review")} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-sm transition-colors">
                      Try Again
                    </button>
                    <button onClick={() => router.push("/issuer")} className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 shadow-sm transition-colors">
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ────── SUCCESS STEP ────── */}
              {step === "success" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-green-100 rounded-full text-green-600 mb-4 shadow-sm">
                      <CheckCircle size={56} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-heading font-extrabold text-slate-900 mb-2">Credentials Issued Successfully</h2>
                    <p className="text-slate-500 text-sm font-medium">
                      All {issuedCredentials.length} credentials have been anchored on-chain and saved.
                    </p>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Issued</p>
                      <p className="text-2xl font-bold text-green-600">{issuedCredentials.length}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Template</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedTemplate?.title}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Data Source</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{dataSource === "csv" ? "CSV Upload" : selectedConnection?.system_name}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">With Certificate</p>
                      <p className="text-2xl font-bold text-blue-600">{issuedCredentials.filter((c) => c.ipfsCid).length}</p>
                    </div>
                  </div>

                  {/* Transaction link */}
                  <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4 mb-6">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Blockchain Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${batchTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-green-600 font-bold text-sm break-all hover:underline flex items-center gap-2"
                    >
                      {batchTxHash}
                      <ExternalLink size={14} className="shrink-0" strokeWidth={2.5} />
                    </a>
                  </div>

                  {/* Credential details table */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-8 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-8">#</th>
                          <th className="px-3 py-2.5">Student</th>
                          <th className="px-3 py-2.5">Wallet</th>
                          <th className="px-3 py-2.5">Ref ID</th>
                          <th className="px-3 py-2.5">Certificate</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 divide-y divide-slate-200">
                        {issuedCredentials.map((cred, i) => (
                          <tr key={cred.refId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-2">
                              <span className="text-slate-900 font-bold">{cred.studentName}</span>
                              <span className="text-slate-500 ml-1.5 font-medium">({cred.studentId})</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600">{truncateAddress(cred.studentWallet)}</td>
                            <td className="px-3 py-2 font-mono text-blue-600 font-bold">{truncateId(cred.refId)}</td>
                            <td className="px-3 py-2">
                              {cred.ipfsCid
                                ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} strokeWidth={2.5} /> Pinned</span>
                                : <span className="text-slate-500 font-medium">None</span>}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} strokeWidth={2.5} /> Issued</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setStep("source");
                        setDataSource(null);
                        setSelectedConnection(null);
                        setSelectedTemplate(null);
                        setSelectedStudentIds([]);
                        setExternalStudents([]);
                        setCsvFile(null); setCsvData([]); setCsvHeaders([]); setCsvColumnMap({}); setCsvErrors([]);
                        setCertFiles([]); setCertFileMap({});
                        setIssuedCredentials([]);
                        setBatchTxHash("");
                        setError(null);
                      }}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 shadow-sm transition-colors"
                    >
                      Issue Another Batch
                    </button>
                    <button
                      onClick={() => router.push("/issuer")}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm transition-colors"
                    >
                      View Issued Credentials
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
}
