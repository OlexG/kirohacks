---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/*.css"
---

# Safely Design System

## Brand

Product name is **Safely**. Tagline: "Care operations." The brand mark is a heart icon in a rounded square, ink background with sand-colored icon.

## Color Palette

Two contexts: the marketing landing page and the care app. Both share the same warm neutral foundation.

### Foundation tokens (`:root`)

| Token | Hex | Usage |
|---|---|---|
| `--cream` | `#f5f3ee` | Page background |
| `--sand` | `#f8eed9` | Warm accent surfaces, highlights |
| `--taupe` | `#d6c8b2` | Borders, dividers |
| `--stone` | `#cbc9c4` | Secondary borders |
| `--muted` | `#a4a29a` | Disabled, tertiary text |
| `--text-soft` | `#7b786f` | Secondary text |
| `--ink` | `#5a564b` | Primary text, dark surfaces |

### Care app tokens (`.care-app-page`)

| Token | Hex | Usage |
|---|---|---|
| `--care-bg` | `#f5f3ee` | App background |
| `--care-surface` | `#fdfcf8` | Card/panel background |
| `--care-surface-alt` | `#f8eed9` | Warm accent panels |
| `--care-border` | `#d6c8b2` | Primary borders |
| `--care-border-soft` | `#cbc9c4` | Subtle borders |
| `--care-muted` | `#a4a29a` | Disabled/tertiary |
| `--care-secondary` | `#7b786f` | Secondary text |
| `--care-primary` | `#5a564b` | Primary text, actions |

### Status colors

Status is communicated through subtle accents, not loud backgrounds. The palette stays warm.

| Status | Dot/border color | Badge background | Badge text |
|---|---|---|---|
| Stable | `#7b786f` | `#e7f6ee` | `#4f7f63` |
| Warning | `#d6c8b2` / `#b87924` | `rgba(184,121,36,0.1)` | `#8a5c1a` |
| Urgent | `#5a564b` / `#b84a3c` | `rgba(184,74,60,0.1)` | `#9e3a2e` |
| Offline | `#a4a29a` / `#64748b` | `#eef2f6` | `#64748b` |

### Alert severity colors (used in The Room and alert panels)

| Severity | Accent | Glow |
|---|---|---|
| Urgent | `#b84a3c` | `rgba(184,74,60,0.08)` |
| Warning | `#b87924` | `rgba(184,121,36,0.08)` |
| Info | `#3e6f9e` | `rgba(62,111,158,0.06)` |

## Typography

- **Sans:** Geist (loaded via `next/font/google`, variable `--font-geist-sans`)
- **Mono:** Geist Mono (variable `--font-geist-mono`) — used for metrics, numbers, timestamps

### Scale

| Element | Size | Weight |
|---|---|---|
| Page heading (h1) | `clamp(28px, 3vw, 36px)` | 850 |
| Section heading (h2) | 18–24px | 660–760 |
| Card title (h3) | 17–20px | 720–840 |
| Body text | 13–14px | 560–650 |
| Eyebrow/kicker | 10–12px uppercase | 720–750, `letter-spacing: 0.04–0.08em` |
| Metric values | 14–24px mono | 650–680 |

## Layout Patterns

### App shell
- Sidebar: 236px fixed, gradient background (`#f8eed9` → `#f5f3ee`), border-right
- Main: flex column, 16px padding, content fills remaining space
- Board: rounded 18px panel with header gradient and border

### The Room (alerts page)
Spatial alert environment — not a list or table. Three zones:
- **Center stage:** Primary alert as a large card with person photo, event description, metrics grid, and action buttons. Subtle pulsing border (heartbeat animation).
- **Orbit:** Remaining alerts as floating tiles positioned in an arc. Closer = more urgent. Gentle 3px vertical float animation.
- **Ground tray:** Acknowledged alerts as muted thumbnails at the bottom.
- **Calm state:** When no alerts, show overlapping person portraits with "Everyone is safe right now."

### Dashboard
- Charts grid: 3 columns (status donut, battery bars, alert trend)
- Content grid: table panel + alert summary sidebar
- Stat cards: 4-column grid with mono numbers

### Roster
- 4-column kanban: Stable, Watch List, Active Alerts, Offline
- Person cards with photo, name, age, heart rate trace, status badge

## Component Conventions

- Borders: 1px solid `var(--care-border)`, border-radius 12–18px for panels, 8–10px for smaller elements
- Shadows: `0 18px 60px rgba(90,86,75,0.08)` for main panels, `0 8px 24px rgba(90,86,75,0.08)` for floating elements
- Buttons: 42px min-height, 10px border-radius, 720 font-weight
- Primary action: `var(--care-primary)` background, `#faf7f2` text
- Secondary action: `#f4eee5` background, 1px `#e1d6c8` border
- Status dots: 8px circles with 4px box-shadow ring
- Photos: rounded 10–18px corners, 1px border, subtle shadow
- Transitions: 120–160ms ease for hover states

## Accessibility

- All interactive elements have min 44px touch targets
- Focus-visible styles use box-shadow rings, not outlines
- Status is never communicated by color alone — always paired with text labels
- Images use descriptive alt text with person names
- Sections use aria-label for screen reader context
