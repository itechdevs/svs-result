# Architecture SOP — Auth

> **Golden Rule**: If logic changes, update this SOP *before* updating code.

---

## Goal

Provide secure, session-based authentication using NextAuth v5. Support OAuth providers (GitHub, Google) and optionally credentials. Protect all `/dashboard` routes.

---

## Database Tables

| Table                 | Description                              |
| --------------------- | ---------------------------------------- |
| `users`               | User accounts; includes `role` field     |
| `accounts`            | Linked OAuth provider accounts           |
| `sessions`            | Active user sessions                     |
| `verification_tokens` | Email verification and magic link tokens |
| `authenticators`      | WebAuthn passkey credentials (optional)  |

---

## API Routes

| Method | Path                       | Auth Required | Description            |
| ------ | -------------------------- | ------------- | ---------------------- |
| GET/POST | `/api/auth/[...nextauth]` | ❌            | NextAuth handler       |

---

## Flow

1. User visits `/login` → clicks provider button → redirected to OAuth provider
2. OAuth callback hits `/api/auth/callback/[provider]`
3. NextAuth creates/updates `users` + `accounts` rows via Drizzle adapter
4. JWT issued with `id` and `role`; stored in HTTP-only cookie
5. Middleware checks JWT on every request to `/dashboard/**`
6. Server components call `auth()` directly for data fetching

---

## Access Control

- `middleware.ts` is the primary auth guard — protects all `/dashboard` routes
- `app/(dashboard)/layout.tsx` has a belt-and-suspenders `redirect()` fallback
- Never rely solely on UI guards

---

## Edge Cases & "Do Not" Rules

- ❌ Do NOT store OAuth tokens in client-accessible storage
- ❌ Do NOT return passwords or tokens in API responses
- ❌ Do NOT skip Zod validation on credentials sign-in
- ⚠️  `NEXTAUTH_SECRET` must be ≥ 32 characters in production
- ⚠️  Set `NEXTAUTH_URL` to the exact canonical production URL

---

## Change Log

| Date       | What changed        | Why              |
| ---------- | ------------------- | ---------------- |
| YYYY-MM-DD | Initial SOP created | Boilerplate init |
