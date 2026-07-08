"use client";

import { useEffect, useState } from "react";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

export interface IpfsMetadata {
  refId: string;
  templateId: string;
  issuerWallet: string;
  studentWallet: string;
  title: string;
  type: string;
  fields: Record<string, string>;
  ipfsCid: string | null;
  issuedAt: string;
}

/**
 * Deferred-hydrate fetch for a credential's IPFS field metadata.
 *
 * Fetching happens in its own effect keyed on the CID, so it never blocks the
 * caller's first paint — render the fast DB data immediately, then let this
 * fill in the field data in the background. Failure is best-effort (returns
 * null metadata, no throw), since the display is non-critical.
 */
export function useIpfsMetadata(metadataCid: string | null | undefined) {
  const [metadata, setMetadata] = useState<IpfsMetadata | null>(null);
  // Which CID we've finished attempting (success or failure). Used to derive
  // `loading` synchronously so the skeleton shows on the very first paint after
  // a CID appears — no post-effect flash — and disappears once settled.
  const [settledCid, setSettledCid] = useState<string | null>(null);

  useEffect(() => {
    if (!metadataCid) {
      setMetadata(null);
      setSettledCid(null);
      return;
    }

    let cancelled = false;
    setMetadata(null);

    (async () => {
      try {
        const res = await fetch(`${PINATA_GATEWAY}/${metadataCid}`);
        if (res.ok) {
          const json: IpfsMetadata = await res.json();
          if (!cancelled) setMetadata(json);
        }
      } catch {
        // Non-critical — metadata display is best-effort
      } finally {
        if (!cancelled) setSettledCid(metadataCid);
      }
    })();

    return () => { cancelled = true; };
  }, [metadataCid]);

  const loading = !!metadataCid && settledCid !== metadataCid;

  return { metadata, loading };
}
