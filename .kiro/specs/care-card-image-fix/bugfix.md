# Bugfix Requirements Document

## Introduction

The Expo mobile app's care card does not display the person's avatar photo for "person-sabawoon-hakimi" (or any person with a relative-path avatar). The Next.js webapp displays the image correctly because Next.js `<Image>` resolves relative paths (e.g., `/people/sabawoon-hakimi.png`) against the server origin. In the Expo app, React Native's `Image` component receives the relative path as-is via `source={{ uri: "/people/sabawoon-hakimi.png" }}`, which is not a loadable URL on a mobile device. The result is that the avatar never renders and the user always sees initials instead of the actual photo.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the `avatar` field in the database contains a relative path (e.g., `/people/sabawoon-hakimi.png`) THEN the Expo app passes the raw relative path to React Native's `Image` component which cannot resolve it, resulting in a failed image load and only initials being displayed

1.2 WHEN `isValidAvatarUrl()` evaluates a relative path starting with `/` THEN it returns `true`, causing the app to attempt rendering an `Image` with an unresolvable URI instead of falling back to initials gracefully

### Expected Behavior (Correct)

2.1 WHEN the `avatar` field in the database contains a relative path (e.g., `/people/sabawoon-hakimi.png`) THEN the Expo app SHALL resolve it to an absolute URL using a configured base URL (e.g., `https://<webapp-host>/people/sabawoon-hakimi.png`) before passing it to the `Image` component, and the person's photo SHALL be displayed

2.2 WHEN the `avatar` field contains a value that cannot be resolved to a valid absolute URL (empty string, null, or malformed path) THEN the Expo app SHALL fall back to displaying the person's initials

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the `avatar` field contains a fully-qualified absolute URL (e.g., `https://example.com/photo.jpg`) THEN the Expo app SHALL CONTINUE TO pass it directly to the `Image` component and display the photo without modification

3.2 WHEN the `avatar` field contains a data URI (e.g., `data:image/svg+xml;...`) THEN the Expo app SHALL CONTINUE TO render it directly as before

3.3 WHEN the `avatar` field is null or an empty string THEN the Expo app SHALL CONTINUE TO display the person's initials as the fallback

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AvatarInput  -- where AvatarInput = { avatar: string | null }
  OUTPUT: boolean

  // Returns true when the avatar is a relative path (starts with "/" but not "//")
  RETURN X.avatar IS NOT NULL
     AND X.avatar starts with "/"
     AND X.avatar does NOT start with "//"
END FUNCTION
```

**Example:** `isBugCondition({ avatar: "/people/sabawoon-hakimi.png" })` → `true`

### Property: Fix Checking

```pascal
// Property: Fix Checking — Relative avatar paths are resolved to absolute URLs
FOR ALL X WHERE isBugCondition(X) DO
  resolvedUrl ← resolveAvatarUrl'(X.avatar, baseUrl)
  ASSERT resolvedUrl starts with "https://" OR resolvedUrl starts with "http://"
  ASSERT Image component receives resolvedUrl as source URI
  ASSERT image loads successfully (no fallback to initials)
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking — Non-buggy inputs behave identically
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT resolveAvatarUrl(X.avatar) = resolveAvatarUrl'(X.avatar)
  // Absolute URLs, data URIs, null, and empty strings are unchanged
END FOR
```
