# YEHA - Student Management System

## Quick Start

### Prerequisites
1. **Node.js** (version 18 or higher) - Download from https://nodejs.org/
2. **npm** (comes with Node.js)

### Running the Application

#### Option 1: Using the Batch File (Windows)
1. Double-click `start-server.bat` in the project folder
2. The script will install dependencies and start the server
3. Open your browser to http://localhost:3000

#### Option 2: Manual Setup
1. Open Command Prompt or Terminal
2. Navigate to the project folder:
   ```
   cd "C:\Users\LATITUDE 5400\Downloads\Learnership Management"
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser to http://localhost:3000

### If you get "ERR_CONNECTION_REFUSED"
This means the server isn't running. Make sure:
1. Node.js is installed
2. The development server is running (`npm run dev`)
3. No other application is using port 3000

### Features Available
- âœ… Student Dashboard with statistics
- âœ… Student Management (Add, View, Edit, Delete)
- âœ… Attendance Tracking
- âœ… Progress Monitoring
- âœ… Real-time Updates
- âœ… Responsive Design

### Default Login
- Username: Ash (Facilitator)
- No password required for demo

### Troubleshooting

**"npm is not recognized"**
- Install Node.js from https://nodejs.org/
- Restart your computer after installation

**Port 3000 already in use**
- Close other development servers
- Or use: `npm run dev -- --port 3001`

**Build errors**
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

## Project Structure
```
src/
â”œâ”€â”€ app/           # Next.js pages
â”œâ”€â”€ components/    # React components
â”œâ”€â”€ contexts/      # Global state management
â””â”€â”€ lib/          # Utilities

Key Files:
- Dashboard: src/app/page.tsx
- Students: src/app/students/page.tsx
- Attendance: src/app/attendance/page.tsx
```

## Support
If you need help, check that:
1. Node.js is properly installed
2. You're in the correct directory
3. All dependencies are installed
4. The development server is running

Happy Learning! ðŸŽ“
