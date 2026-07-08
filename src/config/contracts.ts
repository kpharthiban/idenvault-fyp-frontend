// Shared on-chain contract config for the IdenVault frontend.
// Centralizes the IssuerRegistry address + ABI so admin, the trust hook,
// and any future on-chain reads share a single source of truth.

export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS!;

export const REGISTRY_ABI = [
  "function registerIssuer(address issuer) external",
  "function revokeIssuer(address issuer) external",
  "function isIssuerTrusted(address issuer) external view returns (bool)",
  "event IssuerRegistered(address indexed issuer)",
  "event IssuerRevoked(address indexed issuer)",
];

// Read-only Sepolia RPC endpoint (Infura). Used for view calls that don't
// require a signer, e.g. reading issuer trust status.
// NEXT_PUBLIC_INFURA_KEY may be either a bare project key or a full RPC URL
// (the local .env.local currently holds a full URL), so handle both.
const INFURA = process.env.NEXT_PUBLIC_INFURA_KEY ?? "";
export const SEPOLIA_RPC_URL = INFURA.startsWith("http")
  ? INFURA
  : `https://sepolia.infura.io/v3/${INFURA}`;
