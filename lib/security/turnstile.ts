/**
 * Cloudflare Turnstile anti-bot verification.
 * Used for host actions (invite, export) to prevent distributed bot attacks.
 * Optional in development (skipped when TURNSTILE_SECRET_KEY is not set).
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Verify a Turnstile token server-side.
 * Returns { success: true } if valid, or skips in dev when key is not configured.
 *
 * @param token - The cf-turnstile-response token from the client
 * @param remoteIp - The user's IP address (optional, improves accuracy)
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification in development if not configured
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Turnstile] No TURNSTILE_SECRET_KEY set — skipping verification in dev mode.');
      return { success: true };
    }
    // In production, missing key = hard fail
    return { success: false, error: 'TURNSTILE_NOT_CONFIGURED' };
  }

  if (!token) {
    return { success: false, error: 'MISSING_TURNSTILE_TOKEN' };
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    });

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      return { success: false, error: 'TURNSTILE_API_ERROR' };
    }

    const data = await res.json();

    if (data.success !== true) {
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'TURNSTILE_INVALID_TOKEN',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[Turnstile] Verification error:', err);
    return { success: false, error: 'TURNSTILE_NETWORK_ERROR' };
  }
}

/**
 * Check if Turnstile is enabled (key is configured).
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

/**
 * Get public site key for client-side widget rendering.
 */
export function getTurnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
}
