# Look Out Email Campaign System

## Setup

1.  **Install Dependencies**:

    ```bash
    npm install
    npm install papaparse @types/papaparse @tiptap/react @tiptap/starter-kit @tiptap/extension-link --legacy-peer-deps
    ```

2.  **Database**:
    Ensure your `.env` has a valid `DATABASE_URL`.
    Run migrations:

    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Features Implemented

- **Contact Management**: Import/Export CSV, Edit/Delete, Bulk Delete.
- **Campaigns**: Create, Edit (Rich Text), Send (Simulated), List View.
- **Public Pages**: Subscribe, Unsubscribe, Preferences, Archive.
- **API**: REST endpoints for all major actions.

## Sending Emails

Currently, the system simulates sending emails by logging to the console and creating database records.
To enable real sending, update `app/api/campaigns/[id]/send/route.ts` with your email provider (e.g., Resend, AWS SES, or Nodemailer).
