# June 2026 Demo Data

This document describes the sample data added to the Hope United system for demonstration purposes.

## Summary Statistics

- **Total Activity Records**: 82
- **Total People Count**: 368
- **Unique Participants**: 15
- **Date Range**: June 1-30, 2026

## Data Highlights

### Large Group Events (Demonstrating Attendee Count Feature)

The demo data includes several large group events to showcase how the new attendee count feature accurately tracks total people:

1. **Social Event (June 6)**: 45 people
2. **Event/Community Picnic (June 13)**: 67 people - *Largest event*
3. **Social Event (June 27)**: 53 people
4. **Tour/Outreach (June 20)**: 25 people
5. **Training/Focus Group (June 12)**: 22 people

### Category Distribution

| Category | Records | Total People |
|----------|---------|--------------|
| Social Event | 2 | 98 |
| Event | 1 | 67 |
| Personal Growth | 2 | 35 |
| Art | 3 | 31 |
| Tour/Outreach | 1 | 25 |
| Training/Focus Group | 1 | 22 |
| Recovery Meeting | 18 | 18 |
| Board Meeting | 1 | 12 |
| Drop-In | 8 | 8 |
| Virtual Reality | 8 | 8 |
| Faith-Based | 1 | 8 |
| Wellness | 7 | 7 |
| Volunteer | 6 | 6 |
| Peer Support | 5 | 5 |
| Family Support | 5 | 5 |
| The Retreat Virtual Reality | 5 | 5 |
| Veteran Programming | 5 | 5 |
| Bus Pass | 3 | 3 |

## What the Demo Shows

### 1. Individual Check-Ins
- Regular recovery meetings with 3-4 individual attendees
- Daily drop-in visits
- One-on-one wellness and peer support sessions
- Individual Virtual Reality sessions

### 2. Small Group Activities
- Art classes (12-18 people)
- Faith-based gatherings (8 people)
- Board meetings (12 people)

### 3. Large Group Events
- Community events (45-67 people)
- Training sessions (22 people)
- Outreach tours (25 people)

### 4. New Activity Categories
The demo includes examples of the newly added categories:
- **Virtual Reality**: 8 sessions across the month
- **The Retreat Virtual Reality**: 5 specialized sessions

## Key Demo Points

1. **Accurate People Counting**: The system now distinguishes between:
   - 82 activity records (database entries)
   - 368 total people (actual attendance)
   
2. **Group Event Tracking**: Large events like the June 13 picnic (67 people) are recorded with a single activity record but counted correctly in all reports.

3. **Report Accuracy**: All reports now show total people counts, not just activity counts, satisfying the client requirement for accurate attendance metrics.

4. **Mixed Activity Types**: Demonstrates both individual tracking (with names) and anonymous group counts in the same system.

## Viewing the Data

To see the demo data in action:

1. **Activity Report**: Navigate to `/admin/activity?year=2026` to see June totals
2. **Activity by Person**: Go to `/admin/activity/by-person` and set date range to June 1-30, 2026
3. **Excel Export**: Click "Download XLSX" to export the June 2026 report

## Removing Demo Data

If you need to remove the demo data:

```sql
DELETE FROM "Activity" 
WHERE "createdAt" >= '2026-06-01' AND "createdAt" < '2026-07-01';
```

**Warning**: This will permanently delete all June 2026 activities. Make sure this is demo data before running!
