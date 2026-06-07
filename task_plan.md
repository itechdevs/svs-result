# B.L.A.S.T. Task Plan

## Gates — Must Pass Before Each Phase

| Gate              | Check                                                                    | Status |
| ----------------- | ------------------------------------------------------------------------ | ------ |
| Before Phase 1    | project.md, task_plan.md, findings.md, progress.md created              | ✅     |
| Before Phase 2    | All 5 Discovery Questions answered, schema approved                      | ⬜     |
| Before Phase 3    | All handshake scripts pass, .env.example complete                        | ⬜     |
| Before Phase 4    | All routes have loading.tsx + error.tsx, all forms validated             | ⬜     |
| Before Phase 5    | next build clean, security headers set, migrations tested                | ⬜     |
| After Deploy      | Smoke tests pass, progress.md updated                                    | ⬜     |

---

## Phase 1 — B · Blueprint

- [ ] Answer all 5 Discovery Questions
- [ ] Define complete data schema in project.md
- [ ] Define API I/O shapes as TypeScript interfaces
- [ ] Define auth roles & permission matrix
- [ ] List all environment variables
- [ ] Document external integrations
- [ ] Research relevant starter patterns

---

## Phase 2 — L · Link

- [ ] Create `.env.local` and `.env.example`
- [ ] Run `scripts/verify/db-ping.ts` — passes
- [ ] Run `scripts/verify/auth-ping.ts` — passes
- [ ] Run `scripts/verify/storage-ping.ts` — passes (if applicable)
- [ ] Drizzle schema files created per domain entity
- [ ] First migration generated and applied

---

## Phase 3 — A · Architect

- [ ] SOP docs written in `docs/architecture/<domain>.md`
- [ ] App Router structure matches `project.md` schema
- [ ] All API routes created with Zod validation
- [ ] Server Actions created for all mutations
- [ ] Custom hooks created for all repeated stateful logic
- [ ] Auth middleware protecting private routes
- [ ] Rate limiting on public API routes
- [ ] All pages export `generateMetadata()`
- [ ] Every route segment has `loading.tsx` and `error.tsx`

---

## Phase 4 — S · Stylize

- [ ] Design tokens set in `globals.css` (:root + .dark)
- [ ] Shared layout components: Navbar, Sidebar, Footer
- [ ] ThemeToggle component + next-themes wired up
- [ ] All forms use react-hook-form + shadcn Form
- [ ] All tables use shadcn Table with sort/filter/pagination
- [ ] All loading states use Skeleton components
- [ ] EmptyState component created and used everywhere
- [ ] Mobile-first responsive review at 320px
- [ ] Accessibility audit (keyboard nav, alt text, semantic HTML)
- [ ] UI presented to user for review

---

## Phase 5 — T · Trigger

- [ ] `next build` succeeds — zero errors, zero type errors
- [ ] All .env.example variables set in deployment env
- [ ] Production DB migrations applied
- [ ] Security headers configured in `next.config.ts`
- [ ] robots.txt and sitemap generated
- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Deployed to Vercel
- [ ] Smoke tests pass on production
- [ ] progress.md updated with deployment record
