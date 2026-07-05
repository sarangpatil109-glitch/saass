import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mpexmihojcysqqvmphth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhtaWhvamN5c3Fxdm1waHRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MTY5MywiZXhwIjoyMDk4NzQ3NjkzfQ.gzn8aKJng8Kt_ajd7a1_w4N8jXtRTTeATPgcY453RUg'
);

async function checkUserMetadata() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (users?.users) {
    for (const u of users.users) {
      console.log(u.email, u.user_metadata);
    }
  }
}

checkUserMetadata();
