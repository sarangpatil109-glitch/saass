const fs = require('fs');
const https = require('https');

const ENV_PATH = '.env.local';
const content = fs.readFileSync(ENV_PATH, 'utf-8');
const env = {};
content.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/exec_sql';
const key = env.SUPABASE_SERVICE_ROLE_KEY;

// Wait, exec_sql doesn't exist, we established that. 
// So we must use postgres. Can we use the psql command?
