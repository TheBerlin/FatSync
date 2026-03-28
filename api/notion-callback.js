import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { code, state: email } = req.query;

  if (!code || !email) return res.status(400).json({ error: 'Missing code or email' });

  try {
    // Exchange code for access token
    const authHeader = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/notion-callback`,
      }),
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error_description || data.error);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        notion_access_token: data.access_token,
        notion_database_id: data.duplicated_template_id || null,
        notion_connected: true,
      })
      .eq('email', email);

    if (updateError) throw updateError;

    res.redirect('/dashboard?status=notion_success');
  } catch (error) {
    res.redirect(`/dashboard?status=error&message=${encodeURIComponent(error.message)}`);
  }
}
