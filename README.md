# D3 Volleyball Game Management Platform

Phase 1: Foundation, architecture, authentication, database setup, and UI groundwork.

## Getting started

1. Copy `.env.example` to `.env`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a PostgreSQL database and update `DATABASE_URL`.
4. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Phase 1 scope

- Next.js app router setup
- Tailwind CSS styles
- Prisma PostgreSQL schema
- NextAuth credentials auth
- Register / Sign-in flows
- Landing page and branding UI foundation
- Docker-ready config
