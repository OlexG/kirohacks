# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** — Care Card Avatar, Layout, and Debug Text Defects
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate all four structural defects
  - **Setup**: Install `jest`, `ts-jest`, `@types/jest` as devDependencies in `expo_app/` and create a `jest.config.js` if not present. Create test file at `expo_app/__tests__/care-card-bug-condition.test.ts`
  - **Scoped PBT Approach**: Since the bug is structural (always true for all inputs), scope the property to concrete cases:
    - **Type defect**: Verify `ElderProfile` type does NOT have an `avatar` field by checking that `defaultElder` has no `avatar` property
    - **Data flow defect**: Call `mapLiveData()` with a `CarePersonRow` where `avatar = "https://example.com/photo.jpg"` and assert the returned `elder` object does NOT contain an `avatar` field (confirms data is silently dropped)
    - **Debug text defect**: Assert that the `CareView` JSX source contains the hardcoded string `"Seeded from Supabase fall_risk_observations for Sabawoon."`
  - Test assertions should match the Expected Behavior Properties from design: avatar renders as Image when valid URL, no debug text, horizontal layout
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** — Non-Avatar ElderProfile Fields and Existing Rendering
  - **IMPORTANT**: Follow observation-first methodology
  - **Setup**: Use the same Jest setup from task 1. Create test file at `expo_app/__tests__/care-card-preservation.test.ts`
  - **Observe on UNFIXED code**:
    - Call `mapLiveData()` with sample `CarePersonRow` data and record all returned `elder` fields (name, preferredName, relation, age, status, statusDetail, location, lastSeen, heartRate, oxygen, steps, sleep, initials)
    - Record that `heartSamples`, `fallRiskMetrics`, `medicationWeek`, `alerts`, and `deviceMetrics` are all correctly mapped
    - Record that `defaultElder` has all expected fields with correct default values
  - **Write property-based tests capturing observed behavior**:
    - For any `CarePersonRow` input with varying name, age, status, heart_rate_bpm, etc., verify `mapLiveData()` returns the same elder fields (name, age, heartRate, steps, oxygen, sleep, initials) as the original code
    - Verify `defaultElder` constant has all required fields: name, preferredName, relation, age, status, statusDetail, location, lastSeen, heartRate, oxygen, steps, sleep, initials
    - Verify `heartSamples` array is correctly derived from biometrics/fall risk observations
    - Verify `fallRiskMetrics` are correctly built from fall risk observation data
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix care card avatar, layout, and debug text defects

  - [x] 3.1 Add `avatar` field to `CarePersonRow` and `ElderProfile` types
    - Add `avatar: string | null;` to the `CarePersonRow` type definition (around line 72) to match the Supabase `care_people` table schema
    - Add `avatar: string | null;` to the `ElderProfile` type definition (around line 40) so the avatar URL can flow to the component
    - Add `avatar: null` to the `defaultElder` constant so the type is satisfied before live data loads
    - _Bug_Condition: isBugCondition(input) — ElderProfile type does NOT have 'avatar' field, mapLiveData() does NOT pass person.avatar_
    - _Expected_Behavior: Both types include avatar field, defaultElder has avatar: null_
    - _Preservation: All existing fields on both types remain unchanged_
    - _Requirements: 1.1, 1.4, 2.1, 2.4_

  - [x] 3.2 Thread avatar through `mapLiveData()` and add `isValidAvatarUrl()` helper
    - Add `avatar: person.avatar ?? null` to the `elder` object returned by `mapLiveData()` (around line 740)
    - Add helper function `isValidAvatarUrl(url: string | null): boolean` that returns `true` when the URL matches `/^(https?:\/\/|data:image\/|\/)/.test(url)` (same pattern as the web app's `isProfileImageSrc`)
    - _Bug_Condition: mapLiveData() does NOT pass person.avatar to elder object_
    - _Expected_Behavior: mapLiveData() includes avatar in returned elder, isValidAvatarUrl validates URL format_
    - _Preservation: All other elder fields (name, age, heartRate, steps, oxygen, sleep, initials) mapped identically_
    - _Requirements: 1.4, 2.4, 3.4_

  - [x] 3.3 Update `CareView` avatar rendering to conditionally show Image vs initials
    - In the `CareView` component avatar section (around line 1045), conditionally render `<Image source={{ uri: elder.avatar! }} style={styles.avatarImage} />` when `elder.avatar` is a valid URL per `isValidAvatarUrl()`
    - Fall back to the existing `<Text style={styles.avatarText}>{elder.initials}</Text>` when no valid URL
    - Add `avatarImage` style: `{ width: 58, height: 58, borderRadius: 16 }` to match the avatar container dimensions
    - _Bug_Condition: CareView always renders initials, never an Image component_
    - _Expected_Behavior: CareView renders Image when avatar is valid URL, initials when not_
    - _Preservation: Initials fallback for null/empty/invalid avatar unchanged_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.4 Fix name/age text wrapping and remove hardcoded debug text
    - Add `numberOfLines={1}` to the `profileName` `<Text>` element to prevent text wrapping
    - Add `flexShrink: 1` to the `profileText` style so it yields space to the status pill
    - Remove the `<Text style={styles.fallRiskBody}>Seeded from Supabase fall_risk_observations for Sabawoon.</Text>` element from the fall risk card (around line 1075)
    - _Bug_Condition: Name text wraps vertically, debug text always present in fall risk card_
    - _Expected_Behavior: Name displays on single line, fall risk card shows only title and metrics_
    - _Preservation: Fall risk metric tiles continue to display correctly, profile stats unchanged_
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.2, 3.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** — Care Card Avatar, Layout, and Debug Text Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** — Non-Avatar ElderProfile Fields and Existing Rendering
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (`npx jest --run` in `expo_app/`)
  - Verify bug condition test passes (Property 1)
  - Verify preservation tests pass (Property 2)
  - Ensure TypeScript compiles without errors (`npx tsc --noEmit` in `expo_app/`)
  - Ensure all tests pass, ask the user if questions arise
