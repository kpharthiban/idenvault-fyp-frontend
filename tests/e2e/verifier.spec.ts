/**
 * Layer 6 — E2E Automated Testing
 * File: tests/e2e/verifier.spec.ts
 *
 * E2E-V01 to E2E-V05 — Public verifier portal flows.
 * No wallet or MetaMask required for any of these cases.
 */

import { test, expect } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ACTIVE_REF_ID  = '072fe4c7-cae2-41e9-bd62-88d8aac164e9'; // Hackathon 2026 — ACTIVE
const REVOKED_REF_ID = '2c3772e5-5f37-4703-b226-546c637c3dcb'; // CEH Practical  — REVOKED
const EXPIRED_REF_ID = '11221188-046f-43a8-948e-455d15087799'; // Student ID      — EXPIRED

// The student wallet that holds the ACTIVE_REF_ID credential
const STUDENT_WALLET = '0xecf55bfa753367446bc8983f0a04350e561cb666';

// Holds the presentation token generated in beforeAll for E2E-V05
let expiredQRToken: string;
let tokenGeneratedAt: number;

// ── Setup ─────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  // Generate a 30s presentation token NOW so it expires during V05.
  // V01–V04 typically take 20–40s total (blockchain calls included),
  // so V05 adds only the remaining wait time needed.
  const res = await fetch(
    `${API_URL}/api/credentials/${ACTIVE_REF_ID}/present`,
    {
      method: 'POST',
      headers: { 'x-wallet-address': STUDENT_WALLET },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to generate presentation token (${res.status}). ` +
      'Is the backend running on port 3001?'
    );
  }

  const data = await res.json();
  expiredQRToken = data.token;
  tokenGeneratedAt = Date.now();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

/**
 * E2E-V01
 * The public /verify page loads without triggering a wallet connect prompt.
 */
test('E2E-V01: verify page loads with ref-id input and no wallet prompt', async ({ page }) => {
  await page.goto('/verify');

  // Input field must be visible — confirms page rendered correctly
  await expect(page.getByTestId('ref-id-input')).toBeVisible();

  // Verify button must be present
  await expect(page.getByTestId('verify-button')).toBeVisible();

  // No wallet modal / MetaMask prompt should block the page
  // (absence of any overlay with "Connect Wallet" text)
  const walletModal = page.getByText('Connect Wallet', { exact: false });
  await expect(walletModal).not.toBeVisible();
});

/**
 * E2E-V02
 * An active credential returns VERIFIED with all 5 trust checks passing.
 */
test('E2E-V02: active ref_id → VERIFIED, all trust checks pass', async ({ page }) => {
  await page.goto('/verify');

  await page.getByTestId('ref-id-input').fill(ACTIVE_REF_ID);
  await page.getByTestId('verify-button').click();

  // Overall status badge
  await expect(page.getByTestId('status-badge')).toContainText('Credential Verified', { timeout: 20000 });

  // All 5 individual trust check rows must show PASS
  await expect(page.getByTestId('trust-check-existence')).toContainText('PASS');
  await expect(page.getByTestId('trust-check-integrity')).toContainText('PASS');
  await expect(page.getByTestId('trust-check-revocation')).toContainText('PASS');
  await expect(page.getByTestId('trust-check-issuer')).toContainText('PASS');
  await expect(page.getByTestId('trust-check-expiry')).toContainText('PASS');
});

/**
 * E2E-V03
 * A revoked credential returns INVALID with the revocation check failing.
 */
test('E2E-V03: revoked ref_id → INVALID, revocation check fails', async ({ page }) => {
  await page.goto('/verify');

  await page.getByTestId('ref-id-input').fill(REVOKED_REF_ID);
  await page.getByTestId('verify-button').click();

  // Overall status must be INVALID
  await expect(page.getByTestId('status-badge')).toContainText('Verification Failed', { timeout: 20000 });

  // Revocation check row must show FAIL
  await expect(page.getByTestId('trust-check-revocation')).toContainText('FAIL');
});

/**
 * E2E-V04
 * An expired credential returns INVALID with the expiry check failing.
 */
test('E2E-V04: expired ref_id → INVALID, expiry check fails', async ({ page }) => {
  await page.goto('/verify');

  await page.getByTestId('ref-id-input').fill(EXPIRED_REF_ID);
  await page.getByTestId('verify-button').click();

  // Overall status must be INVALID
  await expect(page.getByTestId('status-badge')).toContainText('Verification Failed', { timeout: 20000 });

  // Expiry check row must show FAIL
  await expect(page.getByTestId('trust-check-expiry')).toContainText('FAIL');
});

/**
 * E2E-V05
 * Navigating to /verify?token=<expired_token> shows the token-expired message.
 * The token was generated in beforeAll (30s validity).
 * This test waits until the token is confirmed expired before navigating.
 */
test('E2E-V05: expired QR token → token-expired message shown', async ({ page }) => {
  // Override timeout for this test only (31s wait + navigation + assertion)
  test.setTimeout(90000);

  // Wait until at least 32 seconds have elapsed since token generation
  const elapsed = Date.now() - tokenGeneratedAt;
  const waitMs = Math.max(0, 32000 - elapsed);

  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }

  await page.goto(`/verify?token=${expiredQRToken}`);

  await expect(page.getByTestId('token-expired-message')).toBeVisible({ timeout: 10000 });
});