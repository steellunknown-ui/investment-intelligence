const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .not('avatar_url', 'is', null);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    profiles.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.full_name}`);
        console.log(`URL: ${p.avatar_url}`);
        console.log('---');
    });
}

test();
