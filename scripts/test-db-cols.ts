import { createClient } from '@supabase/supabase-js';

async function checkCols() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'holdings' });
    if (error) {
        // Fallback: try inserting with an invalid column to see the schema error
        const { error: insertError } = await supabase.from('holdings').insert({ invalid_column_xyz: 1 });
        console.error(insertError);
    } else {
        console.log(data);
    }
}

checkCols();
