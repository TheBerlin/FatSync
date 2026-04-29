const fs = require('fs');
const path = require('path');

const environmentsDir = path.join(__dirname, '../src/environments');

// Check if environment variables are set (Vercel build)
const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (hasEnvVars) {
  // Generate from environment variables (Vercel)
  const productionEnv = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
  supabaseKey: '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
};
`;

  const developmentEnv = `export const environment = {
  production: false,
  supabaseUrl: '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
  supabaseKey: '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
};
`;

  fs.writeFileSync(
    path.join(environmentsDir, 'environment.ts'),
    productionEnv
  );

  fs.writeFileSync(
    path.join(environmentsDir, 'environment.development.ts'),
    developmentEnv
  );

  console.log('✅ Environment files generated from Vercel variables');
} else {
  // Copy from template files (local development)
  const templateProd = path.join(environmentsDir, 'environment.template.ts');
  const templateDev = path.join(environmentsDir, 'environment.development.template.ts');

  if (fs.existsSync(templateProd)) {
    fs.copyFileSync(
      templateProd,
      path.join(environmentsDir, 'environment.ts')
    );
  }

  if (fs.existsSync(templateDev)) {
    fs.copyFileSync(
      templateDev,
      path.join(environmentsDir, 'environment.development.ts')
    );
  }

  console.log('⚠️  Using template files (local development mode)');
  console.log('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for production build');
}
