const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, './src/environments/environment.ts');



const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || 'https://placeholder.supabase.co'}',
  supabaseKey: '${process.env.SUPABASE_KEY || 'placeholder'}'
};
`;

const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

try {
    fs.writeFileSync(targetPath, envConfigFile);
} catch (err) {
    console.error('Error writing environment file:', err);
    process.exit(1);
}