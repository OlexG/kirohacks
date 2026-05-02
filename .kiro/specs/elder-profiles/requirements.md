# Elder Profiles — Requirements

## R1: Full senior profile on one page
Each senior must have a dedicated profile page at `/app/people/[personId]` showing their identity, vitals, fall risk, medications, and active alerts in a single view.

## R2: Focus card with primary metrics
The center of the page must show the senior's photo, name, age, status, and three key metrics (heart rate, fall risk score, next medication).

## R3: Orbit cards for domain summaries
Four satellite cards must surround the focus card showing: rule risk score, ML risk score, walking steadiness, and recent instability events.

## R4: Fall-risk profile data
The page must display the senior's clinical profile: sex, height, assistive device, prior falls (12mo), injurious fall history, unable-to-rise history, and impairment tags.

## R5: Time series charts
The page must show mini line charts for rule risk, instability, heart rate, and walking speed using data from `fall_risk_observations`. Charts must handle the empty state gracefully.

## R6: Weekly medication schedule
The page must display the senior's medication schedule as a 7-day grid with expandable day-by-day detail showing medication name, dose, time, and delivery method.

## R7: Medication reminder SMS
Each scheduled dose must have a "Notify" button that sends an SMS reminder to the caregiver's notification number via Twilio.

## R8: Active alerts section
The page must list all active alerts for this senior with severity, title, summary, signal, metric, and trigger time.

## R9: Live data polling
The page must poll for fresh data every 3.5 seconds using `router.refresh()`. A visible live console must show connection status and last update time.

## R10: Reactive metric values
When webhook data changes a metric value, the displayed value must visually flash/highlight to draw attention to the change.

## R11: Live vs non-live distinction
Profiles that don't receive webhook data must show a "Non live profile" indicator and skip the live console. Only profiles with active webhook connections show live status.

## R12: 404 for invalid person
If the `personId` doesn't match an active person in `care_people`, the page must return a Next.js `notFound()` response.

## R13: Back navigation
The page must provide a "Back to workspace" link returning to `/app/dashboard`.
