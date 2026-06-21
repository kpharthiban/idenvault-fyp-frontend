/**
 * Layer 6 — E2E Automated Testing
 * File: tests/e2e/auth-flows.spec.ts
 *
 * E2E-A01 to E2E-A03 — Role-based authentication flows.
 *
 * Strategy: Instead of automating MetaMask popups (Synpress),
 * we inject the auth session directly into sessionStorage before navigating.
 * This mirrors exactly what AuthContext stores after a real MetaMask login:
 *   { walletAddress: string (lowercase), role: string, loginTimestamp: number }
 *
 * The app's useEffect on mount reads this sessionStorage entry and hydrates
 * the auth context — RequireAuth then grants access to protected routes.
 */

import { test, expect, Page } from '@playwright/test';

// ── Wallet addresses (must match lowercase — app lowercases on connect) ────────

const STUDENT_WALLET = '0xecf55bfa753367446bc8983f0a04350e561cb666';
const ISSUER_WALLET  = '0xd74557c826c691c9d1132f0161434091f37cf10f';
const ADMIN_WALLET   = '0x761baa235206ee9107f09777608a021824bc10fd';

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Injects an authenticated session into the browser's sessionStorage.
 *
 * Must be called BEFORE navigating to a protected route.
 * We land on '/' first (public, no redirect), set the key, then let the
 * test navigate to the target route — RequireAuth reads the injected state.
 */
async function injectSession(
  page: Page,
  walletAddress: string,
  role: 'student' | 'issuer' | 'admin'
): Promise<void> {
  await page.goto('/');

  await page.evaluate(
    ({ walletAddress, role }) => {
      sessionStorage.setItem(
        'idenvault_session',
        JSON.stringify({
          walletAddress,
          role,
          loginTimestamp: Date.now(),
        })
      );
    },
    { walletAddress, role }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/**
 * E2E-A01
 * Injecting a student session causes the student dashboard to load
 * and the role badge to display "student".
 */
test('E2E-A01: student session injection → role badge shows student', async ({ page }) => {
  await injectSession(page, STUDENT_WALLET, 'student');
  await page.goto('/student');

  await expect(page.getByTestId('role-badge')).toContainText('student', { timeout: 10000 });
});

/**
 * E2E-A02
 * Injecting an issuer session causes the issuer dashboard to load
 * and the role badge to display "issuer".
 */
test('E2E-A02: issuer session injection → role badge shows issuer', async ({ page }) => {
  await injectSession(page, ISSUER_WALLET, 'issuer');
  await page.goto('/issuer');

  await expect(page.getByTestId('role-badge')).toContainText('issuer', { timeout: 10000 });
});

/**
 * E2E-A03
 * Injecting an admin session causes the admin dashboard to load
 * and the role badge to display "admin".
 */
test('E2E-A03: admin session injection → role badge shows admin', async ({ page }) => {
  await injectSession(page, ADMIN_WALLET, 'admin');
  await page.goto('/admin');

  await expect(page.getByTestId('role-badge')).toContainText('admin', { timeout: 10000 });
});