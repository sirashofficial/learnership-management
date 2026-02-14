# Learnership Management System Overview

The Learnership Management System is a comprehensive platform designed for facilitators to manage students, training sites, assessments, and curriculum delivery for SSETA NVC Level 2 programs.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Prisma ORM with SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: JWT-based (stored in cookies)

## Project Structure

- `src/app`: Page routes and API endpoints.
- `src/components`: Reusable UI components.
- `src/lib`: Core logic, validations, and database client.
- `prisma`: Database schema and migrations.
- `docs`: Extensive project documentation and curriculum source material.

## Key Features

- **Student Management**: Full CRUD, progress alerts, and attendance tracking.
- **Timetable**: Lesson planning and recurring session management.
- **AI Integration**: Analyzer for modules and assessment generation.
- **Reporting**: Progress tracking and cohort management.
