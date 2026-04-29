# Environment Configuration

This project uses environment variables for secure configuration.

## Setup for Vercel

Add these environment variables in Vercel Dashboard (Settings → Environment Variables):

### Required Variables:

**Frontend (Public - prefix with NEXT_PUBLIC_):**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase Anon/Publishable key
- `NEXT_PUBLIC_SITE_URL` - Your site URL (e.g., https://your-app.vercel.app)

**Backend (Secret - NO prefix):**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase Service Role key (SECRET!)
- `NOTION_CLIENT_ID` - Notion OAuth Client ID
- `NOTION_CLIENT_SECRET` - Notion OAuth Client Secret
- `FS_CLIENT_ID` - FatSecret Client ID
- `FS_CLIENT_SECRET` - FatSecret Client Secret
- `MASTER_ENCRYPTION_KEY` - 32-byte encryption key (generate with: `openssl rand -hex 32`)
- `CRON_SECRET` - Secret for protecting cron endpoints

## How it works

1. **During Vercel build**: The `scripts/generate-env.js` script runs before build and generates environment files from Vercel variables
2. **Local development**: The script uses template files with placeholder values
3. **Security**: Real environment files are in `.gitignore` and never committed to git

## Local Development

For local development, the template files will be used automatically. If you need real values locally, set the environment variables in your terminal or create a `.env` file (not committed).

## Files

- `environment.template.ts` - Template with placeholders (committed to git)
- `environment.development.template.ts` - Development template (committed to git)
- `environment.ts` - Generated file (NOT committed, in .gitignore)
- `environment.development.ts` - Generated file (NOT committed, in .gitignore)
