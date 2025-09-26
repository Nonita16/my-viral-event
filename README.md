# My Viral Event

A Next.js application for creating and managing viral events. This app allows users to create events, manage RSVPs, track referrals to boost event attendance, send invites, and analyze event performance through integrated analytics.

## Features

- **Event Management**: Create and manage events with detailed information.
- **User Authentication**: Secure login and registration using Supabase.
- **RSVP System**: Allow users to RSVP to events.
- **Referral Tracking**: Track and incentivize referrals to make events go viral.
- **Invites**: Send email invites using Resend.
- **Analytics**: Monitor event performance with PostHog integration.
- **Responsive Design**: Built with Next.js and Tailwind CSS for a modern UI.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/my-viral-event.git
   cd my-viral-event
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in the required values (see Environment Variables section below)

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project requires the following environment variables to be set in your deployment environment (e.g., Vercel) or in `.env.local` for local development:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `RESEND_API_KEY`: Your Resend API key for email services
- `POSTHOG_KEY`: Your PostHog project API key
- `POSTHOG_HOST`: Your PostHog host URL (e.g., https://app.posthog.com)

## Referral Tracking Explanation

Referral tracking is a key feature that helps events go viral. When users share event links, the app tracks who referred whom through unique referral codes. This allows organizers to:

- Incentivize sharing by offering rewards or priority access to referrers.
- Analyze which channels drive the most RSVPs.
- Build a network effect where each attendee brings more attendees.

The system uses Supabase to store referral relationships and PostHog for tracking user interactions and conversion funnels.

## Database Setup

Run the SQL scripts in the root directory in the following order to set up the database tables:

1. `events_table.sql`: Creates the events table for storing event information.
2. `invites_table.sql`: Creates the invites table for managing referral codes and email invites.
3. `referrals_table.sql`: Creates the referrals table for tracking referral relationships.
4. `rsvps_table.sql`: Creates the RSVPs table for managing event responses.

## Testing

Run the test suite with:

```bash
npm run test
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Connect your GitHub repository to Vercel.
2. Set the environment variables in the Vercel dashboard under Project Settings > Environment Variables.
3. Deploy the project.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Live Site

[Live Site](https://your-app-url.com) (Replace with your actual deployed URL)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
