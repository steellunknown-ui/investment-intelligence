const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual dotenv loading
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
        }
    });
} catch (err) {
    console.error("⚠️ Failed to load .env.local manually:", err.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log("🔍 Checking for users in inactivity_tracker...");
    const { data: trackers } = await supabase.from('inactivity_tracker').select('*').limit(1);

    if (!trackers || trackers.length === 0) {
        console.error("❌ No users found in inactivity_tracker table. Please log in on the website first so a tracker row is created!");
        return;
    }

    const testUser = trackers[0];
    const { data: userData } = await supabase.auth.admin.getUserById(testUser.user_id);
    const email = userData?.user?.email;

    console.log(`💡 Found user: ${testUser.user_id} (${email || 'No email set'})`);

    // Set last_login_at to 120 minutes ago to trigger Stage 4
    const pastDate = new Date(Date.now() - 120 * 60 * 1000).toISOString();

    console.log(`Setting last_login_at to 120 minutes ago...`);
    
    const { error } = await supabase
        .from('inactivity_tracker')
        .update({
            last_login_at: pastDate,
            reminder_stage_1_sent: false,
            reminder_stage_2_sent: false,
            reminder_stage_3_sent: false,
            nominee_triggered: false
        })
        .eq('user_id', testUser.user_id);

    if (error) {
         console.error("❌ DB Update failed:", error);
         return;
    }

    console.log(`\n✅ Database updated successfully!`);
    console.log(`User is now simulates as 21-minutes inactive (Triggers ALL stages).`);
    console.log(`Target User Email: ${email}`);
}

run();
