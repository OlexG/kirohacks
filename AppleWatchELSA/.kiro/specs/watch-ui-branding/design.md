# Design Document

## Overview

The watch UI branding work is a focused visual pass in `ContentView.swift`. It intentionally avoids changing the functional hierarchy that made the original watch layout readable.

## Theme Tokens

Theme values are centralized in `ELSATheme`:

- `background`: warm yellow beige root background.
- `panel`: lighter warm panel color for secondary surfaces.
- `sessionButton`: muted turquoise for the main start action.
- `alertButton`: warm amber for manual alert.
- `primaryText`: warm gray.
- `secondaryText`: lighter gray.

## Layout Strategy

- Keep `NavigationStack` and `ScrollView`.
- Use a root `ZStack` containing the beige background, watermark logo, and scroll content.
- Apply one shared content inset to the main `VStack` so sections align.
- Preserve the risk header's internal padding and rounded shape, but use a highly translucent background.
- Center labels inside watch buttons while leaving the parent stack aligned with the rest of the content.

## Navigation Title

watchOS rendered the native navigation title as white against the light theme. The design hides the default title and adds a top-bar `Text("ELSA Monitor")` item using themed gray. The text uses a large base size with tightening/scaling enabled so the watch can reduce it if needed.

## Logo Treatment

The ELSA logo is loaded from `Assets.xcassets/ELSAIcon.imageset` and displayed:

- Centered.
- Approximately 190pt square.
- Low opacity.
- `allowsHitTesting(false)`.

This keeps the logo as brand atmosphere rather than an interactive element.

## Accessibility

- Buttons keep system `Label` content for icon and text semantics.
- Manual SOS keeps an explicit accessibility label.
- The decorative logo is not interactive.
- Text contrast should remain readable on physical hardware.

## Risks

- watchOS toolbar sizing can vary by SDK and device width.
- Very warm backgrounds can reduce contrast with amber alert buttons.
- Button opacity and tint rendering can differ between simulator and physical watch.
