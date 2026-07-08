/**
 * Credential expiry resolution.
 *
 * Expiry is stored in two places, under many different key names:
 *   - Supabase: the `expires_at` column (populated at issuance).
 *   - IPFS metadata: inside the credential `fields` object, whose key depends
 *     entirely on the template (e.g. `expiryDate`, `validUntil`, `validTo`).
 *
 * Because templates (system defaults, API-managed, and SIS-imported) name the
 * expiry field inconsistently, we can't match a single hard-coded key. These
 * helpers match any of the known expiry keywords so a credential's expiry is
 * captured at issuance and derived reliably at display time.
 */

// Normalized (lowercased, alphanumeric-only) key names that represent an expiry.
const EXPIRY_KEYWORDS = new Set([
  "expirydate",
  "expiry",
  "expires",
  "expiresat",
  "expiration",
  "expirationdate",
  "expireson",
  "dateofexpiry",
  "validuntil",
  "validto",
  "validtill",
  "validthrough",
  "enddate",
]);

/** Lowercase and strip anything that isn't a letter or digit. */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** True if a field name refers to a credential expiry date. */
export function isExpiryFieldName(name: string): boolean {
  return EXPIRY_KEYWORDS.has(normalizeKey(name));
}

/**
 * Find the expiry value inside a credential `fields` object (from the issue
 * form or from IPFS metadata). Returns the raw date string, or null if there's
 * no expiry field / it's blank.
 */
export function resolveExpiryValue(
  fields: Record<string, unknown> | null | undefined
): string | null {
  if (!fields) return null;
  for (const [key, value] of Object.entries(fields)) {
    if (isExpiryFieldName(key)) {
      const str = value == null ? "" : String(value).trim();
      if (str) return str;
    }
  }
  return null;
}

/**
 * True if an expiry date string is in the past. Blank/null (no expiry) is
 * never expired. Unparseable dates are treated as not expired.
 */
export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (Number.isNaN(time)) return false;
  return time < Date.now();
}
