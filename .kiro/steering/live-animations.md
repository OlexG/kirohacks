---
inclusion: fileMatch
fileMatchPattern: "**/live-data-refresh.tsx,**/alert-room.tsx,**/roster-client.tsx,**/*.css"
---

# Live Animations & Real-Time UI

## Philosophy

Safely uses animation to communicate system state, not for decoration. Animations are slow, subtle, and purposeful — they tell the caretaker "the system is alive and watching" without creating anxiety.

## Animation Inventory

### 1. Heartbeat Pulse (alerts + profiles)

**Where:** Center stage card border in The Room (alerts page) and person focus card (profile page)

**CSS class:** `.room-center-pulse`, `.person-focus-pulse`

**Behavior:** A border element around the primary card scales between 1.0 and 1.02 with opacity fading between 0.4 and 1.0. 3.2s cycle, ease-in-out, infinite.

```css
@keyframes room-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}
```

**Color:** The pulse border color changes with severity:
- Urgent: `rgba(184, 74, 60, 0.08)` — warm red glow
- Warning: `rgba(184, 121, 36, 0.08)` — amber glow
- Info: `rgba(62, 111, 158, 0.06)` — cool blue glow

### 2. Orbit Float (alerts page)

**Where:** Peripheral alert tiles in The Room

**CSS class:** `.room-orbit-tile`

**Behavior:** Each tile drifts vertically by 3px on a 4s cycle. Tiles are staggered by `--orbit-index * -0.8s` so they don't move in sync.

```css
@keyframes orbit-float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -3px; }
}
```

**Positioning:** Tiles use CSS custom properties for spatial placement:
- `--orbit-angle`: distributed across a 120° arc (-60° to +60°)
- `--orbit-distance`: urgent tiles closer (0.72), info tiles further (0.95)
- Position calculated with `sin()` and `cos()` in CSS

### 3. Live Pill Pulse (dashboard, sidebar)

**Where:** "Live" indicator dots throughout the app

**CSS class:** `.live-pill span`, `.care-board-status > span`

**Behavior:** 8px dot scales to 1.35× and fades to 0.45 opacity. 1.7s cycle.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(1.35); }
}
```

### 4. Metric Value Flash (profile page)

**Where:** Any metric wrapped in `<LiveMetricValue>`

**Component:** `src/app/app/live-data-refresh.tsx`

**Behavior:** When the `compareKey` prop changes (new data from webhook), the component adds `is-updated` class for 1.8s. CSS should animate a brief highlight — background flash or text color shift.

**Usage pattern:**
```tsx
<LiveMetricValue compareKey={person.heart_rate_bpm ?? "none"}>
  {person.heart_rate_bpm ?? "--"} bpm
</LiveMetricValue>
```

### 5. Refresh Progress Meter (profile page)

**Where:** Live console panel on profile pages

**Component:** `LiveDataRefresh` with `variant="profile"`

**Behavior:**
- Progress bar fills from 0% to 100% over the polling interval (3.5s default)
- When refresh completes, a brief pulse class is added for 1.2s
- When new webhook data arrives (`watchedKey` changes), an `updated` class is added for 2.2s
- Body dataset attributes are set during refresh/update for global CSS hooks:
  - `document.body.dataset.profileRefreshState = "refreshing"` — during server refresh
  - `document.body.dataset.profileLiveState = "updated"` — when new data arrives

### 6. Card Transitions (alerts page)

**Where:** The Room — when clicking orbit tiles or acknowledging alerts

**Behavior:** Currently state-driven (React state swap). For smoother transitions, consider:
- Orbit tile → center stage: scale up + move to center
- Center stage → ground tray: scale down + slide to bottom
- New alert arriving: current center slides to orbit, new alert rises into center

These are not yet animated with CSS transitions — they're instant state swaps. Adding `transition` on position/transform properties would make them fluid.

## CSS Custom Properties for Animation

Animations use these severity-driven custom properties:

```css
.room-center {
  --room-glow: rgba(184, 74, 60, 0.08);  /* urgent default */
}
.room-center.room-severity-warning {
  --room-glow: rgba(184, 121, 36, 0.08);
}
.room-center.room-severity-info {
  --room-glow: rgba(62, 111, 158, 0.06);
}
```

## Performance Guidelines

- All animations use `transform`, `opacity`, or `translate` — GPU-composited properties only
- No animations on `width`, `height`, `top`, `left`, `margin`, or `padding`
- Orbit tiles use `will-change: transform` implicitly through the animation
- Polling interval is 3.5s for profiles, 5s default — not aggressive enough to cause layout thrashing
- `document.visibilityState` check prevents polling when the tab is hidden
