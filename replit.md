# PrintShop - QR-Based Print Job Management System

## Overview

PrintShop is a privacy-first, QR-based printing web application designed for print shop environments. The system provides two distinct interfaces:

1. **Public Interface** (`/print`) - Allows customers to upload documents for printing without creating accounts or sharing personal data
2. **Admin Interface** (`/admin/*`) - Protected dashboard for print shop staff to manage and process print jobs

The application emphasizes user privacy by making personal identifiers optional, automatically cleaning up files after printing or timeout, and requiring no user registration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript (ESM modules)
- **Authentication**: Passport.js with Local Strategy and express-session
- **File Handling**: Multer for multipart form uploads, stored in `/uploads` directory
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns

**Shared Schema Pattern**: Database schemas and TypeScript types are defined in `shared/schema.ts` and shared between frontend and backend, ensuring type safety across the stack.

**API Contract Pattern**: Route definitions in `shared/routes.ts` define the API contract with Zod schemas for request/response validation.

**Privacy-First File Handling**: 
- Files are stored temporarily in the `/uploads` directory
- A cleanup cron job (`server/cron.ts`) runs every 15 minutes
- Files are auto-deleted after 1 hour or when jobs are marked complete

### Database Schema

Two main tables:
1. **users** - Admin accounts with username/password
2. **print_jobs** - Print job records with file metadata, print options (color, copies, page range), and status (PENDING, PRINTING, COMPLETED)

### Route Structure

**Public Routes**:
- `/print` - Document upload form
- `/print/success/:id` - Job confirmation page

**Protected Admin Routes**:
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Job management interface

**API Endpoints**:
- `POST /api/upload` - File upload with FormData
- `GET /api/jobs` - List all jobs
- `PATCH /api/admin/jobs/:id/status` - Update job status
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Current user session

## External Dependencies

### Database
- **PostgreSQL** - Primary database (requires `DATABASE_URL` environment variable)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express-session` / `connect-pg-simple` - Session management with PostgreSQL storage
- `passport` / `passport-local` - Authentication
- `multer` - File upload handling
- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations
- `date-fns` - Date formatting

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (has default for development)