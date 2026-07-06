const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data: execs, error } = await supabase.from('sales_executives').select('id, employee_code').order('created_at', { ascending: true });
  if (error) {
    console.log('Error fetching:', error);
    return;
  }
  
  let count = 1;
  for (const exec of execs) {
    if (!exec.employee_code.startsWith('SE-')) {
      const newCode = `SE-${count.toString().padStart(6, '0')}`;
      console.log(`Updating ${exec.id} from ${exec.employee_code} to ${newCode}`);
      const { error: updateError } = await supabase.from('sales_executives').update({ employee_code: newCode }).eq('id', exec.id);
      if (updateError) {
        console.log(`Error updating ${exec.id}:`, updateError);
      } else {
        count++;
      }
    } else {
      const num = parseInt(exec.employee_code.replace('SE-', ''), 10);
      if (num >= count) {
        count = num + 1;
      }
    }
  }
  console.log('Done!');
}

run();
