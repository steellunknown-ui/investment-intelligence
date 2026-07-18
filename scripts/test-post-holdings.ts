import { createClient } from '@supabase/supabase-js';
import { encryptFields, encryptNumericFields } from '../src/lib/encryption';

async function testPostHoldings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase keys');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Fetch a user ID
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users.users.length) {
        console.error('No users found', userError);
        return;
    }
    const userId = users.users[0].id;

    // 2. Prepare data
    const rawHoldingData = {
        user_id: userId,
        asset_type: 'stock',
        symbol: 'TEST1234',
        name: 'Test Holding',
        quantity: 10,
        avg_buy_price: 150.5
    };

    let newHoldingData = encryptFields(rawHoldingData, [
        'symbol', 'name', 'broker', 'notes', 'account_number'
    ]);

    newHoldingData = encryptNumericFields(newHoldingData, [
        'quantity', 'avg_buy_price'
    ]);

    // 3. Insert
    console.log('Inserting data:', newHoldingData);
    const { data: holding, error } = await supabase
        .from('holdings')
        .insert(newHoldingData)
        .select()
        .single();

    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Successfully inserted:', holding);
    }
}

testPostHoldings();
