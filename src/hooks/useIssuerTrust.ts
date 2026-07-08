"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { REGISTRY_ADDRESS, REGISTRY_ABI, SEPOLIA_RPC_URL } from "@/config/contracts";

export type TrustState = "loading" | "trusted" | "revoked" | "error";

/**
 * Reads an issuer wallet's trust status directly from the on-chain
 * IssuerRegistry (isIssuerTrusted). This is the authoritative source used by
 * the admin governance panel — not an address-match inference.
 *
 * Returns "loading" until the wallet is known and the read resolves.
 */
export function useIssuerTrust(wallet: string | null | undefined): TrustState {
  const [state, setState] = useState<TrustState>("loading");

  useEffect(() => {
    if (!wallet) {
      setState("loading");
      return;
    }

    let cancelled = false;
    setState("loading");

    (async () => {
      try {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
        const trusted: boolean = await contract.isIssuerTrusted(wallet);
        if (cancelled) return;
        setState(trusted ? "trusted" : "revoked");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => { cancelled = true; };
  }, [wallet]);

  return state;
}
