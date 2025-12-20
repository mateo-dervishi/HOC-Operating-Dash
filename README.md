# HOC Operations Dashboard

Internal operations dashboard for House of Clarence.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL migration in Supabase SQL Editor:
- File: `supabase/migrations/001_operations_platform.sql`

### 4. Add Admin User

Add yourself as an admin in Supabase SQL Editor:

```sql
INSERT INTO admin_users (email, name, role, is_active)
VALUES ('your-email@houseofclarence.uk', 'Your Name', 'admin', true);
```

### 5. Run Development Server

```bash
npm run dev
```

## Access Control

- Only `@houseofclarence.uk` emails can access the dashboard
- Users must be manually added to the `admin_users` table
- Roles: `admin`, `manager`, `sales`, `operations`

## Features

- Dashboard with key metrics
- Client pipeline (CRM)
- Quote management
- Order tracking
- Delivery scheduling
- Team management
- Role-based access control

