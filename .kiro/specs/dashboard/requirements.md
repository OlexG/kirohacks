# Dashboard — Requirements

## R1: Single-glance roster overview
The dashboard must show all monitored seniors with their current status, watch battery, last seen time, and alert level in one view.

## R2: Status distribution chart
A donut chart must show the percentage breakdown of seniors by alert level (stable, review, urgent, offline) with a legend showing counts.

## R3: Battery distribution chart
A bar chart must show how many watches fall into each battery bucket (70-100%, 40-69%, 0-39%, offline) to surface device readiness issues.

## R4: Alert trend chart
A 7-day line chart must show the count of alerts per day, with the current open count as a headline number.

## R5: Seniors table
A table must list all active seniors with columns: photo + name + age, status text, watch battery percentage, last seen label, and alert severity badge.

## R6: Person links
Each senior's name in the table must link to their profile page (`/app/people/[personId]`).

## R7: Alert summary panel
A sidebar panel must show active alerts with person photo, name (linked to profile), summary text, and severity badge. Empty state must show a reassuring message.

## R8: Status rollup from alerts
A person's displayed alert level and care group must be derived from their active alerts — urgent alerts override the person's stored status.

## R9: Live monitoring indicator
The board header must show a "Live monitoring" badge with the percentage of devices currently online.

## R10: Shared data layer
The dashboard must use the same `CarePage` server component and data fetching as the alerts and roster views, ensuring consistency across views.

## R11: Roster view (alternate)
A separate roster view at `/app/roster` must display the same people in a 4-column kanban layout grouped by care status (Stable, Watch List, Active Alerts, Offline).

## R12: Legend footer
A footer must show the color legend for status indicators (Stable, Review, Urgent, Offline).
