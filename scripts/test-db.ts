import { createClient } from '@supabase/supabase-js';

async function checkDb() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test getting a holding
    const { data: holding, error } = await supabase.from('holdings').select('*').limit(1);
    if (error) {
        console.error('Error fetching holdings:', error);
    } else {
        console.log('Holdings type check:', typeof holding?.[0]?.quantity);
        console.log('Holdings sample:', holding);
    }
}

checkDb();
