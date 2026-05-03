# Design Document

## Overview

The profile QR feature exports the current watch profile as a direct JSON payload. Because the watchOS target cannot rely on `CoreImage` QR generation, the app asks the Vercel webapp to render a QR image and displays that image full-screen.

## Data Shape

The encoded payload is a standard watch envelope:

```json
{
  "schemaVersion": "fallrisk.v1",
  "messageType": "profile_snapshot",
  "participantId": "...",
  "deviceId": "...",
  "sessionId": null,
  "generatedAt": "...",
  "sequence": 0,
  "source": {
    "app": "watch",
    "watchModel": "Apple Watch Series 9",
    "watchOS": "...",
    "iOS": null,
    "iphoneCarriedAtWaistRequired": true
  },
  "location": null,
  "payload": {
    "ageYears": 75,
    "sex": "unknown",
    "heightCm": 170,
    "assistiveDevice": "none",
    "impairmentTags": [],
    "priorFalls12mo": 0,
    "injuriousFall12mo": false,
    "unableToRiseAfterFall12mo": false
  }
}
```

## URL Contract

Watch requests QR image:

```text
https://kirohacks.vercel.app/api/profile/qr?payload=<base64url-json>
```

QR image should encode import URL:

```text
https://kirohacks.vercel.app/api/profile/import?payload=<same-base64url-json>
```

## Components

### ProfileImportLinks

A lightweight value type containing:

- `importURL`: the URL a phone camera should open.
- `qrImageURL`: the URL the watch displays as an image.

### FallRiskMonitor.profileImportLinks(for:)

Builds the envelope, encodes sorted JSON, base64url-encodes the bytes, and returns both URLs.

### ProfileView

Adds a `Scan QR` button and computes links from the current unsaved `snapshot` so the QR reflects current form values.

### ProfileQRCodeView

Presents a full-screen light background with:

- `AsyncImage` for the QR PNG.
- White QR backing for contrast.
- Short instruction text.
- Back button in the corner.
- Failure state if the QR image route is unavailable.

## Webapp Responsibilities

- Implement `/api/profile/qr` to generate a PNG QR image.
- Implement `/api/profile/import` to decode and validate the profile envelope.
- Avoid requiring authentication for hackathon demo scanning unless the route design changes.

## Error Handling

- If encoding fails, show `Unable to create QR`.
- If the remote image fails, show `QR unavailable`.
- If the route returns JSON, HTML, SVG unsupported by watch image loading, or a non-2xx response, the watch will show the failure state.

## Security Notes

Privacy is intentionally deferred for the hackathon demo. Future hardening should move from direct payload QR to short-lived server tokens or encrypted payloads.
