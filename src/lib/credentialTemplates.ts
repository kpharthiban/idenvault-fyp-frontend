export type CredentialTemplate = {
  id: string;
  title: string;
  type: "Degree" | "Award" | "Certificate";
  description: string;
  issuanceMode: "single" | "bulk" | "both";
  requiresCertificate: boolean; // Does it need a PDF upload?
};

export const CREDENTIAL_TEMPLATES: CredentialTemplate[] = [
  {
    id: "TEMP-001",
    title: "Bachelor of Computer Science (Honours)",
    type: "Degree",
    description: "Awarded upon completion of the 4-year undergraduate programme with a specialization in Data Science or Cybersecurity.",
    issuanceMode: "both",
    requiresCertificate: true,
  },
  {
    id: "TEMP-002",
    title: "Dean's List Award 2024",
    type: "Award",
    description: "Recognition of outstanding academic achievement (GPA > 3.7) for the 2024 academic session.",
    issuanceMode: "bulk", // Bulk only!
    requiresCertificate: false,
  },
  {
    id: "TEMP-003",
    title: "Certified Ethical Hacker (Practical)",
    type: "Certificate",
    description: "Professional certification validating skills in penetration testing and vulnerability assessment.",
    issuanceMode: "single", // Single only!
    requiresCertificate: true,
  },
];