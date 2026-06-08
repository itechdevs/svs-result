# Design System & Architecture Guide

> **Directive for AI code generation**: This document is the single source of truth for all frontend decisions. Follow every rule here strictly. Do not deviate, invent alternatives, or introduce patterns not described below.

---

## 1. Styling — Global CSS is Law

**Rule**: All visual tokens (colors, spacing, radius, shadows, typography) MUST come from `globals.css` CSS custom properties. No hardcoded values anywhere.

### ✅ Correct

```tsx
// Use Tailwind utility classes that map to CSS variables
<div className="bg-background text-foreground border border-border rounded-lg shadow-sm" />

// Or raw CSS variables in inline styles / CSS modules when Tailwind class doesn't exist
<div style={{ color: 'var(--muted-foreground)' }} />
```

### ❌ Forbidden

```tsx
// Never hardcode colors, spacing, or radius
<div style={{ color: '#888', borderRadius: '8px', background: 'white' }} />
<div className="text-[#333] bg-[#fff] rounded-[12px]" />
```

### Available CSS Variable Groups (from `globals.css`)

| Group                  | Variables                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Background/Surface** | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`                    |
| **Brand**              | `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`                                          |
| **Neutral**            | `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`                                                    |
| **Semantic**           | `--destructive`, `--border`, `--input`, `--ring`                                                                      |
| **Charts**             | `--chart-1` through `--chart-5`                                                                                       |
| **Sidebar**            | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`    |
| **Shadows**            | `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl` |
| **Typography**         | `--font-heading` (Geist), `--font-body` (Source Serif 4), `--font-mono` (Source Code Pro)                             |
| **Radius**             | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-4xl`            |

### Dark Mode

Dark mode is handled automatically via the `.dark` class on `<html>`. Never write manual dark mode overrides for colors — the CSS variables already switch. Use `dark:` Tailwind variants only for structural/layout differences, not color.

---

## 2. Folder Structure

Every feature lives in its own folder under `src/features/`. Shared infrastructure lives in `src/shared/`. There is no other location for code.

```
src/
├── app/                          # Next.js App Router pages and layouts only
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
│       └── [feature]/
│           └── page.tsx          # Thin shell — imports feature root only
│
├── features/                     # One folder per product feature
│   └── [feature-name]/
│       ├── index.ts              # Public API — only export from here
│       ├── [FeatureName].tsx     # Feature root component (composes sub-components)
│       ├── components/           # Private sub-components for this feature only
│       │   ├── [FeatureHeader].tsx
│       │   ├── [FeatureFilters].tsx
│       │   └── [FeatureTable].tsx
│       ├── hooks/                # TanStack Query hooks for this feature
│       │   ├── use-[entity].ts
│       │   └── use-[entity]-mutation.ts
│       ├── columns/              # TanStack Table column definitions
│       │   └── [entity]-columns.tsx
│       ├── schemas/              # Zod schemas + TypeScript types
│       │   └── [entity].schema.ts
│       └── api/                  # Raw fetch/axios calls (no business logic)
│           └── [entity].api.ts
│
├── shared/
│   ├── components/               # Reusable UI components (no feature logic)
│   │   ├── ui/                   # shadcn/ui primitives (DO NOT MODIFY)
│   │   ├── data-table/           # Generic TanStack Table wrapper
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataTableToolbar.tsx
│   │   │   ├── DataTablePagination.tsx
│   │   │   ├── DataTableColumnHeader.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── PageHeader.tsx
│   │   │   ├── PageShell.tsx
│   │   │   └── Sidebar.tsx
│   │   └── feedback/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/                    # Non-feature-specific hooks
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── lib/                      # Pure utilities
│   │   ├── query-client.ts       # TanStack Query client singleton
│   │   ├── axios.ts              # Axios instance with interceptors
│   │   └── utils.ts              # cn(), formatters, etc.
│   └── types/                    # Global TypeScript types
│       └── api.types.ts
│
└── globals.css                   # Source of truth for all design tokens
```

### Rules

- A feature's `components/`, `hooks/`, `columns/`, `api/` folders are **private**. Other features must not import from them.
- Cross-feature sharing is only allowed by promoting code to `src/shared/`.
- Page files in `app/` are thin shells — they import the feature root and nothing else.
- Re-export everything through `features/[name]/index.ts`.

---

## 3. Component Splitting Rules

**Rule**: One component = one file. No full page components written inline. Decompose aggressively.

### Decomposition Checklist

Split a component into a child when any of these are true:

- It renders a distinct visual section (header, toolbar, empty state, row actions)
- It has its own local state
- It can be meaningfully named on its own
- It exceeds ~80 lines of JSX

### Example: `features/books/`

```
books/
├── index.ts
├── BooksPage.tsx            ← layout shell only; composes the below
├── components/
│   ├── BooksHeader.tsx      ← title, add button
│   ├── BooksToolbar.tsx     ← search input, filters, export
│   ├── BooksTable.tsx       ← uses shared DataTable + books columns
│   ├── BooksRowActions.tsx  ← dropdown menu per row
│   └── BookFormDialog.tsx   ← add/edit modal
├── hooks/
│   ├── use-books.ts
│   └── use-book-mutation.ts
├── columns/
│   └── books-columns.tsx
├── schemas/
│   └── book.schema.ts
└── api/
    └── books.api.ts
```

### ❌ Never Do This

```tsx
// BooksPage.tsx — BAD: everything in one file
export function BooksPage() {
  // 300 lines of JSX with inline table, filters, dialogs...
}
```

---

## 4. TanStack Query — Data Fetching Hooks

All server state lives in TanStack Query hooks. No raw `useEffect` + `useState` for data fetching.

### Hook File Naming

```
use-[entity].ts          → reads  (useQuery / useInfiniteQuery)
use-[entity]-mutation.ts → writes (useMutation)
```

### Standard Query Hook Pattern

```ts
// features/books/hooks/use-books.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBooks } from "../api/books.api";
import type { BooksFilters } from "../schemas/book.schema";

export const bookKeys = {
  all: () => ["books"] as const,
  lists: () => [...bookKeys.all(), "list"] as const,
  list: (filters: BooksFilters) => [...bookKeys.lists(), filters] as const,
  detail: (id: string) => [...bookKeys.all(), "detail", id] as const,
};

export function useBooks(filters: BooksFilters) {
  return useQuery({
    queryKey: bookKeys.list(filters),
    queryFn: () => fetchBooks(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => fetchBookById(id),
    enabled: !!id,
  });
}
```

### Standard Mutation Hook Pattern

```ts
// features/books/hooks/use-book-mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBook, updateBook, deleteBook } from "../api/books.api";
import { bookKeys } from "./use-books";

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBook,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
```

### Rules

- Query keys use the **key factory pattern** (as shown above). No inline string arrays.
- All API calls go through `features/[name]/api/` — never call `fetch`/`axios` directly in hooks.
- Error and loading states are handled in the component, not inside the hook.
- `enabled` flag must be used whenever a query depends on a value that might be undefined.

---

## 5. TanStack Table — Column Definitions & Table Usage

### Column Definition File

```tsx
// features/books/columns/books-columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/shared/components/data-table";
import { BooksRowActions } from "../components/BooksRowActions";
import type { Book } from "../schemas/book.schema";

export const booksColumns: ColumnDef<Book>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.getValue("title")}
      </span>
    ),
  },
  {
    accessorKey: "author",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
  },
  {
    accessorKey: "isbn",
    header: "ISBN",
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
    filterFn: "equals",
  },
  {
    id: "actions",
    cell: ({ row }) => <BooksRowActions book={row.original} />,
    enableHiding: false,
  },
];
```

### Using the Shared DataTable

```tsx
// features/books/components/BooksTable.tsx
import { DataTable } from "@/shared/components/data-table";
import { useBooks } from "../hooks/use-books";
import { booksColumns } from "../columns/books-columns";

interface BooksTableProps {
  filters: BooksFilters;
}

export function BooksTable({ filters }: BooksTableProps) {
  const { data, isLoading, isError } = useBooks(filters);

  return (
    <DataTable
      columns={booksColumns}
      data={data?.items ?? []}
      isLoading={isLoading}
      isError={isError}
      pageCount={data?.pageCount}
    />
  );
}
```

### Shared DataTable Component Contract

The `shared/components/data-table/DataTable.tsx` generic component must accept:

```ts
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  pageCount?: number; // for server-side pagination
  toolbar?: React.ReactNode; // slot for feature-specific toolbar
}
```

### Rules

- Column definitions live in `columns/` — never inline them inside a component.
- Server-side sorting/filtering state is lifted to the feature root and passed as props.
- The shared `DataTable` handles skeleton loading and empty states via the `feedback/` components.
- Never write a custom table with `<table>` HTML elements — always use the shared `DataTable`.

---

## 6. Shared Components — Usage Rules

### `shared/components/ui/` — shadcn/ui Primitives

- **Do not modify** files in `ui/`. Extend by wrapping.
- Always import from `@/shared/components/ui/[component]`.
- Compose complex UI using primitives — never reinvent `Button`, `Dialog`, `Badge`, etc.

### `shared/components/data-table/` — Table Infrastructure

- `DataTable` — generic table shell with loading/error/empty handling
- `DataTableToolbar` — search input + filter dropdowns + column visibility toggle
- `DataTablePagination` — page size selector + prev/next controls
- `DataTableColumnHeader` — sortable column header with chevron indicator

### `shared/components/layout/` — Page Structure

```tsx
// Every page uses PageShell + PageHeader
export function BooksPage() {
  return (
    <PageShell>
      <PageHeader
        title="Books"
        description="Manage your library catalogue"
        action={<AddBookButton />}
      />
      <BooksToolbar />
      <BooksTable />
    </PageShell>
  );
}
```

### `shared/components/feedback/`

- `<LoadingSpinner />` — centered spinner with accessible label
- `<EmptyState icon prose cta />` — zero-data placeholder
- `<ErrorBoundary fallback />` — wraps feature roots

### Rules

- Prefer shared components over reimplementing. Check `shared/` before writing a new component.
- If a shared component needs a new variant, add the variant there — do not duplicate.
- Feature-specific styling goes in the feature component, not in the shared component.

---

## 7. TypeScript & Schema Rules

### Zod Schemas Define All Types

```ts
// features/books/schemas/book.schema.ts
import { z } from "zod";

export const BookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().regex(/^\d{13}$/),
  status: z.enum(["available", "borrowed", "reserved"]),
  addedAt: z.string().datetime(),
});

export const BooksFiltersSchema = z.object({
  search: z.string().optional(),
  status: BookSchema.shape.status.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Derive types from schemas — never write duplicate interfaces
export type Book = z.infer<typeof BookSchema>;
export type BooksFilters = z.infer<typeof BooksFiltersSchema>;
```

### Rules

- All API response types are derived from Zod schemas with `z.infer<>`.
- Validate API responses at the boundary in `api/` files using `.parse()`.
- No `any`. Use `unknown` and narrow with Zod or type guards.
- All component props are typed with explicit interfaces.

---

## 8. API Layer Rules

```ts
// features/books/api/books.api.ts
import { axiosInstance } from "@/shared/lib/axios";
import { BookSchema, BooksFiltersSchema } from "../schemas/book.schema";
import { z } from "zod";

const PagedBooksSchema = z.object({
  items: z.array(BookSchema),
  total: z.number(),
  pageCount: z.number(),
});

export async function fetchBooks(filters: BooksFilters) {
  const params = BooksFiltersSchema.parse(filters);
  const { data } = await axiosInstance.get("/books", { params });
  return PagedBooksSchema.parse(data); // validate at boundary
}

export async function fetchBookById(id: string) {
  const { data } = await axiosInstance.get(`/books/${id}`);
  return BookSchema.parse(data);
}

export async function createBook(payload: Omit<Book, "id" | "addedAt">) {
  const { data } = await axiosInstance.post("/books", payload);
  return BookSchema.parse(data);
}
```

### Rules

- API functions are plain async functions — no classes, no service objects.
- Every function validates its return value with a Zod schema.
- No business logic in API files — just HTTP and schema validation.
- Use the shared `axiosInstance` from `shared/lib/axios.ts` for all requests.

---

## 9. File & Naming Conventions

| Thing             | Convention                                                    | Example                    |
| ----------------- | ------------------------------------------------------------- | -------------------------- |
| Components        | PascalCase                                                    | `BooksTable.tsx`           |
| Hooks             | camelCase with `use-` prefix                                  | `use-books.ts`             |
| API files         | kebab-case with `.api.ts` suffix                              | `books.api.ts`             |
| Schema files      | kebab-case with `.schema.ts` suffix                           | `book.schema.ts`           |
| Column files      | kebab-case with `-columns.tsx` suffix                         | `books-columns.tsx`        |
| Utility functions | camelCase                                                     | `formatDate`               |
| Types/interfaces  | PascalCase                                                    | `Book`, `BooksFilters`     |
| Feature folders   | kebab-case                                                    | `features/book-inventory/` |
| CSS classes       | Tailwind only — no custom class names unless in `globals.css` |

---

## 10. Anti-Pattern Reference

| ❌ Anti-Pattern                          | ✅ Correct Approach                      |
| ---------------------------------------- | ---------------------------------------- |
| Hardcoded color values                   | CSS variables from `globals.css`         |
| `useEffect` + `useState` for server data | TanStack Query hook                      |
| Inline column definitions                | `columns/[entity]-columns.tsx`           |
| Feature importing from another feature   | Promote to `shared/`                     |
| Full page in one component file          | Split into `components/` sub-components  |
| `any` types                              | Zod schemas + `z.infer<>`                |
| Raw `fetch` in components or hooks       | API function in `api/[entity].api.ts`    |
| Custom `<table>` HTML                    | Shared `DataTable` component             |
| Duplicate query key strings              | Key factory pattern in `use-[entity].ts` |
| Modifying `shared/components/ui/`        | Wrap and extend                          |
| Writing dark mode color overrides        | Let CSS variable switching handle it     |

---

## 11. Quick Reference Checklist

Before submitting any code, verify:

- [ ] All colors/spacing/radius use CSS variables or Tailwind classes mapped to them
- [ ] No hardcoded values (`#hex`, `rgb()`, `px` pixel sizes for spacing)
- [ ] Feature folder has the correct sub-folder structure
- [ ] No component exceeds ~80 lines of JSX without splitting
- [ ] Data fetching uses a TanStack Query hook in `hooks/`
- [ ] Mutations use a separate `use-[entity]-mutation.ts` hook
- [ ] Query keys use the key factory pattern
- [ ] Table column definitions are in `columns/[entity]-columns.tsx`
- [ ] Table renders using shared `DataTable`
- [ ] Types are derived from Zod schemas with `z.infer<>`
- [ ] API calls go through `api/[entity].api.ts` with response validation
- [ ] Shared components are used before writing new ones
- [ ] Feature exports only through `index.ts`
- [ ] Page file in `app/` is a thin shell
