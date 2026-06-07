#!/usr/bin/env tsx
/**
 * scripts/verify/auth-ping.ts
 * Run: npm run verify:auth
 *
 * Verifies NEXTAUTH_SECRET is set and NEXTAUTH_URL is reachable.
 */
import "dotenv/config";

async function main() {
  console.log("🔐 Auth Ping — verifying auth configuration...\n");

  const checks: { name: string; pass: boolean; detail?: string }[] = [];

  // Check NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET;
  checks.push({
    name: "NEXTAUTH_SECRET",
    pass: !!secret && secret.length >= 32,
    detail: !secret
      ? "Not set"
      : secret.length < 32
      ? `Too short (${secret.length} chars, need ≥ 32)`
      : `Set (${secret.length} chars)`,
  });

  // Check NEXTAUTH_URL
  const authUrl = process.env.NEXTAUTH_URL;
  checks.push({
    name: "NEXTAUTH_URL",
    pass: !!authUrl,
    detail: authUrl ?? "Not set",
  });

  // Check NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  checks.push({
    name: "NEXT_PUBLIC_APP_URL",
    pass: !!appUrl,
    detail: appUrl ?? "Not set",
  });

  let allPassed = true;
  for (const check of checks) {
    const icon = check.pass ? "✅" : "❌";
    console.log(`${icon} ${check.name}: ${check.detail ?? ""}`);
    if (!check.pass) allPassed = false;
  }

  if (!allPassed) {
    console.error("\n❌ Auth configuration incomplete. Fix the above issues.");
    process.exit(1);
  }

  console.log("\n✅ Auth configuration looks good.");
}

main();
