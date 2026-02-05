# Getting Started with Development

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Workflow

### Making Changes

1. **Edit Components**
   - Components are in `src/components/`
   - Changes auto-reload in browser

2. **Add New Pages**
   - Create file in `src/app/[name]/page.tsx`
   - Update navigation in `src/components/Sidebar.tsx`

3. **Styling**
   - Use Tailwind CSS classes
   - Custom colors defined in `tailwind.config.ts`
   - Global styles in `src/app/globals.css`

### Code Organization

```
src/
├── app/              # Pages and routes
│   ├── layout.tsx   # Root layout (includes Sidebar)
│   ├── page.tsx     # Home/Dashboard page
│   └── globals.css  # Global styles
├── components/      # Reusable components
│   ├── Sidebar.tsx  # Main navigation
│   └── Header.tsx   # Page headers
└── lib/            # Utilities
    └── utils.ts    # Helper functions
```

### Adding Backend API

When you're ready to add a backend:

1. **Create API Route**
   ```typescript
   // src/app/api/students/route.ts
   export async function GET() {
     return Response.json({ students: [] })
   }
   ```

2. **Fetch Data in Component**
   ```typescript
   const response = await fetch('/api/students')
   const data = await response.json()
   ```

3. **Update next.config.mjs**
   Remove `output: 'export'` to enable API routes

## Tips for Development

- **Hot Reload:** Changes appear instantly in the browser
- **TypeScript:** Use types for better code quality
- **Components:** Break UI into small, reusable pieces
- **Tailwind:** Use utility classes instead of custom CSS

## Next Steps

1. ✅ Familiarize yourself with the codebase
2. ⬜ Add authentication system
3. ⬜ Integrate database
4. ⬜ Build out remaining pages
5. ⬜ Add form validation
6. ⬜ Implement API endpoints
