// Rate limiting removed - all functions are no-ops
// Install @upstash/redis and @upstash/ratelimit to re-enable

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  return true; // No rate limiting
}

export async function checkRegisterRateLimit(identifier: string): Promise<boolean> {
  return true; // No rate limiting
}

export async function checkPasswordResetRateLimit(identifier: string): Promise<boolean> {
  return true; // No rate limiting
}
