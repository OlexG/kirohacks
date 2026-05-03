# Care Card Layout Fix — Bugfix Design

## Overview

The care card in the Expo app (`CareView` component in `expo_app/App.tsx`) has four related defects: (1) the avatar always shows initials instead of the patient's photo because the `avatar` field is missing from both the `CarePersonRow` and `ElderProfile` types and is never passed through `mapLiveData()`, (2) the name/age text wraps vertically instead of displaying in a horizontal row, (3) a hardcoded debug string "Seeded from Supabase fall_risk_observations for Sabawoon." is rendered in the fall risk card, and (4) the `CarePersonRow` TypeScript type omits the `avatar` column that Supabase returns via `select=*`. The fix adds the `avatar` field to both types, threads it through `mapLiveData()`, conditionally renders an `Image` when a valid URL is present (falling back to initials), ensures the profile text layout stays horizontal, and removes the hardcoded debug text.

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger the visual defects — always true in the current code because the type definitions, data mapping, and JSX are structurally incorrect
- **Property (P)**: The desired rendering behavior — avatar photo when available, horizontal name/age layout, no debug text
- **Preservation**: Existing behaviors that must remain unchanged — initials fallback, profile stats, heart monitor, metric grid, fall risk metric tiles, medication and alert views
- **`CarePersonRow`**: TypeScript type at line 72 of `App.tsx` representing a row from the Supabase `care_people` table; currently missing the `avatar` field
- **`ElderProfile`**: TypeScript type at line 40 of `App.tsx` representing the elder's display data; currently missing the `avatar` field
- **`mapLiveData()`**: Function at line 676 of `App.tsx` that transforms `CarePersonRow` into `AppData` including `ElderProfile`; currently does not pass `avatar` through
- **`CareView`**: React Native component at line 1030 of `App.tsx` that renders the care card; currently always renders initials and includes hardcoded debug text
- **`isProfileImageSrc()`**: Validation function in `src/lib/care-person-image.ts` that checks if a string is a valid image URL using regex `/^(https?:\/\/|data:image\/|\/)/.test(src)`

## Bug Details

### Bug Condition

The bug manifests unconditionally on every render of the care card. There are four structural defects:

1. `CarePersonRow` type omits `avatar` — the Supabase query returns it via `select=*` but TypeScript doesn't know about it
2. `ElderProfile` type omits `avatar` — so `mapLiveData()` has no field to populate
3. `mapLiveData()` never maps `person.avatar` into the elder object
4. `CareView` always renders `<Text>{elder.initials}</Text>` with no conditional image rendering
5. `CareView` contains a hardcoded `<Text>` element with debug seed text in the fall risk card

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CareCardRenderInput
  OUTPUT: boolean
  
  // Bug 1 & 2: Avatar never renders as a photo
  avatarBug := ElderProfile type does NOT have 'avatar' field
               OR mapLiveData() does NOT pass person.avatar to elder object
               OR CareView does NOT conditionally render Image for avatar
  
  // Bug 3: Debug text always present
  debugTextBug := CareView fallRiskCard contains hardcoded "Seeded from Supabase" string
  
  RETURN avatarBug OR debugTextBug
END FUNCTION
```

### Examples

- **Avatar with valid URL**: `person.avatar = "https://example.com/photo.jpg"` → Current: shows initials "SH" in taupe square. Expected: shows the photo via `<Image source={{ uri: "https://example.com/photo.jpg" }} />`
- **Avatar with empty string**: `person.avatar = ""` → Current: shows initials "SH". Expected: continues to show initials "SH" (correct fallback)
- **Avatar with null**: `person.avatar = null` → Current: shows initials "SH". Expected: continues to show initials "SH" (correct fallback)
- **Name/age layout**: `elder.name = "Sabawoon Hakimi", elder.age = 77` → Current: name and "Care member · Age 77" wrap vertically. Expected: displayed horizontally next to avatar with `profileText` constrained by `flex: 1`
- **Fall risk card**: Current: shows "Seeded from Supabase fall_risk_observations for Sabawoon." above the metrics grid. Expected: only the "Fall risk" title and the metrics grid are shown

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When the patient has no valid avatar URL (empty string, null, or non-URL text), the initials display in a colored square must continue to work exactly as before
- Profile stats (Location, Last seen) below the profile card must continue to render correctly
- Heart monitor card, metric grid (Oxygen, Steps, Blood pressure, Next med), and all sections below the profile card must remain unchanged
- All other `ElderProfile` fields (name, age, heartRate, steps, oxygen, sleep, etc.) must continue to be mapped correctly by `mapLiveData()`
- Fall risk metric tiles must continue to display correctly after the debug text is removed
- Medication view, alerts view, and devices view must remain completely unaffected

**Scope:**
All inputs that do NOT involve avatar rendering, profile text layout, or fall risk card text should be completely unaffected by this fix. This includes:
- Heart rate monitoring and chart rendering
- Medication schedule display and dose tracking
- Alert list rendering and alert detail views
- Device metrics display
- Tab navigation between care/medication/alerts/devices

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing `avatar` field on `CarePersonRow` type (line 72)**: The TypeScript type definition does not include `avatar: string | null` even though the Supabase `care_people` table has this column and `select=*` returns it. This means TypeScript treats `person.avatar` as an error, so it was never referenced in `mapLiveData()`.

2. **Missing `avatar` field on `ElderProfile` type (line 40)**: Without this field on the profile type, there is no way to pass the avatar URL to the `CareView` component for rendering.

3. **`mapLiveData()` omits avatar mapping (line 676)**: The function constructs the `elder` object but never includes `avatar: person.avatar`. Even if the types were fixed, the data wouldn't flow through without this mapping.

4. **`CareView` unconditionally renders initials (line 1045)**: The avatar section always renders `<View style={styles.avatar}><Text style={styles.avatarText}>{elder.initials}</Text></View>` with no conditional branch to render an `<Image>` when a valid avatar URL exists.

5. **Hardcoded debug text in fall risk card (line 1075)**: A `<Text style={styles.fallRiskBody}>` element contains the string "Seeded from Supabase fall_risk_observations for Sabawoon." which is leftover debug/seed text.

6. **Name/age layout wrapping**: The `profileTop` style has `flexDirection: "row"` and `profileText` has `flex: 1`, which should work. The wrapping issue may be caused by the `profileName` font size (22) combined with the avatar (58px) and statusPill competing for horizontal space without proper `flexShrink` or `numberOfLines` constraints on the text.

## Correctness Properties

Property 1: Bug Condition — Avatar renders photo when valid URL is available

_For any_ `ElderProfile` where `avatar` is a string matching the pattern `/^(https?:\/\/|data:image\/|\/)/.test(avatar)`, the fixed `CareView` SHALL render a React Native `Image` component with `source={{ uri: avatar }}` inside the avatar container, and SHALL NOT render the initials text overlay.

**Validates: Requirements 2.1, 2.4**

Property 2: Preservation — Initials fallback and non-avatar behaviors unchanged

_For any_ `ElderProfile` where `avatar` is null, empty string, or does not match the valid image URL pattern, the fixed `CareView` SHALL render the initials text in the colored square exactly as the original code does. Additionally, _for any_ input, the heart monitor, metric grid, profile stats, fall risk metrics, medication view, and alert views SHALL produce the same output as the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `expo_app/App.tsx`

**1. Add `avatar` to `CarePersonRow` type (line 72)**:
- Add `avatar: string | null;` to the type definition to match the Supabase `care_people` table schema

**2. Add `avatar` to `ElderProfile` type (line 40)**:
- Add `avatar: string | null;` to the type definition so the avatar URL can flow to the component

**3. Update `defaultElder` constant**:
- Add `avatar: null` to the default elder profile so the type is satisfied before live data loads

**4. Thread avatar through `mapLiveData()` (line 676)**:
- Add `avatar: person.avatar ?? null` to the `elder` object returned by `mapLiveData()`

**5. Update `CareView` avatar rendering (line 1045)**:
- Add a helper function `isValidAvatarUrl(url)` that checks if the avatar string matches `/^(https?:\/\/|data:image\/|\/)/.test(url)` (same pattern as the web app's `isProfileImageSrc`)
- Conditionally render `<Image source={{ uri: elder.avatar }} style={styles.avatarImage} />` when `elder.avatar` is a valid URL
- Fall back to the existing `<Text style={styles.avatarText}>{elder.initials}</Text>` when no valid URL

**6. Add `avatarImage` style**:
- Add a new style `avatarImage: { width: 58, height: 58, borderRadius: 16 }` to match the avatar container dimensions

**7. Fix name/age text wrapping**:
- Add `numberOfLines={1}` to the `profileName` `<Text>` element to prevent wrapping
- Ensure `profileText` style has `flexShrink: 1` so it yields space to the status pill

**8. Remove hardcoded debug text (line 1075)**:
- Remove the `<Text style={styles.fallRiskBody}>Seeded from Supabase fall_risk_observations for Sabawoon.</Text>` element from the fall risk card

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Inspect the TypeScript types, `mapLiveData()` output, and `CareView` JSX to confirm the avatar field is missing, the debug text is present, and the layout lacks text truncation. Run type-checking to confirm `person.avatar` is not accessible.

**Test Cases**:
1. **Type Check Test**: Verify `CarePersonRow` does not have `avatar` field — TypeScript will error if you try to access `person.avatar` (will fail on unfixed code)
2. **Data Flow Test**: Call `mapLiveData()` with a person that has `avatar: "https://example.com/photo.jpg"` and verify the returned `elder` object does NOT contain `avatar` (will fail on unfixed code — field is silently dropped)
3. **Render Test**: Render `CareView` and verify it always shows initials text, never an `Image` component (will fail on unfixed code)
4. **Debug Text Test**: Render `CareView` and verify the string "Seeded from Supabase" is present in the output (will fail on unfixed code — text is present)

**Expected Counterexamples**:
- `person.avatar` is inaccessible due to missing type field
- `mapLiveData()` return value has no `avatar` property on the `elder` object
- `CareView` renders `<Text>` with initials but no `<Image>` for avatar
- Fall risk card contains hardcoded debug string

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE input.person.avatar is a valid image URL DO
  result := mapLiveData_fixed(input.person, ...)
  ASSERT result.elder.avatar == input.person.avatar
  rendered := CareView_fixed(result)
  ASSERT rendered contains Image with source.uri == result.elder.avatar
  ASSERT rendered does NOT contain initials text overlay
END FOR

FOR ALL input DO
  rendered := CareView_fixed(input)
  ASSERT rendered does NOT contain "Seeded from Supabase"
  ASSERT profileName text has numberOfLines == 1
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE input.person.avatar is NOT a valid image URL DO
  ASSERT CareView_original(input).initialsDisplay == CareView_fixed(input).initialsDisplay
END FOR

FOR ALL input DO
  ASSERT mapLiveData_original(input).elder.name == mapLiveData_fixed(input).elder.name
  ASSERT mapLiveData_original(input).elder.age == mapLiveData_fixed(input).elder.age
  ASSERT mapLiveData_original(input).elder.heartRate == mapLiveData_fixed(input).elder.heartRate
  ASSERT mapLiveData_original(input).elder.steps == mapLiveData_fixed(input).elder.steps
  ASSERT mapLiveData_original(input).heartSamples == mapLiveData_fixed(input).heartSamples
  ASSERT mapLiveData_original(input).fallRiskMetrics == mapLiveData_fixed(input).fallRiskMetrics
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-avatar fields and fall risk metrics, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Initials Fallback Preservation**: Verify that when avatar is null/empty, initials still render in the colored square exactly as before
2. **Profile Stats Preservation**: Verify Location and Last seen tiles still render correctly after the fix
3. **Heart Monitor Preservation**: Verify heart rate display and chart are unchanged
4. **Fall Risk Metrics Preservation**: Verify fall risk metric tiles still render correctly after removing the debug text
5. **Other ElderProfile Fields Preservation**: Verify name, age, heartRate, steps, oxygen, sleep are all mapped identically

### Unit Tests

- Test `isValidAvatarUrl()` helper with valid URLs (https, data:image, relative paths), empty strings, null, and non-URL strings
- Test that `mapLiveData()` includes `avatar` in the returned elder object
- Test `CareView` renders `Image` when avatar is a valid URL
- Test `CareView` renders initials when avatar is null/empty
- Test `CareView` does not contain "Seeded from Supabase" text

### Property-Based Tests

- Generate random `CarePersonRow` objects with various avatar values (valid URLs, empty strings, null, random strings) and verify `mapLiveData()` always includes the avatar field and all other fields remain unchanged
- Generate random `ElderProfile` objects and verify `CareView` conditionally renders Image vs initials based on avatar validity
- Generate random fall risk metrics arrays and verify they render correctly without the debug text

### Integration Tests

- Test full app data flow: Supabase row with avatar URL → `mapLiveData()` → `CareView` renders photo
- Test full app data flow: Supabase row with null avatar → `mapLiveData()` → `CareView` renders initials
- Test that switching between tabs (care/medication/alerts/devices) still works after the fix
- Test that the fall risk card displays metrics correctly without debug text
