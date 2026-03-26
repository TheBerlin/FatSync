const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.ts');

const envConfigFile = `export const environment = {
production: true,
supabaseUrl: '${process.env['SUPABASE_URL'] || ''}',
supabaseKey: '${process.env['SUPABASE_KEY'] || ''}',
};
`;

const dir = path.join(__dirname, './src/environments');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);