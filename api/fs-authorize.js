import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export default async function handler(req, res) {
    // Retrieve email from request
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const key = process.env.FS_CLIENT_ID;
    const secret = process.env.FS_CLIENT_SECRET;

    const oauth = new OAuth({
        consumer: { key, secret },
        signature_method: 'HMAC-SHA1',
        hash_function: (base, key) => crypto.createHmac('sha1', key).update(base).digest('base64'),

    });

    const url = 'https://authentication.fatsecret.com/oauth/request_token';
    
    // Check the email
    const CALLBACK_URL = `https://${req.headers.host}/api/fs-callback?email=${encodeURIComponent(email)}`;

    const request_data = {
        url,
        method: 'POST',
        data: { oauth_callback: CALLBACK_URL },
    };

    try {
        const authorizedData = oauth.authorize(request_data);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(authorizedData).toString()
        });

        const text = await response.text();
        const params = new URLSearchParams(text);
        const token = params.get('oauth_token');
        const tokenSecret = params.get('oauth_token_secret');

        if (!token) throw new Error("Could not get request token from FatSecret");

        // Store temp. secret
        res.setHeader('Set-Cookie', `fs_req_sec=${tokenSecret}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax;`);

        res.redirect(`https://authentication.fatsecret.com/oauth/authorize?oauth_token=${token}`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}