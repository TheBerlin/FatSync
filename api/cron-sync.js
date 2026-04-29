import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Cron job handler - runs twice daily (7am & 6pm)
 * Syncs data for all connected users
 */
export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all users with both FatSecret and Notion connected
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, fs_connected, notion_connected')
      .eq('fs_connected', true)
      .eq('notion_connected', true);

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        message: 'No users to sync',
        synced: 0,
      });
    }

    // Sync data for each user
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed for user ${user.email}`);
        }

        return { userId: user.id, email: user.email };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Cron sync completed: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      message: 'Cron sync completed',
      total: users.length,
      successful,
      failed,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cron sync error:', error);
    return res.status(500).json({
      error: 'Cron sync failed',
      message: error.message
    });
  }
}
