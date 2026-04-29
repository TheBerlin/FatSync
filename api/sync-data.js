import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ENCRYPTION_KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');

/**
 * Decrypt function
 */
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Get today's nutrition data from FatSecret
 */
async function getFatSecretData(accessToken, accessSecret) {
  const oauth = new OAuth({
    consumer: {
      key: process.env.FS_CLIENT_ID,
      secret: process.env.FS_CLIENT_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (base, key) => crypto.createHmac('sha1', key).update(base).digest('base64'),
  });

  const url = 'https://platform.fatsecret.com/rest/server.api';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const requestData = {
    url,
    method: 'POST',
    data: {
      method: 'food_entries.get',
      format: 'json',
      date: today.replace(/-/g, ''), // YYYYMMDD format
    },
  };

  const authData = oauth.authorize(requestData, {
    key: accessToken,
    secret: accessSecret,
  });

  console.log('FatSecret request:', {
    url,
    date: today.replace(/-/g, ''),
    hasToken: !!accessToken,
    hasSecret: !!accessSecret
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(authData).toString(),
  });

  const data = await response.json();

  console.log('FatSecret API response:', JSON.stringify(data, null, 2));

  // Parse nutrition data
  const entries = data.food_entries?.food_entry || [];
  console.log('Food entries count:', entries.length);

  let totalCalories = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalProtein = 0;

  entries.forEach(entry => {
    totalCalories += parseFloat(entry.calories || 0);
    totalCarbs += parseFloat(entry.carbohydrate || 0);
    totalFat += parseFloat(entry.fat || 0);
    totalProtein += parseFloat(entry.protein || 0);
  });

  return {
    date: today,
    calories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    protein: Math.round(totalProtein),
  };
}

/**
 * Save data to Notion database
 */
async function saveToNotion(notionToken, dbId, data, weight) {
  if (!dbId) {
    throw new Error('Notion database ID is missing');
  }

  console.log('Saving to Notion:', { dbId, data, weight });

  const notion = new Client({ auth: notionToken });

  // Check if entry for today already exists
  const today = new Date().toISOString().split('T')[0];

  // Use search instead of databases.query
  const existing = await notion.search({
    filter: {
      property: 'object',
      value: 'page'
    },
    query: today,
  });

  // Normalize database IDs (remove dashes for comparison)
  const normalizedDbId = dbId.replace(/-/g, '');

  // Filter results to match our database and date
  const todayPage = existing.results.find(page => {
    const pageDbId = page.parent?.database_id;
    if (!pageDbId) return false;

    return pageDbId.replace(/-/g, '') === normalizedDbId &&
           page.properties?.Date?.date?.start === today;
  });

  const properties = {
    Date: { date: { start: today } },
    Calories: { number: data.calories },
    Carbs: { number: data.carbs },
    Fat: { number: data.fat },
    Protein: { number: data.protein },
  };

  if (weight) {
    properties.Weight = { number: weight };
  }

  if (todayPage) {
    // Update existing entry
    await notion.pages.update({
      page_id: todayPage.id,
      properties,
    });
  } else {
    // Create new entry
    await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    });
  }
}

/**
 * Main sync handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user profile with tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!profile.fs_connected || !profile.notion_connected) {
      return res.status(400).json({
        error: 'FatSecret or Notion not connected',
        fs_connected: profile.fs_connected,
        notion_connected: profile.notion_connected,
      });
    }

    // Decrypt FatSecret tokens
    const fsToken = decrypt(profile.fs_access_token);
    const fsSecret = decrypt(profile.fs_access_token_secret);

    console.log('Decrypted tokens length:', {
      token: fsToken?.length,
      secret: fsSecret?.length
    });

    // Get data from FatSecret
    const nutritionData = await getFatSecretData(fsToken, fsSecret);
    console.log('Nutrition data from FatSecret:', nutritionData);

    // Save to Supabase daily_metrics
    const { error: metricsError } = await supabase
      .from('daily_metrics')
      .upsert({
        user_id: userId,
        date: nutritionData.date,
        actual_calories: nutritionData.calories,
        actual_carbs: nutritionData.carbs,
        actual_fat: nutritionData.fat,
        actual_protein: nutritionData.protein,
      }, {
        onConflict: 'user_id,date',
      });

    if (metricsError) {
      console.error('Supabase error:', metricsError);
    } else {
      console.log('Successfully saved to Supabase daily_metrics');
    }

    // Save to Notion (only if database ID is configured)
    if (profile.notion_db_id) {
      await saveToNotion(
        profile.notion_token,
        profile.notion_db_id,
        nutritionData,
        profile.weight
      );
    } else {
      console.log('Skipping Notion sync: database ID not configured');
    }

    // Update last_sync timestamp
    await supabase
      .from('profiles')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', userId);

    return res.status(200).json({
      success: true,
      data: nutritionData,
      synced_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: error.message
    });
  }
}
