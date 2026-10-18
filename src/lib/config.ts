/**
 * OTP feature flag — read from the OTP_ENABLED env var.
 *
 * - `OTP_ENABLED=true`  (default): registration requires phone OTP verification
 * - `OTP_ENABLED=false`: registration skips OTP — accounts are created directly
 *   with `phoneVerified=true`. Useful for local dev or when you haven't yet
 *   purchased an SMS provider.
 *
 * This function is safe to call from both server and client code (it reads
 * process.env, which is the same in both contexts in Next.js for a public
 * env var like OTP_ENABLED — but be aware that changing this value requires
 * a server restart to take effect).
 */
export function isOtpEnabled(): boolean {
  const v = process.env.OTP_ENABLED
  if (v === undefined) return true // default: OTP required
  return v.toLowerCase() === 'true'
}
