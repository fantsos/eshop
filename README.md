# E-Shop

Full-featured bilingual e-shop (Greek/English) built with modern web technologies. Live at [eshop.fantsos.gr](https://eshop.fantsos.gr).

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: NextAuth.js (Credentials + Google OAuth)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (cart, wishlist, recently viewed)
- **Payments**: Stripe, PayPal, Bank Transfer, Cash on Delivery, IRIS
- **i18n**: next-intl (Greek + English)
- **Deployment**: Docker Compose

## Features

### Storefront
- Product catalog with search, filters (category, brand, price range), sorting and pagination
- Hierarchical categories (e.g. Electronics > Smartphones)
- Shopping cart with persistent state (localStorage)
- Wishlist
- Multi-step checkout (Address > Payment > Review)
- 5 payment methods (Stripe, PayPal, Bank Transfer, COD with fee, IRIS)
- Order history with invoice generation (HTML)
- Product reviews & ratings
- Flash sale countdown timers
- Deals page
- Recently viewed products
- Account management (profile, addresses)
- Coupon/discount system

### Admin Panel (`/admin`)
- Dashboard with sales stats, recent orders, low stock alerts
- Product management (CRUD, image upload, variants)
- CSV import/export for products and orders
- Order management with status updates and email notifications
- User management with role control
- Category management
- Coupon management
- Shipping zone management (zone-based + weight-based rates)
- Store settings (tax rate, free shipping threshold, COD fee)

### SEO & Performance
- Dynamic sitemap.xml and robots.txt
- JSON-LD structured data (Product, Breadcrumb, Organization)
- OpenGraph meta tags
- PWA manifest
- Static asset caching headers

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Docker (Production)

```bash
# Clone
git clone https://github.com/fantsos/eshop.git
cd eshop

# Configure
cp .env.example .env
# Edit .env with your values

# Start
docker compose up -d

# Push schema & seed
docker compose exec eshop-app npx prisma db push
docker compose exec eshop-app npx tsx prisma/seed.ts
```

App runs on port **3871**.

### Local Development

```bash
# Install
npm install --legacy-peer-deps

# Start database
docker compose up eshop-db -d

# Setup database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Run
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (e.g. https://eshop.fantsos.gr) |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |
| `STRIPE_SECRET_KEY` | Stripe API key (optional) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (optional) |
| `SMTP_HOST` | SMTP server for emails (optional) |
| `SMTP_PORT` | SMTP port (default: 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From email address |

## Default Admin

- **Email**: admin@eshop.fantsos.gr
- **Password**: admin123!

## Project Structure

```
src/
  app/
    [locale]/
      (shop)/          # Storefront pages
      admin/           # Admin panel pages
      auth/            # Auth pages
    api/               # API routes
  components/
    admin/             # Admin components
    layout/            # Header, Footer, Providers
    product/           # Product card, filters, reviews, countdown
    seo/               # JSON-LD components
    ui/                # shadcn/ui components
  lib/                 # Auth, Prisma, utils, mail, validators
  messages/            # i18n translations (el.json, en.json)
  stores/              # Zustand stores (cart, wishlist, recently viewed)
prisma/
  schema.prisma        # Database schema (16 models)
  seed.ts              # Sample data
```

## Database Models

User, Category, Product, ProductVariant, Cart, CartItem, Wishlist, Address, Order, OrderItem, Review, Coupon, ShippingZone, Setting + NextAuth (Account, Session, VerificationToken)

## License

MIT
