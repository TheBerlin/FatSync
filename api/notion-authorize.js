export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/notion-callback`;

  // Url for authorization
  const authUrl =
    `https://api.notion.com/v1/oauth/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `owner=user&` +
    `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
    `state=${encodeURIComponent(email)}`;

  res.redirect(authUrl);
}
