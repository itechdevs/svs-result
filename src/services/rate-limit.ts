import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback for development without Redis
const inMemoryStore = new Map<string, { count: number; reset: number }>();

function inMemoryRateLimit(key: string, limit: number, window: number): boolean {
  const now = Date.now();
  const record = inMemoryStore.get(key);

  if (!record || now > record.reset) {
    inMemoryStore.set(key, { count: 1, reset: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "ratelimit:login",
    })
  : null;

export const registerRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      prefix: "ratelimit:register",
    })
  : null;

export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      prefix: "ratelimit:password-reset",
    })
  : null;

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  if (loginRateLimit) {
    const { success } = await loginRateLimit.limit(identifier);
    return success;
  }
  return inMemoryRateLimit(`login:${identifier}`, 5, 15 * 60 * 1000);
}

export async function checkRegisterRateLimit(identifier: string): Promise<boolean> {
  if (registerRateLimit) {
    const { success } = await registerRateLimit.limit(identifier);
    return success;
  }
  return inMemoryRateLimit(`register:${identifier}`, 3, 60 * 60 * 1000);
}

export async function checkPasswordResetRateLimit(identifier: string): Promise<boolean> {
  if (passwordResetRateLimit) {
    const { success } = await passwordResetRateLimit.limit(identifier);
    return success;
  }
  return inMemoryRateLimit(`reset:${identifier}`, 3, 60 * 60 * 1000);
}
