# YEHA - Youth Education & Skills Management System

A comprehensive SSETA NVC Level 2 Training Management Platform for facilitators to manage students, training sites, assessments, and curriculum delivery.

## 🚀 Features

- **Dashboard Overview** - Real-time statistics and cohort progress tracking
- **Student Management** - Track student progress, attendance, and assessments
- **Training Sites** - Manage multiple training venues and locations
- **Attendance Tracking** - Daily attendance marking and reporting
- **Assessment Management** - POE (Portfolio of Evidence) tracking and grading
- **Curriculum Library** - Access to training materials and lesson plans
- **AI Assistant** - Automated lesson planning and reporting assistance
- **Compliance** - SSETA compliance tracking and reporting

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Static Export (can be hosted anywhere)

## 📦 Installation

### Prerequisites
- Node.js 18.0 or higher
- npm, yarn, or pnpm

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

3. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
learnership-management/
├── src/
│   ├── app/                  # Next.js app router pages
│   │   ├── layout.tsx       # Root layout with sidebar
│   │   ├── page.tsx         # Dashboard page
│   │   └── globals.css      # Global styles
│   ├── components/          # Reusable React components
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   └── Header.tsx       # Page header component
│   └── lib/                 # Utility functions
│       └── utils.ts         # Helper utilities
├── public/                  # Static assets
├── docs/                    # Documentation
├── _next/                   # Old static build (backup)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
└── next.config.mjs         # Next.js config
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run export` - Build and export as static HTML

## 🎨 Customization

### Colors
Main brand colors are defined in `tailwind.config.ts`:
- **Primary:** `#1a3c27` (Deep Green)
- **Secondary:** `#c17f59` (Terracotta)
- **Background:** `#f5f1e8` (Warm Beige)

### Adding New Pages
1. Create a new file in `src/app/[page-name]/page.tsx`
2. Add navigation item in `src/components/Sidebar.tsx`

### Components
Create reusable components in `src/components/` and import them as needed.

## 🚀 Deployment

### Static Export (Current Setup)
```bash
npm run build
```
This creates an `out/` folder with static HTML files that can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### Server Deployment
To enable server-side features:
1. Remove `output: 'export'` from `next.config.mjs`
2. Deploy to Vercel, Netlify, or any Node.js hosting

## 🔮 Future Enhancements

### Phase 1 - Current (Static Frontend)
- ✅ Dashboard interface
- ✅ Component-based architecture
- ✅ Responsive design

### Phase 2 - Backend Integration (Planned)
- [ ] API routes for data management
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication system
- [ ] File upload functionality
- [ ] Real-time data updates

### Phase 3 - Advanced Features (Planned)
- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] Advanced analytics
- [ ] Automated reporting
- [ ] Integration with SSETA systems

## 📝 Development Notes

### Adding a Backend
When ready to add a backend:

1. **Create API Routes**
   ```typescript
   // src/app/api/students/route.ts
   export async function GET() {
     // Fetch students from database
   }
   ```

2. **Database Setup**
   - Install Prisma: `npm install prisma @prisma/client`
   - Initialize: `npx prisma init`
   - Define schema in `prisma/schema.prisma`

3. **Environment Variables**
   Create `.env.local`:
   ```
   DATABASE_URL="your-database-url"
   NEXTAUTH_SECRET="your-secret"
   ```

## 🤝 Contributing

This is a private training management system. For internal development:
1. Create feature branches from `main`
2. Test thoroughly before merging
3. Document any new features

## 📄 License

Proprietary - YEHA Training Management System

## 👥 Support

For technical support or questions:
- **Developer:** Created with KIMI AI assistance
- **Platform:** SSETA NVC Level 2 Training Management

## 🔍 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**TypeScript errors:**
```bash
# Check types
npx tsc --noEmit
```

---

**Version:** 1.0.0  
**Last Updated:** February 4, 2026  
**Built with:** Next.js 14, TypeScript, Tailwind CSS
