# Timetable + Dashboard UI Smoke Checklist

## Dashboard right panel
- [ ] Mini calendar shows current month with today highlighted
- [ ] Days with sessions show a green dot
- [ ] Clicking a date navigates to /timetable with that date
- [ ] Next 3 sessions show correct group colors, venue, time
- [ ] "Go to Group ->" links open group pages
- [ ] Main dashboard content does not overlap the right panel

## Timetable - Week view
- [ ] Tabs visible: Week View | Day View | Group View
- [ ] Left panel shows mini calendar + group legend
- [ ] Week grid shows Mon-Thu with session cards; Fri empty if no sessions
- [ ] Clicking a session card opens the right detail panel
- [ ] Detail panel shows group name, status, date, venue, students, credits, actions
- [ ] Hover tooltip appears after 300ms on session cards
- [ ] Next Session panel shows when no session is selected

## Timetable - Day view
- [ ] Horizontal date strip shows current month
- [ ] Today is highlighted green
- [ ] Clicking a day updates the timeline below
- [ ] Mon-Thu show session blocks, Fri shows empty state if no sessions
- [ ] Month navigation arrows work

## Timetable - Group view
- [ ] Group dropdown lists all groups
- [ ] Selecting a group shows weekly rotation table
- [ ] Table cells show venue when a session exists
- [ ] This week's sessions list shows correct dates
- [ ] Mark Attendance buttons navigate correctly
