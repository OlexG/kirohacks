# The Room — Alert Room Requirements

## R1: Spatial alert display
Active alerts must be displayed spatially rather than as a list or table. The most urgent alert occupies center stage, remaining alerts orbit around it.

## R2: Center stage shows full context
The primary alert card must show: person photo, name, age, signal type, severity badge, event title, summary, triggering metric, trigger time, routing target, suggested next step, and action buttons.

## R3: Severity-driven visual hierarchy
Urgent alerts must be visually distinct from warning and info alerts through border color/glow, proximity to center (orbit distance), and badge styling — without using loud background colors.

## R4: Orbit tile interaction
Clicking an orbit tile must swap it into center stage. The previous center stage alert moves to the orbit. Only one alert is in center stage at a time.

## R5: Acknowledge flow
Acknowledging an alert must move it from the active set to the ground tray. The next most urgent alert should automatically take center stage.

## R6: Restore from ground tray
Clicking an acknowledged alert in the ground tray must restore it to the active set and place it in center stage.

## R7: Calm state
When no active alerts remain, the page must show a calm state with person portraits and a reassuring message ("Everyone is safe right now").

## R8: Situation bar
A slim bar at the top must show severity counts (urgent, review, info) and the number of acknowledged alerts.

## R9: Notification routing
A settings popover (triggered by gear icon) must allow the caretaker to view and update their notification phone number using the existing `updateProfileNotificationNumberAction`.

## R10: Heartbeat animation
Center stage must have a subtle pulsing border animation that communicates "the system is alive" without creating anxiety. Color must reflect severity.

## R11: Orbit float animation
Orbit tiles must have a gentle vertical float animation (3px drift, 4s cycle) staggered across tiles so they don't move in sync.

## R12: Responsive behavior
On screens below 900px, orbit tiles should be hidden and center stage should fill the available width. The ground tray and situation bar must remain functional.

## R13: Backward compatibility
The alerts page must continue to use the same data sources (`listActiveCareAlerts`, `listCarePeople`, `getDemoProfile`) and the same app shell (sidebar + board header + footer).
