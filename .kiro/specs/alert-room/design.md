# The Room — Alert Room Design Spec

## Problem

The original alerts page was a two-panel layout: a table of alert rows on the left, a detail sidebar on the right. It worked functionally but felt like an IT ops dashboard — ticket queues, dense rows, clinical. For a product where caretakers are responding to a grandmother's fall or a father's elevated heart rate, the UI needed to feel human and purposeful, not transactional.

## Design Concept: "Calm Urgency"

The alerts page is a spatial environment. The most urgent thing dominates your attention. Everything else is peripheral until it isn't. The metaphor is a care coordination room, not an email inbox.

## Layout — Three Zones

### 1. Center Stage
The single most urgent unacknowledged alert occupies the center of the page as a large card.

**Content:**
- Signal type row (icon + label + severity badge)
- Person photo (72×72), name, age
- Event title and summary in plain language
- Metrics grid (3 columns): triggering metric, trigger time, routing target
- Next step suggestion in a warm background panel
- Action buttons: Review profile (primary), Call, Message, Acknowledge

**Visual treatment:**
- Rounded 20px card with subtle shadow stack
- Pulsing border animation (3.2s heartbeat cycle) — color driven by severity
- Urgent: warm red glow. Warning: amber. Info: cool blue.

### 2. The Orbit
Remaining active alerts float around center stage as small tiles positioned in an arc.

**Positioning:**
- Tiles distributed across a 120° arc (-60° to +60°)
- Urgent alerts sit closer to center (`--orbit-distance: 0.72`), info alerts further out (`0.95`)
- Each tile has a gentle 3px vertical float animation, staggered so they don't sync

**Content per tile:**
- Person photo (44×44) with severity pip dot
- Person name
- Signal type icon + label

**Interaction:**
- Click a tile → it swaps into center stage, previous center moves to orbit
- Hover → slight scale up (1.05×) and border highlight

### 3. Ground Tray
Acknowledged alerts slide to a muted strip at the bottom of the page.

**Content:**
- "Acknowledged" label
- Row of small thumbnails (person photo + name)
- Click to restore an alert back to the active set

### 4. Calm State
When all alerts are cleared (or acknowledged), center stage shows:
- Overlapping person portraits (up to 8) in a horizontal row
- "Everyone is safe right now"
- Count of monitored seniors + "All signals within range"

## Situation Bar (top)
Slim bar above the stage with:
- Severity counts as pills: "2 urgent · 1 review"
- Acknowledged count
- Settings gear icon → popover with notification routing phone number form

## Component Structure

```
AlertRoom (main export)
├── SituationBar
├── room-stage
│   ├── OrbitTile[] (peripheral alerts)
│   └── CenterStage (primary alert) OR CalmState (all clear)
├── GroundTray (acknowledged alerts)
└── SettingsPopover (notification routing)
```

**File:** `src/app/app/alert-room.tsx`
**CSS:** `.room-*` classes in `globals.css`

## State Management

All client-side, no server round-trips for UI interactions:
- `centerId` — which alert is in center stage
- `dismissedIds` — Set of acknowledged alert IDs
- Derived: `activeAlerts`, `dismissedAlerts`, `centerAlert`, `orbitAlerts`

## Why This Design

- **Person-first:** Photo and name are the most prominent elements at every level. You're responding to Mae, not ticket #4072.
- **Spatial awareness:** Glancing at the page tells you the situation — crowded orbit means many alerts, empty center means all clear.
- **Reduced cognitive load:** No panel-switching. One thing at a time in center stage, everything else visible but peripheral.
- **Calm under pressure:** The heartbeat pulse communicates urgency without alarm. The warm palette stays consistent even during critical events.
