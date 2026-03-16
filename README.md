# Lookout Mode Mail

A custom email marketing platform built with Next.js 16, TypeScript, Tailwind CSS, and Prisma.

## Features

- **Contacts Management**: Admin panel to view, filter, and manage contacts.
- **Campaign Management**: Create, view, replicate, and manage email campaigns.
- **Subscription Form**: Embeddable form for `lookoutmode.nl` integration.
- **Email Viewing**: Public "View in Browser" pages for campaigns.
- **API**: RESTful API for integration.

## Setup

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Database Setup**:
    This project uses SQLite for development.

    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the subscription form.
    Open [http://localhost:3000/admin/contacts](http://localhost:3000/admin/contacts) for Contacts Admin.
    Open [http://localhost:3000/admin/campaigns](http://localhost:3000/admin/campaigns) for Campaigns Admin.

## API Integration

### Subscribe Endpoint

**POST** `/api/subscribe`
Body:

```json
{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
}
```

### External Integration

To integrate the form on `lookoutmode.nl`, you can post directly to the `/api/subscribe` endpoint if CORS allows, or use the provided React component `components/subscribe-form.tsx`.

## Project Structure

- `app/admin/`: Admin dashboard pages.
- `app/api/`: API routes.
- `components/`: UI components (shadcn/ui) and feature components.
- `prisma/`: Database schema.
- `lib/`: Utilities (Prisma client).

## Deployment

1.  Set `DATABASE_URL` env var (e.g. to Postgres connection string).
2.  Run `npx prisma migrate deploy` in build pipeline.
3.  Build with `npm run build`.
4.  Start with `npm start`.
