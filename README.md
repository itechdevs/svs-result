# B.L.A.S.T. Next.js Boilerplate

> **Blueprint → Link → Architect → Stylize → Trigger**  
> Production-grade Next.js boilerplate following the B.L.A.S.T. protocol and A.N.T. 3-layer architecture.

---

## Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Framework     | Next.js 15 (App Router, Turbopack) |
| Language      | TypeScript 5 (strict mode)         |
| Styling       | Tailwind CSS v4 + shadcn/ui        |
| Database      | PostgreSQL via Prisma ORM          |
| Auth          | NextAuth v5 (JWT + Prisma adapter) |
| Forms         | React Hook Form + Zod              |
| Data Fetching | TanStack React Query v5            |
| State         | nuqs (URL state) + React built-ins |
| Theming       | next-themes (light/dark/system)    |

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url> my-app
cd my-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Run verification scripts

```bash
npm run verify:db    # Confirm database connects
npm run verify:auth  # Confirm auth env vars are set
```

### 4. Run migrations

```bash
npm run db:generate  # Generate migration from schema
npm run db:migrate   # Apply migration to database
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Memory Files

| File           | Purpose                                    |
| -------------- | ------------------------------------------ |
| `project.md`   | Project Constitution — schema, rules, env  |
| `task_plan.md` | B.L.A.S.T. phase checklist                 |
| `findings.md`  | Research discoveries and API gotchas       |
| `progress.md`  | Build log — what was built and what failed |

> **Before writing any feature code**: answer the 5 Discovery Questions in `project.md`.

---

## Available Scripts

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run db:generate  # Create and apply new migration (dev)
npm run db:migrate   # Apply pending migrations (CI/prod)
npm run db:studio    # Prisma Studio GUI
npm run db:push      # Push schema to DB without migration
npm run verify:db    # Ping database
npm run verify:auth  # Check auth env vars
npm run analyze      # Bundle size analysis
```

---

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, register — no auth required
│   ├── (dashboard)/     # Auth-gated routes with Navbar + Sidebar
│   ├── api/             # API route handlers
│   └── layout.tsx       # Root layout (ThemeProvider, QueryProvider)
├── components/
│   ├── ui/              # shadcn/ui primitives (do not edit)
│   ├── common/          # Navbar, Sidebar, ThemeToggle, EmptyState
│   └── features/        # Feature-colocated components
├── hooks/               # use-current-user, use-debounce, use-media-query
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── constants.ts     # No magic values anywhere else
│   ├── utils.ts         # cn(), formatters
│   └── validations/     # Zod schemas per domain
├── db/
│   ├── index.ts         # Prisma client singleton
│   └── schema/          # Prisma type re-exports
└── types/               # Shared TypeScript types
```

---

## Key Rules (enforced by B.L.A.S.T.)

1. **Data-First** — define schema in `project.md` before writing any feature code
2. **No Magic Values** — all constants in `lib/constants.ts`, all colors in `globals.css`
3. **Zod on Everything** — every API route and Server Action validates input first
4. **Soft Delete Only** — never hard-delete user-facing data (`deletedAt` timestamp)
5. **SOPs First** — update `docs/architecture/<domain>.md` before changing code

---

## Adding a New Domain Entity

1. Add model definition to `prisma/schema.prisma`
2. Run `npm run db:generate && npm run db:migrate`
3. Add Zod schema to `src/lib/validations/<entity>.ts`
4. Add TypeScript types to `src/types/index.ts`
5. Write SOP in `docs/architecture/<entity>.md` (copy `_template.md`)
6. Build API route, Server Action, hooks, and components

---

## Deployment

```bash
vercel --prod
```

Pre-deployment checklist is in `task_plan.md` under Phase 5.
