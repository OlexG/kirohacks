# Bugfix Requirements Document

## Introduction

The front care card in the Expo app (`CareView` component in `expo_app/App.tsx`) has multiple display and data issues. The avatar shows only initials instead of the patient's actual photo, the name/age text layout is broken (wrapping vertically instead of displaying horizontally), and the fall risk card contains hardcoded debug text that should be removed. These issues degrade the care card's usability and professional appearance.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the care card renders a patient profile THEN the system displays only the patient's initials text in a colored square, ignoring the `avatar` field available from the Supabase `care_people` table

1.2 WHEN the care card renders the patient name and age THEN the system wraps the name text vertically in a column layout instead of displaying it horizontally next to the avatar photo

1.3 WHEN the care card renders the fall risk section THEN the system displays hardcoded text "Seeded from Supabase fall_risk_observations for Sabawoon." which is debug/seed information not intended for end users

1.4 WHEN the `ElderProfile` type is constructed via `mapLiveData()` THEN the system does not pass through the `avatar` URL from the `CarePersonRow` data, making it unavailable for rendering

### Expected Behavior (Correct)

2.1 WHEN the care card renders a patient profile and the patient has a valid `avatar` URL THEN the system SHALL display the patient's photo using React Native's `Image` component, falling back to the initials display only when no valid photo URL is available

2.2 WHEN the care card renders the patient name and age THEN the system SHALL display the name and age horizontally (in a row) next to the avatar photo, with the fall risk signal positioned below that row

2.3 WHEN the care card renders the fall risk section THEN the system SHALL display only the fall risk metrics without any hardcoded debug or seed text

2.4 WHEN `mapLiveData()` constructs the `ElderProfile` THEN the system SHALL include the `avatar` field from the `CarePersonRow` so it is available for rendering in the care card

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the patient has no valid avatar URL (empty string or null) THEN the system SHALL CONTINUE TO display the initials in a colored square as the fallback avatar

3.2 WHEN the care card renders the profile stats (location, last seen) THEN the system SHALL CONTINUE TO display them correctly below the profile section

3.3 WHEN the care card renders the heart monitor, metric grid, and other sections below the profile card THEN the system SHALL CONTINUE TO display them in the existing vertical stack layout

3.4 WHEN `mapLiveData()` constructs other fields of `ElderProfile` (name, age, heartRate, steps, etc.) THEN the system SHALL CONTINUE TO map them correctly from the Supabase data

3.5 WHEN the fall risk card renders the fall risk metrics grid THEN the system SHALL CONTINUE TO display all fall risk metric tiles correctly

---

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CareCardRenderInput
  OUTPUT: boolean
  
  // The bug manifests in all render cases because:
  // - Avatar always shows initials (no photo path exists in ElderProfile)
  // - Layout is always broken for name/age text
  // - Hardcoded text is always present in fall risk card
  RETURN TRUE
END FUNCTION
```

Since this bug affects all renders unconditionally (it's a structural/layout defect rather than a conditional logic error), the bug condition is always true for the current code.

**Property Specification:**

```pascal
// Property: Fix Checking - Avatar displays photo when available
FOR ALL X WHERE X.elder.avatar is a valid image URL DO
  result ← CareView'(X)
  ASSERT result contains Image component with source = X.elder.avatar
  ASSERT result does NOT show initials text overlay
END FOR

// Property: Fix Checking - Name/age layout is horizontal
FOR ALL X DO
  result ← CareView'(X)
  ASSERT name and age text are rendered in a horizontal row next to the avatar
  ASSERT fall risk signal appears below the name/age row
END FOR

// Property: Fix Checking - No hardcoded debug text
FOR ALL X DO
  result ← CareView'(X)
  ASSERT fall risk card does NOT contain "Seeded from Supabase" text
END FOR
```

**Preservation Goal:**

```pascal
// Property: Preservation Checking - Fallback avatar
FOR ALL X WHERE X.elder.avatar is NOT a valid image URL DO
  ASSERT CareView'(X) displays initials in colored square (same as F(X))
END FOR

// Property: Preservation Checking - Other sections unchanged
FOR ALL X DO
  ASSERT heartMonitor(F(X)) = heartMonitor(F'(X))
  ASSERT metricGrid(F(X)) = metricGrid(F'(X))
  ASSERT fallRiskMetrics(F(X)) = fallRiskMetrics(F'(X))
END FOR
```
