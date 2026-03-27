import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ENCRYPTION_KEY = process.env.MASTER_ENCRYPTION_KEY;

/**
 * Cipher function
 */
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 
 */
export default async function handler(req, res) {
    const { oauth_token, oauth_verifier, email} = req.query;

    // Read secret from Cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        acc[k] = v;
        return acc;
    }, {}) || {};
    const req_sec = cookies['fs_req_sec'];

    const oauth = new OAuth({
        consumer: { key: process.env.FS_CLIENT_ID, secret: process.env.FS_CLIENT_SECRET},
        signature_method: 'HMAC-SHA1',
        hash_function: (base, key) => crypto.createHmac('sha1', key).update(base).digest('base64'),
    });

    try {
        const tokenUrl = 'https://authentication.fatsecret.com/oauth/access_token';
        const authData = oauth.authorize({
            url: tokenUrl,
            method: 'POST',
            data: { oauth_verifier }
        },
        {
            key: oauth_token,
            secret: req_sec,
        });

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(authData).toString()
        });

        const tokenText = await tokenRes.text();
        const tokenParams = new URLSearchParams(tokenText);
        const fsKey = tokenParams.get('oauth_token');
        const fsSecret = tokenParams.get('oauth_token_secret');

        // Store in DB
        const { error } = await supabase
        .from('profiles')
        .update({
            fs_access_token: encrypt(fsKey),
            fs_access_token_secret: encrypt(fsSecret),
            fs_connected: true,
            last_sync: new Date().toISOString()
        })
        .eq('email', email);

        if (error) throw error;

        // Redirect back to app
        res.redirect(`/dashboard?status=fs_success`);
    } catch (error) {
        console.error("Callback error: ", error);
        res.redirect(`/dashboard?status=error&message=fs_failed`);
    }
}