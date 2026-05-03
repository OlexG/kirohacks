/**
 * Bug Condition Exploration Test — Relative Avatar Paths Not Resolved to Absolute URLs
 *
 * **Validates: Requirements 1.1, 2.1, 2.2**
 *
 * This property-based test encodes the EXPECTED (fixed) behavior using fast-check.
 * It is designed to FAIL on unfixed code, confirming the bug exists.
 * When the fix is applied, this test should PASS.
 *
 * Bug Condition: avatar IS NOT NULL AND avatar starts with "/" AND avatar does NOT start with "//"
 * Expected Behavior: resolveAvatarUrl(relativePath, baseUrl) returns baseUrl + relativePath
 */

import * as fc from "fast-check";

// This import will fail on unfixed code because resolveAvatarUrl does not exist yet.
// That failure IS the confirmation that the bug exists — there is no URL resolution layer.
import { resolveAvatarUrl } from "../App";

const BASE_URL = "https://example.com";

describe("Bug Condition Exploration: Relative Avatar Paths Not Resolved", () => {
  /**
   * Property 1: Bug Condition — Relative avatar paths are resolved to absolute URLs
   *
   * For all avatar strings that match the bug condition (start with "/" but not "//"),
   * resolveAvatarUrl MUST return an absolute URL that:
   *   1. Starts with the base URL
   *   2. Ends with the original relative path
   *   3. Is a valid absolute URL (starts with "https://")
   *
   * **Validates: Requirements 1.1, 2.1, 2.2**
   */
  it("resolves all relative avatar paths to absolute URLs starting with the base URL", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\/[a-z0-9][a-z0-9\-_\/\.]{0,80}[a-z0-9]$/),
        (relativePath) => {
          const result = resolveAvatarUrl(relativePath, BASE_URL);

          // The result must start with the base URL
          expect(result).not.toBeNull();
          expect(result!.startsWith(BASE_URL)).toBe(true);

          // The result must end with the original relative path
          expect(result!.endsWith(relativePath)).toBe(true);

          // The result must be a valid absolute URL (starts with https://)
          expect(result!.startsWith("https://")).toBe(true);

          // The result must equal baseUrl + relativePath exactly
          expect(result).toBe(`${BASE_URL}${relativePath}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});
