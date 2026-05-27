export type CredentialStatus = "active" | "revoked";

export type CredentialType = "Degree" | "Award" | "Certificate" | "Status";

export interface Credential {
  id: string;
  refId: string;
  title: string;
  type: CredentialType;
  issuer: string;
  issuerWallet: string;
  holderWallet: string;
  status: CredentialStatus;
  issuedDate: string;
  expiryDate: string | null;
  description: string;
  txHash: string | null;
  network: string;
  ipfsCid: string | null;
  certificateUrl: string | null;
  grade: string | null;
  studentId: string | null;
  studentName: string | null;
}

export interface BlockchainState {
  valid: boolean;
  revoked: boolean;
  issuer: string;
}

export type TemplateFieldType = "text" | "date" | "select" | "file";

export interface TemplateField {
  name: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export type IssuanceMode = "single" | "bulk" | "both";

export interface CredentialTemplate {
  id: string;
  title: string;
  type: CredentialType;
  description: string;
  issuanceMode: IssuanceMode;
  requiresCertificate: boolean;
  fields: TemplateField[];
}

export type TrustStatus = "trusted" | "revoked" | "pending";

export interface IssuerProfile {
  wallet: string;
  institution: string;
  type: string;
  department: string;
  website: string;
  address: string;
  trustStatus: TrustStatus;
}

export interface VerificationResult {
  valid: boolean;
  revoked: boolean;
  issuerTrusted: boolean;
  expired: boolean;
  credential?: Credential;
}
