# The Room — Implementation Tasks

- [ ] 1. Create `AlertRoom` component with center stage, orbit, ground tray, calm state, situation bar, and settings popover (`src/app/app/alert-room.tsx`)
- [ ] 2. Wire `AlertRoom` into `RosterClient` replacing `AlertQueueView` for the alerts view
- [ ] 3. Add `.room-*` CSS classes to `globals.css` covering all spatial layout, animations, and responsive breakpoints
- [ ] 4. Implement heartbeat pulse animation on center stage card with severity-driven glow colors
- [ ] 5. Implement orbit tile positioning with CSS custom properties (`--orbit-angle`, `--orbit-distance`) and float animation
- [ ] 6. Implement ground tray with acknowledge/restore flow
- [ ] 7. Implement calm state with overlapping person portraits
- [ ] 8. Implement settings popover with notification number form using existing server action
- [ ] 9. Add responsive breakpoint at 900px hiding orbit tiles
- [ ] 10. Verify TypeScript compilation passes with no errors
