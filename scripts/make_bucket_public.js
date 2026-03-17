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
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']; // Service role usually needed for bucket management

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Updating avatars bucket to public...');
        const { data, error } = await supabase.storage.updateBucket('avatars', {
            public: true
        });

        if (error) {
            console.error('Error updating bucket:', error);
            // Try createBucket with on conflict if update fails?
            // Usually update works for changing public status
            return;
        }

        console.log('Bucket updated successfully to public.');
    } catch (e) {
        console.error('Exception:', e);
    }
}

run();
