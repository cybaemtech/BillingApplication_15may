# BillFlow - SQL Server (MSSQL) Setup

## Overview
GST-compliant accounting suite using Microsoft SQL Server (`billing_application`) with Drizzle schema in `shared/schema.ts`.

## Database Target
- Server: `DESKTOP-9LSMK42\SQLEXPRESS`
- Auth: Windows Authentication
- Database: `billing_application`

## Core Files
- `shared/schema.ts` - Full schema for Auth, Sales, Purchase, Inventory, Expenses, Accounting, GST, POS, Reports, Automation, Settings
- `server/db.ts` - Runtime SQL Server connection config
- `drizzle.config.ts` - Drizzle Kit MSSQL config
- `database/reset_billing_application.sql` - SSMS reset script to remove previous DB state

## Commands
```bash
npm run dev
npm run db:push
npm run db:studio
```

## Notes
- Login and signup are persisted in DB (`users`, `user_roles`, `auth_sessions`, `auth_audit_logs`).
- Use `database/reset_billing_application.sql` in SSMS when you need a full clean database.
