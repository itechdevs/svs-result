# Fix: Duplicate /api in Marksheet API Path

## Issue
**Error**: 404 Not Found when generating secondary marksheets

**Request URL**: `http://localhost:3000/api/api/admin/secondary/marksheets`

**Expected URL**: `http://localhost:3000/api/admin/secondary/marksheets`

## Root Cause
The `apiClient` from `src/lib/api-client.ts` is configured with `baseURL: "/api"`. This means all API calls automatically prepend `/api` to the path.

When calling:
```typescript
apiClient.post("/api/admin/secondary/marksheets", body)
```

The actual URL becomes:
```
/api + /api/admin/secondary/marksheets = /api/api/admin/secondary/marksheets
```

## Solution
Remove the `/api` prefix from the endpoint path when using `apiClient`:

**Before**:
```typescript
apiClient.post("/api/admin/secondary/marksheets", body)
```

**After**:
```typescript
apiClient.post("/admin/secondary/marksheets", body)
```

## Files Modified
- `src/app/(admin)/admin/secondary/result-compilation/page.tsx`

## Verification
✅ TypeScript compilation passed  
✅ No other instances of duplicate `/api` found in codebase

## Prevention
When using `apiClient`, always omit the `/api` prefix:

### ✅ Correct
```typescript
apiClient.get("/admin/dashboard")
apiClient.post("/admin/secondary/marks")
apiClient.patch("/teacher/evaluation-plans/123")
```

### ❌ Incorrect
```typescript
apiClient.get("/api/admin/dashboard")  // Results in /api/api/admin/dashboard
apiClient.post("/api/admin/secondary/marks")
```

## Related Files
- `src/lib/api-client.ts` - apiClient configuration with baseURL
- `src/app/(admin)/admin/secondary/result-compilation/page.tsx` - Fixed marksheet generation

## Testing
After this fix, the marksheet generation API should work correctly:

1. Navigate to Admin > Secondary > Result Compilation
2. Compile term results
3. Publish term results
4. Click "Generate Marksheet" button
5. Should successfully create marksheet record without 404 error
