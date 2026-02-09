# TutorHub - Tutor Marketplace

A full-stack tutor marketplace MVP built with Next.js 15, connecting students with tutors for online tutoring sessions.

## Features

### For Students
- 🔍 Search and filter tutors by subject, price, and availability
- 📅 Book tutoring sessions with calendar-based scheduling
- 💳 Secure payments via Stripe
- ⭐ Leave reviews for completed sessions
- 📊 Dashboard to track bookings

### For Tutors
- 👤 Create detailed tutor profiles with bio, subjects, and pricing
- ⏰ Set flexible availability schedules
- 📋 Manage incoming bookings
- 💰 Receive payments via Stripe Connect (with 15% platform fee)
- 📈 Track earnings and reviews

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Payments:** Stripe (Checkout + Connect)
- **UI Components:** Custom shadcn/ui-style components

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tutoringtwo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/tutormarketplace?schema=public"

   # NextAuth
   AUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Enable Stripe Connect in your Stripe settings
4. For local development, use the Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── bookings/      # Booking CRUD
│   │   ├── checkout/      # Stripe checkout
│   │   ├── reviews/       # Review submissions
│   │   ├── tutor/         # Tutor profile & availability
│   │   ├── tutors/        # Tutor search
│   │   ├── user/          # User profile
│   │   └── webhooks/      # Stripe webhooks
│   ├── bookings/          # Booking pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── profile/           # User profile
│   ├── register/          # Registration page
│   ├── tutor/             # Tutor-specific pages
│   └── tutors/            # Tutor search & profiles
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── layout/            # Header, Footer
│   ├── tutor/             # Tutor-specific components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── stripe.ts          # Stripe utilities
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
└── prisma/
    └── schema.prisma      # Database schema
```

## Database Schema

### Models
- **User** - Students and tutors
- **TutorProfile** - Extended profile for tutors
- **AvailabilitySlot** - Tutor availability windows
- **Booking** - Session bookings
- **Review** - Student reviews
- **Message** - Chat messages (future feature)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in

### Tutors
- `GET /api/tutors` - Search tutors with filters
- `GET /api/tutors/[id]` - Get tutor profile

### Tutor Profile
- `GET /api/tutor/profile` - Get own profile
- `POST /api/tutor/profile` - Create/update profile
- `GET /api/tutor/availability` - Get availability
- `POST /api/tutor/availability` - Set availability
- `GET /api/tutor/stripe` - Get Stripe status
- `POST /api/tutor/stripe` - Start Stripe onboarding

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking status

### Payments
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Reviews
- `POST /api/reviews` - Submit review

## Development

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name <migration-name>
```

### Testing Stripe Payments

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
- Update `NEXTAUTH_URL` to your production URL
- Update `NEXT_PUBLIC_APP_URL` to your production URL
- Use production Stripe keys
- Set up Stripe webhook endpoint in Stripe Dashboard

## License

MIT
