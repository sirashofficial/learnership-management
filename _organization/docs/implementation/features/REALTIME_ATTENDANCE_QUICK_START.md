# 🚀 Quick Start Guide - Real-Time Collaborative Attendance

## Get Started in 3 Steps

### Step 1: Start the Server with WebSocket Support

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 Server Ready with WebSocket Support                   ║
║                                                            ║
║  URL:        http://localhost:3000                        ║
║  WebSocket:  ws://localhost:3000/socket.io/               ║
║  Mode:       Development                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Step 2: Open Your Application

Navigate to: `http://localhost:3000`

### Step 3: Test Real-Time Collaboration

#### Single User Test
1. Navigate to any session
2. Click "Mark Attendance"
3. In the modal header, enable **"Live Collaboration"** toggle
4. Wait for "Connected" status (green Wifi icon)
5. Mark a student as Present
6. You should see the update instantly

#### Multi-User Test (Best Experience)
1. **Window 1**: Open `http://localhost:3000`, login, go to a session
2. **Window 2**: Open `http://localhost:3000` in incognito/different browser, login
3. **Both Windows**: Open the same session's attendance modal
4. **Both Windows**: Enable "Live Collaboration"
5. **Window 1**: Mark a student as "Present"
6. **Window 2**: Should see toast notification: "Facilitator [Name] marked [Student] as present"
7. **Window 2**: Mark a different student as "Absent"
8. **Window 1**: Should see the update instantly
9. **Both Windows**: Try marking the same student within 2 seconds to see conflict warning

## 🎯 Visual Indicators

### In the Attendance Modal Header:

```
┌─────────────────────────────────────────────────────────┐
│ Mark Attendance — Group Name — Date                     │
├─────────────────────────────────────────────────────────┤
│ ☑ Live Collaboration  📶 Connected  👥 2 collaborators  │
└─────────────────────────────────────────────────────────┘
```

- **Checkbox**: Enable/disable live collaboration
- **📶 Connected**: WebSocket connection status
- **👥 2 collaborators**: Number of active facilitators

### Toast Notifications:

```
┌─────────────────────────────────────┐
│ ✅ John Doe marked Alice Smith      │
│    as Present                       │
└─────────────────────────────────────┘
```

Appears in top-right corner, auto-dismisses after 4 seconds.

## ⚙️ Configuration Options

### Default Behavior
- **Live Collaboration**: OFF (saves bandwidth)
- **Connection**: Auto-connects when enabled
- **Notifications**: ON when live collab enabled
- **Offline Queue**: Automatic when connection lost

### Toggle Live Collaboration
```
☐ Live Collaboration  →  Click to enable
☑ Live Collaboration  →  Click to disable
```

## 🔧 Troubleshooting

### "Connecting..." Never Becomes "Connected"

**Check:**
1. Server running with `npm run dev` (not `npm run dev:standard`)
2. Port 3000 available (no other app using it)
3. Browser console for errors (F12 → Console)
4. Network tab shows WebSocket connection (F12 → Network → WS)

**Quick Fix:**
```bash
# Kill any process on port 3000
npx kill-port 3000

# Restart server
npm run dev
```

### Notifications Not Showing

**Check:**
1. Live collaboration enabled in modal
2. Another user in same session with live collab enabled
3. Browser allows notifications (not blocked)
4. Toast container visible (top-right corner)

**Quick Test:**
Open two browser windows side-by-side, same session, both enable live collab.

### Offline Queue Not Syncing

**Solution:**
1. Enable live collaboration
2. Wait for "Connected" status
3. Click "Save Attendance" button
4. Queue auto-flushes

## 📱 Features at a Glance

| Feature | Status | Default |
|---------|--------|---------|
| Real-time sync | ✅ | OFF |
| Conflict resolution | ✅ | AUTO |
| Offline queueing | ✅ | AUTO |
| Toast notifications | ✅ | ON (when live) |
| Collaborator count | ✅ | ON (when live) |
| Connection status | ✅ | ON (when live) |
| Backward compatible | ✅ | YES |

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Toggle switches to "Connected" within 1 second
2. ✅ Collaborator count shows "1 collaborator" (you)
3. ✅ Marking attendance shows instant feedback
4. ✅ Second user joining shows "2 collaborators"
5. ✅ Toast appears when other user marks attendance
6. ✅ Conflict warning shows for simultaneous marks

## 🆘 Need Help?

1. **Server Logs**: Check terminal where `npm run dev` is running
2. **Browser Console**: Press F12, click Console tab
3. **Network Tab**: F12 → Network → WS (filter by WebSocket)
4. **Documentation**: See `REALTIME_ATTENDANCE_DOCUMENTATION.md`

## 💡 Pro Tips

1. **Save Bandwidth**: Keep live collab OFF unless actively collaborating
2. **Best Experience**: Use WebSocket (not polling fallback)
3. **Conflict Avoidance**: Different facilitators mark different students
4. **Offline Work**: System auto-queues, just click save when back online
5. **Testing**: Use browser dev tools to throttle network and test offline mode

---

**Ready to collaborate in real-time!** 🎊

Start with `npm run dev` and enable the toggle in any attendance modal.
