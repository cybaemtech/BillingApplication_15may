# BillFlow — Modern Billing & Accounting

Professional billing, invoicing, and accounting software for modern businesses. GST-compliant with inventory, POS, and financial reporting.

## Technologies

This project is built with:

- **Frontend**: Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: Express, Node.js
- **Database**: MSSQL with Drizzle ORM

## Getting Started

1. **Install Dependencies**:
   ```sh
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your database credentials.

3. **Run Development Server**:
   ```sh
   npm run dev
   ```

## Development

- `npm run dev`: Starts both the backend server and the frontend dev server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint for code quality.
- `npm run test`: Runs unit tests with Vitest.
- `npm run db:push`: Pushes schema changes to the database.
