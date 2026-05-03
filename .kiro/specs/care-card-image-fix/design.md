# Care Card Image Fix — Bugfix Design

## Overview

The Expo app's care card never displays the person's avatar photo because the database stores relative paths (e.g., `/people/sabawoon-hakimi.png`) which React Native's `Image` component cannot resolve on mobile. The Next.js webapp works because it resolves relative paths against the server origin automatically. The fix introduces a `resolveAvatarUrl()` utility that converts relative paths to absolute URLs using a configured base URL, while passing through absolute URLs, data URIs, and null values unchanged.

## Glossary

- **Bug_Condition (C)**: The avatar string is a relative path — starts with `/` but not `//` — which React Native's `Image` component cannot load
- **Property (P)**: Relative avatar paths are resolved to absolute URLs before being passed to the `Image` component, so the photo loads correctly
- **Preservation**: Absolute URLs, data URIs, null values, and empty strings continue to behave exactly as before the fix
- **`isValidAvatarUrl()`**: The function in `expo_app/App.tsx` that validates whether an avatar string is renderable — currently accepts relative paths that React Native cannot load
- **`resolveAvatarUrl()`**: The new function that will convert relative paths to absolute URLs using a base URL
- **`mapLiveData()`**: The function in `expo_app/App.tsx` that transforms raw `CarePersonRow` data into the `ElderProfile` used by the UI
- **`EXPO_PUBLIC_WEBAPP_URL`**: New environment variable holding the webapp's base URL (e.g., `https://your-app.vercel.app`) used to resolve relative avatar paths

## Bug Details

### Bug Condition

The bug manifests when the `avatar` field from the `care_people` database table contains a relative path (e.g., `/people/sabawoon-hakimi.png`). The `mapLiveData()` function passes this relative path through to `ElderProfile.avatar`. Then `isValidAvatarUrl()` returns `true` (because the regex `^(https?:\/\/|data:image\/|\/)` matches the leading `/`), causing the `Image` component to receive `source={{ uri: "/people/sabawoon-hakimi.png" }}`. On mobile, this URI has no host to resolve against, so the image fails to load silently and the user sees only initials.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { avatar: string | null }
  OUTPUT: boolean

  RETURN input.avatar IS NOT NULL
     AND input.avatar IS NOT empty string
     AND input.avatar starts with "/"
     AND input.avatar does NOT start with "//"
END FUNCTION
```

### Examples

- `avatar = "/people/sabawoon-hakimi.png"` → Bug: Image receives `uri: "/people/sabawoon-hakimi.png"`, fails to load on mobile. **Expected after fix:** Image receives `uri: "https://<webapp-host>/people/sabawoon-hakimi.png"`, photo displays.
- `avatar = "/brand/elsa-icon.png"` → Bug: Same failure pattern. **Expected after fix:** Resolved to `"https://<webapp-host>/brand/elsa-icon.png"`.
- `avatar = "https://example.com/photo.jpg"` → No bug: Already absolute, loads correctly. **Expected after fix:** Unchanged.
- `avatar = null` → No bug: Initials fallback displays. **Expected after fix:** Unchanged.
- `avatar = "data:image/svg+xml;utf8,..."` → No bug: Data URI renders directly. **Expected after fix:** Unchanged.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Absolute URLs (`https://...` or `http://...`) passed to the `Image` component must continue to work exactly as before
- Data URIs (`data:image/...`) must continue to render directly without modification
- Null or empty-string avatars must continue to trigger the initials fallback via `isValidAvatarUrl()` returning `false`
- All non-avatar fields in `ElderProfile` (name, age, heartRate, steps, etc.) must remain unchanged
- The `CareView` component structure (HeartMonitor, metricGrid, fallRiskCard, profileStats) must remain unchanged
- The `mapLiveData()` function's mapping of all other fields must remain unchanged

**Scope:**
All inputs where the avatar is NOT a relative path should be completely unaffected by this fix. This includes:
- Absolute HTTP/HTTPS URLs
- Data URIs
- Null values
- Empty strings
- Protocol-relative URLs (starting with `//`)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing URL Resolution Layer**: The Expo app has no mechanism to resolve relative paths to absolute URLs. The Next.js webapp doesn't need one because the browser resolves `/people/sabawoon-hakimi.png` against the current page origin. React Native has no equivalent behavior — a URI must be fully qualified to be loadable.

2. **Overly Permissive Validation**: `isValidAvatarUrl()` uses the regex `^(https?:\/\/|data:image\/|\/)` which matches relative paths starting with `/`. This is correct for the webapp (where `/` paths work) but incorrect for React Native (where they don't). The validation passes, so the app attempts to render an `Image` with an unresolvable URI instead of falling back to initials.

3. **No Base URL Configuration**: The Expo app's `.env` file contains Supabase credentials but no webapp base URL. There is no `EXPO_PUBLIC_WEBAPP_URL` or equivalent variable that could be used to construct absolute URLs from relative paths.

4. **Silent Failure**: React Native's `Image` component fails silently when given an unresolvable URI — no error is thrown, no fallback is triggered. The avatar area simply shows nothing (or the initials fallback if `isValidAvatarUrl` had returned `false`, which it doesn't for relative paths).

## Correctness Properties

Property 1: Bug Condition — Relative Paths Resolved to Absolute URLs

_For any_ avatar string where the bug condition holds (starts with `/` but not `//`), the `resolveAvatarUrl` function SHALL return an absolute URL that starts with the configured base URL followed by the original relative path, producing a fully-qualified URL that React Native's `Image` component can load.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Relative Inputs Unchanged

_For any_ avatar input where the bug condition does NOT hold (absolute URLs, data URIs, null, empty strings, protocol-relative URLs), the `resolveAvatarUrl` function SHALL return the input unchanged (or null for null/empty inputs), preserving all existing behavior for non-relative avatar values.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `expo_app/.env`

**Change**: Add webapp base URL environment variable

1. **Add `EXPO_PUBLIC_WEBAPP_URL`**: Add a new environment variable pointing to the webapp's origin (e.g., `EXPO_PUBLIC_WEBAPP_URL=https://your-app.vercel.app`). This is the base URL prepended to relative avatar paths.

---

**File**: `expo_app/App.tsx`

**Function**: New `resolveAvatarUrl()` + modification to `mapLiveData()`

**Specific Changes**:

1. **Add `WEBAPP_BASE_URL` constant**: Read `EXPO_PUBLIC_WEBAPP_URL` from environment variables, similar to how `SUPABASE_URL` is already read. Provide a sensible fallback (empty string) so the app doesn't crash if the variable is missing.

2. **Create `resolveAvatarUrl()` function**: A pure function that takes a raw avatar string and returns a resolved URL or null:
   - If the input is null or empty → return `null`
   - If the input starts with `http://` or `https://` → return as-is (already absolute)
   - If the input starts with `data:image/` → return as-is (data URI)
   - If the input starts with `//` → return as-is (protocol-relative URL)
   - If the input starts with `/` → prepend `WEBAPP_BASE_URL` and return
   - Otherwise → return `null` (unrecognized format, fall back to initials)

3. **Update `mapLiveData()` avatar mapping**: Change `avatar: person.avatar ?? null` to `avatar: resolveAvatarUrl(person.avatar)` so that relative paths are resolved before reaching the UI layer.

4. **No changes to `isValidAvatarUrl()`**: The existing validation function remains correct — after resolution, all avatar strings reaching it will be either absolute URLs, data URIs, or null. The `/` prefix case in the regex becomes a no-op (relative paths are resolved before validation).

5. **No changes to `CareView`**: The component already correctly uses `isValidAvatarUrl()` and renders `Image` with `source={{ uri: elder.avatar }}`. After the fix, `elder.avatar` will contain a fully-qualified URL for relative paths.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that verify `resolveAvatarUrl()` correctly resolves relative paths. On unfixed code (where `resolveAvatarUrl` doesn't exist yet), these tests confirm the absence of the resolution layer. The existing `care-card-bug-condition.test.ts` already validates structural defects via source inspection.

**Test Cases**:
1. **Relative Path Resolution**: Given `avatar = "/people/sabawoon-hakimi.png"` and a base URL, assert the output is `"https://<base>/people/sabawoon-hakimi.png"` (will fail on unfixed code — function doesn't exist)
2. **Nested Relative Path**: Given `avatar = "/brand/elsa-icon.png"`, assert resolution produces a valid absolute URL (will fail on unfixed code)
3. **mapLiveData Integration**: Verify that `mapLiveData()` calls `resolveAvatarUrl()` on the avatar field (will fail on unfixed code — no resolution call)
4. **Missing Base URL**: Given a relative path but no base URL configured, assert graceful degradation (returns the relative path or null)

**Expected Counterexamples**:
- `resolveAvatarUrl` function does not exist in unfixed code
- `mapLiveData()` passes `person.avatar` through without resolution
- Relative paths reach `Image` component as-is, failing to load

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := resolveAvatarUrl(input.avatar, baseUrl)
  ASSERT result starts with baseUrl
  ASSERT result ends with input.avatar
  ASSERT result is a valid absolute URL
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original behavior.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT resolveAvatarUrl(input.avatar) preserves original value
  // Absolute URLs → returned unchanged
  // Data URIs → returned unchanged
  // null → returns null
  // empty string → returns null
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random absolute URLs and data URIs to verify they pass through unchanged
- It catches edge cases like URLs with unusual characters, ports, or query strings
- It provides strong guarantees that no non-buggy input is accidentally modified

**Test Plan**: The existing `care-card-preservation.test.ts` validates structural preservation via source inspection. Additional property-based tests should generate random non-relative avatar values and assert `resolveAvatarUrl` returns them unchanged.

**Test Cases**:
1. **Absolute URL Preservation**: Generate random `https://...` URLs and verify `resolveAvatarUrl` returns them unchanged
2. **Data URI Preservation**: Generate random `data:image/...` strings and verify they pass through unchanged
3. **Null Preservation**: Verify `resolveAvatarUrl(null)` returns `null`
4. **Empty String Preservation**: Verify `resolveAvatarUrl("")` returns `null`
5. **Protocol-Relative URL Preservation**: Verify `resolveAvatarUrl("//cdn.example.com/photo.jpg")` returns it unchanged

### Unit Tests

- Test `resolveAvatarUrl()` with each input category: relative path, absolute URL, data URI, null, empty string, protocol-relative URL
- Test `resolveAvatarUrl()` with missing/empty base URL configuration
- Test `resolveAvatarUrl()` with relative paths containing special characters or query strings
- Test that `mapLiveData()` output contains resolved avatar URLs

### Property-Based Tests

- Generate random relative paths (starting with `/`) and verify resolution produces valid absolute URLs with the base URL prefix
- Generate random absolute URLs and verify they pass through `resolveAvatarUrl` unchanged
- Generate random non-relative avatar strings and verify preservation of original values
- Generate random `ElderProfile`-like inputs and verify all non-avatar fields are unaffected by the fix

### Integration Tests

- Test full data flow: `CarePersonRow` with relative avatar → `mapLiveData()` → `ElderProfile` with absolute avatar URL
- Test `CareView` rendering with a resolved absolute avatar URL (Image component receives valid URI)
- Test `CareView` rendering with null avatar (initials fallback still works)
- Test that the `.env` variable `EXPO_PUBLIC_WEBAPP_URL` is correctly read and used
