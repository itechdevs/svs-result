# Project Constitution

> **Law**: This file is the single source of truth. All code must conform to what is written here.
> Update this file before changing schemas, rules, or architecture.

---

## 1. North Star

> _[FILL IN: What is the singular desired outcome of this application?]_

---

## 2. Data Schema

### Database Tables

```ts
// Example — replace with your domain entities
// users table is auto-managed by next-auth + drizzle-adapter
```

### API Request / Response Shapes

```ts
// Define all TypeScript interfaces here before coding routes
// Example:
// interface CreateListingRequest { title: string; description: string; price: number }
// interface ListingResponse { id: string; title: string; createdAt: string }
```

### Auth Roles & Permission Matrix

| Role    | Create | Read | Update | Delete |
| ------- | ------ | ---- | ------ | ------ |
| `admin` | ✅     | ✅   | ✅     | ✅     |
| `user`  | ✅     | ✅   | own    | own    |
| `guest` | ❌     | ✅   | ❌     | ❌     |

---

## 3. Architectural Invariants

- Server Components by default — `"use client"` only when required
- All mutations via Server Actions validated with Zod before any DB call
- No hardcoded colors — only CSS variables from `globals.css`
- No magic strings — use `lib/constants.ts`
- No raw SQL — Drizzle ORM parameterized queries only
- Soft-delete only for user-facing data (`deletedAt` timestamp)
- Every table has: `id`, `createdAt`, `updatedAt`
- Every route segment has `loading.tsx` + `error.tsx`
- Every page exports `generateMetadata()`

---

## 4. Environment Variable Registry

```
# App
NEXT_PUBLIC_APP_URL=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Add project-specific vars below
```

---

## 5. External Integrations

| Service | Purpose | Status |
| ------- | ------- | ------ |
| _TBD_   | _TBD_   | ❌     |
