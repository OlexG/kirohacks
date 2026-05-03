/**
 * Preservation Property Tests — Non-Relative Avatar Inputs Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * These property-based tests verify that `resolveAvatarUrl` preserves all
 * non-relative avatar inputs unchanged. Inputs that do NOT match the bug
 * condition (absolute URLs, data URIs, null, empty strings, protocol-relative
 * URLs) must pass through the function without modification.
 *
 * NOTE: `resolveAvatarUrl` does not exist yet in the codebase. These tests
 * will fail to compile until the fix is implemented in Task 3.1. That is
 * expected — the tests are written now so they are ready to validate
 * preservation once the function exists.
 */

import * as fc from "fast-check";
import { resolveAvatarUrl } from "../App";

const BASE_URL = "https://example.com";

// ─── Property 2a: Absolute URL Preservation ─────────────────────────────────
describe("Preservation Property 2a: Absolute URL preservation", () => {
  /**
   * For any absolute URL (http:// or https://), resolveAvatarUrl must return
   * the input unchanged. The function should never modify already-absolute URLs.
   *
   * **Validates: Requirements 3.1**
   */
  it("returns absolute URLs unchanged", () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const result = resolveAvatarUrl(url, BASE_URL);
        expect(result).toBe(url);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2b: Data URI Preservation ─────────────────────────────────────
describe("Preservation Property 2b: Data URI preservation", () => {
  /**
   * For any data URI (data:image/...), resolveAvatarUrl must return the input
   * unchanged. Data URIs are self-contained and should never be modified.
   *
   * **Validates: Requirements 3.2**
   */
  it("returns data URIs unchanged", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "data:image/png;base64,abc",
          "data:image/svg+xml;utf8,<svg></svg>",
          "data:image/jpeg;base64,xyz",
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD",
        ),
        (dataUri) => {
          const result = resolveAvatarUrl(dataUri, BASE_URL);
          expect(result).toBe(dataUri);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ─── Property 2c: Null/Empty Preservation ───────────────────────────────────
describe("Preservation Property 2c: Null/empty preservation", () => {
  /**
   * resolveAvatarUrl(null) must return null and resolveAvatarUrl("") must
   * return null. These inputs trigger the initials fallback in the UI.
   *
   * **Validates: Requirements 3.3**
   */
  it("returns null for null input", () => {
    const result = resolveAvatarUrl(null, BASE_URL);
    expect(result).toBeNull();
  });

  it("returns null for empty string input", () => {
    const result = resolveAvatarUrl("", BASE_URL);
    expect(result).toBeNull();
  });
});

// ─── Property 2d: Protocol-Relative URL Preservation ────────────────────────
describe("Preservation Property 2d: Protocol-relative URL preservation", () => {
  /**
   * For any protocol-relative URL (starting with "//"), resolveAvatarUrl must
   * return the input unchanged. These URLs rely on the current protocol and
   * should not be modified.
   *
   * **Validates: Requirements 3.1**
   */
  it("returns protocol-relative URLs unchanged", () => {
    fc.assert(
      fc.property(
        fc.webUrl().map((url) => "//" + url.replace(/^https?:\/\//, "")),
        (protocolRelativeUrl) => {
          // Ensure our generated string actually starts with "//"
          fc.pre(protocolRelativeUrl.startsWith("//"));
          const result = resolveAvatarUrl(protocolRelativeUrl, BASE_URL);
          expect(result).toBe(protocolRelativeUrl);
        },
      ),
      { numRuns: 100 },
    );
  });
});
