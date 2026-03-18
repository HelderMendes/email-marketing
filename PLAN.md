# Lookout Mode Mail - Project Plan

## 1. Technology Stack

Your proposed stack is excellent and modern. It provides type safety, performance, and rapid UI development.

- **Framework**: Next.js 16 (App Router) - Perfect for SEO-friendly public pages (like "View in Browser") and dynamic dashboards.
- **Language**: TypeScript - Essential for maintainability.
- **Styling**: Tailwind CSS - Rapid styling.
- **Components**: shadcn/ui - Beautiful, accessible, and customizable components for the admin panel.
- **Database**: PostgreSQL (recommended via Supabase or Neon) - Relational data is crucial for contacts, campaigns, and logs.
- **ORM**: Prisma - For easy database interaction.
- **Email Service**: Resend (recommended for developer experience) or AWS SES.
- **Queue System**: Upstash Redis + QStash or Inngest (Crucial for sending bulk emails reliably without timing out).

## 2. Core Features Breakdown

### 1) Contacts Administration

- **Data Model**: `Contact` table with fields: Email, FirstName, LastName, Status (subscribed/unsubscribed), Tags, Source (form/import), CreatedAt, UpdatedAt.
- **UI**: Data Table (shadcn/ui `Table`) with sorting, filtering, and bulk actions (Select All -> Delete/Export).
- **Functionality**:
    - Import CSV.
    - Manual Add.
    - Edit details.

### 2) Campaign Administration

- **Data Model**: `Campaign` table.
- **UI**: Dashboard listing campaigns with status badges (Draft/Sent).
- **Actions**:
    - **Replicate**: Deep copy of a campaign record.
    - **View**: Preview the HTML.
    - **Delete**: Remove (soft delete recommended).
    - **Rename**: Update title.

### 3) Subscription Form (The "Lookout Mode" Widget)

- **Design**: Match snapshot (Beige/Green theme).
- **Implementation**:
    - Internal use: React Component.
    - External use (lookoutmode.nl): Generate a unique embed code or simple HTML form posting to your API.

### 4 & 5) Email Templates (Header & Footer)

- **Templating**: Use `react-email` to build templates using React components.
- **Standard Layout**:
    - **Header**: "View in browser" link (Dynamic link to `/campaigns/[id]/view`).
    - **Body**: The unique content.
    - **Footer**: Legal compliance, Unsubscribe link (Dynamic link with token), Update Preferences.

### 6) Integration & API

- **API Keys**: Yes, you need an `ApiKey` table.
    - Access: restricted to specific domains (CORS).
    - Capabilities: `contacts.create`, `campaigns.read`.
- **Public Archive**: A public page `/archive` fetching `sent` campaigns via API.

## 3. Additional Recommendations (Missing Items)

- **Bounce Handling**: Webhook listener to update contact status to `bounced` so you stop emailing them (protects reputation).
- **Rate Limiting**: Protect your signup form from bot spam (Cloudflare Turnstile or simple rate limits).
- **Queue/Background Jobs**: Next.js functions have timeouts. Sending 1,000+ emails requires a background job queue.
- **List-Unsubscribe Header**: Implementation for Gmail/Outlook "one-click unsubscribe" support.

## 4. Implementation Roadmap

### Phase 1: Setup & Database

- Initialize Next.js project.
- Set up Database schemas (Prisma).
- Install shadcn/ui.

### Phase 2: Contacts System

- Build API for CRUD contacts.
- Build Admin UI for contacts.

### Phase 3: Campaign System

- Campaign Editor (Rich Text or Markdown).
- Campaign Dashboard.
- Email Template Builder (`react-email`).

### Phase 4: Sending Architecture

- Integrate Email Provider (Resend/AWS).
- Set up Queue system for bulk sending.

### Phase 5: Public Pages & Forms

- "View in Browser" page.
- Unsubscribe functionality.
- Subscription Form Component.
- API Key generation for external sites.

### Phase 6: Analytics & Polish

- Open tracking (pixel).
- Click tracking (link wrapping).
