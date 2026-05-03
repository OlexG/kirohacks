# Requirements Document

## Introduction

Apply ELSA visual branding to the watch app without changing the functional layout. The UI should stay compact and readable on a 41mm Apple Watch while using the warm beige palette, gray text, translucent background logo, and muted button colors.

## Requirements

### Requirement 1: Preserve Watch Layout

**User Story:** As a demo presenter, I want the watch screen to remain aligned and readable, so that it looks polished on physical hardware.

#### Acceptance Criteria

1. WHEN the main screen loads THEN the risk header, controls, telemetry, and recent events SHALL share consistent horizontal margins.
2. WHEN the user scrolls THEN background decorative elements SHALL NOT intercept touches or cause layout instability.
3. WHEN the title is shown THEN it SHALL be readable and avoid obvious truncation on the 41mm watch.

### Requirement 2: Apply Warm ELSA Theme

**User Story:** As the project team, I want a distinctive warm visual identity, so that the app looks like the ELSA brand rather than a default SwiftUI prototype.

#### Acceptance Criteria

1. The root background SHALL use a yellow/warm beige.
2. Primary text SHALL use gray rather than white on light backgrounds.
3. Secondary text SHALL use a softer gray.
4. The start session action SHALL use muted turquoise.
5. The send alert action SHALL use warm amber/orange.

### Requirement 3: Logo Watermark

**User Story:** As the project team, I want the logo visible as a background mark, so that branding is present without cluttering the app chrome.

#### Acceptance Criteria

1. The main UI SHALL NOT show a small logo beside the title.
2. The main UI SHALL show a large centered semi-transparent logo behind the content.
3. Foreground cards SHALL be translucent enough that the logo can show through.
4. The logo SHALL disable hit testing.

### Requirement 4: Watch Navigation Styling

**User Story:** As a wearer, I want the app title and settings button to be readable, so that navigation is clear on a light background.

#### Acceptance Criteria

1. The native white navigation title SHALL NOT be used on the light background.
2. A custom `ELSA Monitor` title SHALL use themed gray text.
3. The settings gear SHALL remain available in the top bar.
