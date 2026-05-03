# Implementation Plan

- [x] 1. Add ELSA theme tokens
  - Define reusable colors for background, panel, buttons, and text.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Add logo asset and watermark
  - Add logo asset to asset catalog.
  - Render the logo behind the main content with low opacity.
  - Disable hit testing on the logo.
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Restore aligned main layout
  - Apply shared horizontal, top, and bottom content padding.
  - Restore risk header internal padding without reintroducing a visually heavy card.
  - _Requirements: 1.1, 1.2_

- [x] 4. Tune title readability
  - Hide the native white title.
  - Add a gray top-bar `ELSA Monitor` title.
  - Increase title size with tightening/scaling.
  - _Requirements: 1.3, 4.1, 4.2, 4.3_

- [x] 5. Tune button colors
  - Use bordered prominent button style.
  - Apply muted turquoise to session action and amber to alert action.
  - _Requirements: 2.4, 2.5_

- [x] 6. Validate on watchOS build
  - Run generic watchOS build after SwiftUI toolbar/layout changes.
  - Fix watchOS-unavailable toolbar placements.
  - _Requirements: 1.1, 4.3_
