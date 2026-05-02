# The Room — Implementation Tasks

- [x] 1. Create `AlertRoom` component with center stage, orbit, ground tray, calm state, situation bar, and settings popover (`src/app/app/alert-room.tsx`)
- [x] 2. Wire `AlertRoom` into `RosterClient` replacing `AlertQueueView` for the alerts view
- [x] 3. Add `.room-*` CSS classes to `globals.css` covering all spatial layout, animations, and responsive breakpoints
- [x] 4. Implement heartbeat pulse animation on center stage card with severity-driven glow colors
- [x] 5. Implement orbit tile positioning with CSS custom properties (`--orbit-angle`, `--orbit-distance`) and float animation
- [x] 6. Implement ground tray with acknowledge/restore flow
- [x] 7. Implement calm state with overlapping person portraits
- [x] 8. Implement settings popover with notification number form using existing server action
- [x] 9. Add responsive breakpoint at 900px hiding orbit tiles
- [x] 10. Verify TypeScript compilation passes with no errors
