const fs = require('fs');
const path = require('path');

// Paths
const envTestPath = path.join(__dirname, '../.env.test');
const environmentTsPath = path.join(__dirname, '../apps/frontend/src/environments/environment.ts');

// Function to read .env file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

// Main logic
try {
  console.log('Syncing environment.ts with .env.test...');
  
  // 1. Get values from .env.test
  const envVars = parseEnvFile(envTestPath);
  const supabaseUrl = envVars.SUPABASE_URL;
  // Note: .env.test uses SUPABASE_PUBLIC_KEY, environment.ts uses supabaseKey
  const supabaseKey = envVars.SUPABASE_PUBLIC_KEY || envVars.SUPABASE_KEY; 

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_PUBLIC_KEY not found in .env.test');
    process.exit(1);
  }

  // 2. Read environment.ts
  if (!fs.existsSync(environmentTsPath)) {
    console.error(`Error: File not found: ${environmentTsPath}`);
    process.exit(1);
  }
  let tsContent = fs.readFileSync(environmentTsPath, 'utf8');

  // 3. Replace values using Regex
  // Matches supabaseUrl: '...' OR supabaseUrl: "..."
  const urlRegex = /supabaseUrl:\s*['"][^'"]*['"]/;
  const keyRegex = /supabaseKey:\s*['"][^'"]*['"]/;

  tsContent = tsContent.replace(urlRegex, `supabaseUrl: '${supabaseUrl}'`);
  tsContent = tsContent.replace(keyRegex, `supabaseKey: '${supabaseKey}'`);

  // 4. Write back
  fs.writeFileSync(environmentTsPath, tsContent, 'utf8');
  
  console.log('✅ Successfully updated apps/frontend/src/environments/environment.ts');
  console.log(`   supabaseUrl: ${supabaseUrl}`);
  console.log(`   supabaseKey: ${supabaseKey.substring(0, 10)}...`);

} catch (error) {
  console.error('Failed to sync environment:', error);
  process.exit(1);
}
