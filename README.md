# Social Intelligence Platform

A web-based social intelligence tool for Low Battery's content team (managing RapTV, Bars, PopHive, Controller, and other brands) to search, analyze, and resurface historical posts across 45M+ followers.

## Features

### MVP (Phase 1) - Implemented

- **Universal Search**: Full-text search across all post captions with filters for brand, platform, date range, content type, and engagement thresholds
- **Viral Score Calculation**: Composite metric based on engagement rate, velocity, and share ratio
- **Top Posts View**: Ranked list of highest-performing content
- **Tentpole Calendar**: Visual calendar with major tentpoles (awards shows, sports, cultural moments)
- **On This Day**: Daily digest showing posts from this date in previous years
- **Analytics Dashboard**: Performance overview across all brands and platforms
- **Data Ingestion**: API integrations for Instagram and TikTok

### Upcoming (Phase 2-3)

- Additional platforms (X, YouTube, Facebook)
- AI auto-tagging for artists and topics
- Similar post finder
- Caption suggestions
- Slack integration
- Predictive analytics

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dirby
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/social_intel"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Push the database schema:
```bash
npm run db:push
```

5. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── posts/        # Posts CRUD
│   │   ├── tentpoles/    # Tentpoles CRUD
│   │   ├── dashboard/    # Dashboard metrics
│   │   ├── on-this-day/  # On This Day data
│   │   └── brands/       # Brands management
│   ├── calendar/         # Tentpole calendar page
│   ├── dashboard/        # Analytics dashboard
│   ├── on-this-day/      # On This Day page
│   ├── posts/[id]/       # Post detail page
│   ├── settings/         # Settings page
│   └── top-posts/        # Top posts page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── posts/            # Post-related components
│   ├── search/           # Search components
│   ├── calendar/         # Calendar components
│   ├── dashboard/        # Dashboard components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── utils.ts          # Utility functions
│   ├── viral-score.ts    # Viral score algorithm
│   └── ingestion/        # Data ingestion services
└── types/                 # TypeScript types
```

## Database Schema

The platform uses the following main models:

- **User**: Team members with role-based access (Admin, Brand Lead, Editor, Viewer)
- **Brand**: Content brands (RapTV, Bars, PopHive, Controller)
- **SocialAccount**: Connected social media accounts
- **Post**: Individual posts with engagement metrics
- **Tentpole**: Major events for content planning
- **PostTentpole**: Association between posts and tentpoles

## API Endpoints

### Posts
- `GET /api/posts` - Search posts with filters
- `GET /api/posts/[id]` - Get post details
- `PATCH /api/posts/[id]` - Update post (mark evergreen, etc.)
- `POST /api/posts` - Create post (for ingestion)

### Tentpoles
- `GET /api/tentpoles` - List tentpoles
- `GET /api/tentpoles/[id]` - Get tentpole details
- `POST /api/tentpoles` - Create tentpole
- `PATCH /api/tentpoles/[id]` - Update tentpole

### Dashboard
- `GET /api/dashboard` - Get dashboard metrics

### On This Day
- `GET /api/on-this-day` - Get On This Day data

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:push    # Push schema to database
npm run db:migrate # Run migrations
npm run db:seed    # Seed database
npm run db:studio  # Open Prisma Studio
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - Low Battery Media
