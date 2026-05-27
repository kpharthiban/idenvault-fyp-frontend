export type TemplateField = {
  name: string;
  label: string;
  type: "text" | "date" | "select" | "file" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type CredentialTemplate = {
  id: string;
  title: string;
  type: "Degree" | "Award" | "Certificate" | "Status";
  description: string;
  issuanceMode: "single" | "bulk" | "both";
  requiresCertificate: boolean;
  fields: TemplateField[];
  issuer_wallet?: string;
  isSystemDefault?: boolean;
};

export const CREDENTIAL_TEMPLATES: CredentialTemplate[] = [
  {
    id: "TEMP-001",
    title: "Bachelor of Computer Science (Honours)",
    type: "Degree",
    description: "Awarded upon completion of the 4-year undergraduate programme with a specialization in Data Science or Cybersecurity.",
    issuanceMode: "both",
    requiresCertificate: true,
    isSystemDefault: true,
    fields: [
      { name: "studentName", label: "Student Name", type: "text", required: true, placeholder: "Full name as per records" },
      { name: "programme", label: "Programme", type: "text", required: true, placeholder: "Bachelor of Computer Science (Honours)" },
      { name: "grade", label: "Grade / CGPA", type: "text", required: false, placeholder: "e.g. First Class Honours" },
      { name: "graduationDate", label: "Graduation Date", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", required: false, placeholder: "Additional remarks or specialization details" },
      { name: "certificate", label: "Certificate (PDF)", type: "file", required: true },
    ],
  },
  {
    id: "TEMP-002",
    title: "Dean's List Award 2024",
    type: "Award",
    description: "Recognition of outstanding academic achievement (GPA > 3.7) for the 2024 academic session.",
    issuanceMode: "bulk",
    requiresCertificate: false,
    isSystemDefault: true,
    fields: [
      { name: "studentName", label: "Student Name", type: "text", required: true, placeholder: "Full name as per records" },
      { name: "academicSession", label: "Academic Session", type: "text", required: true, placeholder: "e.g. 2024/2025 Semester 1" },
      { name: "gpaThreshold", label: "GPA Threshold", type: "text", required: false, placeholder: "e.g. 3.70" },
      { name: "description", label: "Description", type: "textarea", required: false, placeholder: "Additional remarks" },
    ],
  },
  {
    id: "TEMP-003",
    title: "Certified Ethical Hacker (Practical)",
    type: "Certificate",
    description: "Professional certification validating skills in penetration testing and vulnerability assessment.",
    issuanceMode: "single",
    requiresCertificate: true,
    isSystemDefault: true,
    fields: [
      { name: "studentName", label: "Student Name", type: "text", required: true, placeholder: "Full name as per records" },
      { name: "certificationBody", label: "Certification Body", type: "text", required: true, placeholder: "e.g. EC-Council" },
      { name: "validFrom", label: "Valid From", type: "date", required: true },
      { name: "validUntil", label: "Valid Until", type: "date", required: true },
      { name: "description", label: "Description", type: "textarea", required: false, placeholder: "Additional remarks or specialization details" },
      { name: "certificate", label: "Certificate (PDF)", type: "file", required: true },
    ],
  },
  {
    id: "TEMP-004",
    title: "Student Identification Credential",
    type: "Status",
    description: "Verifies active student enrollment status for the current academic session.",
    issuanceMode: "single",
    requiresCertificate: false,
    isSystemDefault: true,
    fields: [
      { name: "studentName", label: "Student Name", type: "text", required: true, placeholder: "Full name as per records" },
      { name: "studentIdNumber", label: "Student ID Number", type: "text", required: true, placeholder: "e.g. TP012345" },
      { name: "faculty", label: "Faculty", type: "text", required: true, placeholder: "e.g. Faculty of Computing & IT" },
      { name: "enrollmentDate", label: "Enrollment Date", type: "date", required: true },
      { name: "expiryDate", label: "Expiry Date", type: "date", required: true },
    ],
  },
];