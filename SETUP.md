# Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project settings or `.env` file:

### Supabase
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
```

### FatSecret API
```
FS_CLIENT_ID=your_fatsecret_client_id
FS_CLIENT_SECRET=your_fatsecret_client_secret
```

### Notion API
```
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

### Encryption
```
MASTER_ENCRYPTION_KEY=your_32_character_encryption_key
```
Generate with: `openssl rand -hex 16`

### Site URL
```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Cron Security
```
CRON_SECRET=your_random_secret_string
```
Generate with: `openssl rand -hex 32`

## Vercel Cron Jobs

The app uses Vercel Cron Jobs to sync data automatically twice daily:
- **7:00 AM** - Morning sync
- **6:00 PM** - Evening sync

Cron jobs are configured in `vercel.json` and will run automatically after deployment.

## Supabase Database Schema

### Table: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  weight DECIMAL,
  is_premium BOOLEAN DEFAULT false,
  fs_connected BOOLEAN DEFAULT false,
  fs_access_token TEXT,
  fs_access_token_secret TEXT,
  notion_connected BOOLEAN DEFAULT false,
  notion_token TEXT,
  notion_db_id TEXT,
  widget_token UUID DEFAULT gen_random_uuid(),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `daily_metrics`
```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories INTEGER,
  carbs INTEGER,
  fat INTEGER,
  protein INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### Table: `user_goals` (optional)
```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  target_calories INTEGER,
  target_protein INTEGER,
  target_fat INTEGER,
  target_carbs INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Testing the Sync

### Manual Sync
1. Go to `/dashboard`
2. Click "Sync Now" button
3. Check console for any errors

### Cron Sync (Local Testing)
```bash
curl -X POST http://localhost:3000/api/cron-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Vercel Cron (Production)
Cron jobs run automatically. Check logs in Vercel dashboard under "Functions" tab.

## Troubleshooting

### Sync fails with "User not found"
- Check that user exists in `profiles` table
- Verify `userId` is correct

### Sync fails with "FatSecret or Notion not connected"
- User must complete OAuth flow for both services
- Check `fs_connected` and `notion_connected` flags in database

### Cron job not running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel function logs for errors
- Ensure cron schedule is valid in `vercel.json`

### Encryption errors
- Verify `MASTER_ENCRYPTION_KEY` is exactly 32 characters (16 bytes hex)
- Key must be the same across all deployments
