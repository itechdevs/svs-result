# Architecture SOP — [Domain Name]

> **Golden Rule**: If logic changes, update this SOP *before* updating code.

---

## Goal

_What does this domain accomplish? What user-facing problem does it solve?_

---

## Database Tables

| Table  | Description       |
| ------ | ----------------- |
| `name` | What it stores    |

---

## API Routes

| Method | Path              | Auth Required | Description          |
| ------ | ----------------- | ------------- | -------------------- |
| GET    | `/api/[domain]`   | ✅ user        | List all items       |
| POST   | `/api/[domain]`   | ✅ user        | Create a new item    |
| GET    | `/api/[domain]/[id]` | ✅ user    | Get one item         |
| PATCH  | `/api/[domain]/[id]` | ✅ user    | Update one item      |
| DELETE | `/api/[domain]/[id]` | ✅ user    | Soft-delete one item |

---

## Access Control

| Action | `admin` | `user` | `guest` |
| ------ | ------- | ------ | ------- |
| Create | ✅      | ✅     | ❌      |
| Read   | ✅      | own    | ❌      |
| Update | ✅      | own    | ❌      |
| Delete | ✅      | own    | ❌      |

---

## Edge Cases & "Do Not" Rules

- ❌ Do NOT hard-delete records — use `deletedAt` soft delete
- ❌ Do NOT expose other users' data — always filter by `userId`
- ⚠️  Edge case: _[describe specific edge case]_

---

## Change Log

| Date       | What changed       | Why |
| ---------- | ------------------ | --- |
| YYYY-MM-DD | Initial SOP created | — |
